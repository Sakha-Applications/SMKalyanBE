// File: transform_phone_numbers.js

const pool = require("../config/db"); // Your existing database connection pool

/**
 * Extracts and cleans phone numbers from a messy string.
 * Handles various formats, multiple numbers, and text.
 * @param {string} rawPhoneStr - The raw phone number string.
 * @returns {Array<string>} An array of cleaned phone numbers (digits only), or empty array if none found.
 */
function cleanAndExtractPhoneNumbers(rawPhoneStr) {
    if (!rawPhoneStr || typeof rawPhoneStr !== 'string') {
        return [];
    }

    let cleanedStr = rawPhoneStr.trim();
    if (cleanedStr.toLowerCase() === 'undisclosed' || cleanedStr.toLowerCase() === 'na' || cleanedStr === '') {
        return []; // Treat 'undisclosed', 'na', empty string as no numbers
    }

    // Regex to find sequences of digits, potentially with international prefixes (+),
    // and allowing for common separators (spaces, dashes, dots, parentheses)
    const phoneRegex = /\+?\d[\d\s\-\.\(\)]*\d/g;
    let matches = cleanedStr.match(phoneRegex);

    if (!matches) {
        // Fallback for very long concatenated numbers without clear separators
        const longDigitRegex = /\d{10,}/g; // Looks for 10 or more consecutive digits
        matches = cleanedStr.match(longDigitRegex);
    }
    
    if (!matches) {
        return [];
    }

    const cleanedNumbers = [];
    for (let match of matches) {
        // Remove all non-digit characters except '+' at the very beginning
        let number = match.replace(/[^0-9+]/g, ''); 
        if (number.startsWith('+') && number.length > 1) {
            // Already has a country code, ensure it's clean (e.g., remove multiple leading +)
            number = '+' + number.substring(1).replace(/[^0-9]/g, ''); 
        } else {
            // Does not start with '+', just get digits
            number = number.replace(/[^0-9]/g, '');
            // Apply default +91 for 10-digit numbers (common for Indian mobiles)
            if (number.length === 10) {
                number = '+91' + number;
            } else if (number.length === 12 && number.startsWith('91')) { // Already 91 without plus
                number = '+' + number;
            }
        }

        // Basic validation: must be at least 7 digits (local minimum)
        if (number.length >= 7) { 
             cleanedNumbers.push(number);
        }
    }
    
    // Attempt to handle cases like "Number1Number2" that might be joined (e.g. "98865575417207630900")
    if (cleanedNumbers.length === 0 && cleanedStr.match(/^\d+$/)) {
        // If it's a single long string of digits, try to split it into common lengths
        // This is a heuristic, adjust based on observed data
        if (cleanedStr.length === 20 && cleanedStr.startsWith('91')) { // +91XXXXXXXXXX + XXXXXXXXXX
            cleanedNumbers.push('+' + cleanedStr.substring(0, 12)); // Assuming +91 + 10 digits
            cleanedNumbers.push('+' + '91' + cleanedStr.substring(12, 22)); // Second number is also Indian
        } else if (cleanedStr.length === 10) { // Plain 10 digit number assumed Indian
             cleanedNumbers.push('+91' + cleanedStr);
        } else if (cleanedStr.length > 10) { // If it's a very long string, just take the first 10-15 and try to classify
            // This case needs careful review if actual data has very long concatenated numbers.
            // For now, take first 10-12 digits and assume +91 if not present
            let firstPart = cleanedStr.substring(0, 10);
            if (firstPart.length === 10 && !firstPart.startsWith('+')) firstPart = '+91' + firstPart;
            cleanedNumbers.push(firstPart);
            
            let secondPart = cleanedStr.substring(10, 20); // Try to get a second 10-digit number
            if (secondPart.length === 10 && !secondPart.startsWith('+')) secondPart = '+91' + secondPart;
            if (secondPart) cleanedNumbers.push(secondPart);
        }
    }

    // Remove duplicates
    return [...new Set(cleanedNumbers)];
}


async function transformPhoneData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // 1. Fetch all profile_id_raw, phone_number_raw, alternate_phone_number_raw
        const [profiles] = await connection.query(`SELECT profile_id_raw, phone_number_raw, alternate_phone_number_raw FROM profiles_staging`);
        console.log(`Fetched ${profiles.length} profiles for phone number transformation.`);

        const updates = [];
        for (const profile of profiles) {
            const primaryNumbers = cleanAndExtractPhoneNumbers(profile.phone_number_raw);
            const alternateNumbers = cleanAndExtractPhoneNumbers(profile.alternate_phone_number_raw);

            let primaryPhone = null;
            let altPhone = null;

            // Prioritize primaryNumbers list
            if (primaryNumbers.length > 0) {
                primaryPhone = primaryNumbers[0]; // Take the first clean number for primary
                if (primaryNumbers.length > 1) {
                    altPhone = primaryNumbers[1]; // Take second number from primary if present
                }
            }

            // Then incorporate alternateNumbers
            if (alternateNumbers.length > 0) {
                if (altPhone === null) { // If altPhone not already set from primary field
                    altPhone = alternateNumbers[0];
                }
            }

            updates.push({
                profile_id_raw: profile.profile_id_raw,
                phone_number: primaryPhone,
                alternate_phone_number: altPhone
            });
        }

        // 2. Perform batch updates
        const batchSize = 100; // Adjust batch size as needed
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            let updateQueries = batch.map(item => {
                const primaryValue = item.phone_number !== null ? connection.escape(item.phone_number) : 'NULL';
                const altValue = item.alternate_phone_number !== null ? connection.escape(item.alternate_phone_number) : 'NULL';
                return `UPDATE profiles_staging SET phone_number_raw = ${primaryValue}, alternate_phone_number_raw = ${altValue} WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Phone number transformation completed successfully.');

    } catch (error) {
        console.error('Error during phone number transformation:', error.message);
        if (error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
    } finally {
        if (connection) {
            connection.release();
            console.log('Database connection released back to pool.');
        }
        try {
            const tempConnection = await pool.getConnection();
            await tempConnection.query('SET SQL_SAFE_UPDATES = 1;');
            tempConnection.release();
            console.log('SQL_SAFE_UPDATES re-enabled.');
        } catch (err) {
            console.error('Failed to re-enable SQL_SAFE_UPDATES:', err.message);
        }
    }
}

transformPhoneData();