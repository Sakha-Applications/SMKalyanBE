// File: transform_references.js (REVISED VERSION with +91 forcing)

const pool = require("../config/db"); // Your existing database connection pool

/**
 * Extracts and cleans phone numbers from a messy string.
 * This version forces +91 prefix if no other country code is specified.
 * @param {string} rawPhoneStr - The raw phone number string.
 * @returns {Array<string>} An array of cleaned phone numbers (digits only, with + prefix), or empty array if none found.
 */
function cleanAndExtractPhoneNumbers(rawPhoneStr) {
    if (!rawPhoneStr || typeof rawPhoneStr !== 'string') {
        return [];
    }

    let cleanedStr = rawPhoneStr.trim();
    if (cleanedStr.toLowerCase().includes('undisclosed') || cleanedStr.toLowerCase() === 'na' || cleanedStr === '') {
        return [];
    }

    // Regex: More broadly look for sequences of digits, potentially with a leading +
    const phoneRegex = /\+?\d[\d\s\-\.\(\)]*\d/g;
    let matches = cleanedStr.match(phoneRegex);

    const cleanedNumbers = [];
    if (matches) {
        for (let match of matches) {
            let number = match.replace(/[^0-9+]/g, ''); // Keep only digits and initial +

            if (number.startsWith('+')) {
                // If it starts with '+', it's already an international number. Keep it as is.
                // Ensure no multiple '+' signs like '++91'
                number = '+' + number.replace(/\+/g, '').trim(); 
            } else {
                // If it does NOT start with '+', assume it's an Indian number and prepend +91
                // This will apply +91 to 10-digit numbers, and also to shorter ones if they pass min length.
                number = '+91' + number;
            }

            // Basic validation: must be at least 7 digits (local minimum for meaningful number)
            if (number.replace('+', '').length >= 7) { 
                 cleanedNumbers.push(number);
            }
        }
    }
    
    // Fallback for very long concatenated strings of digits (e.g., "98865575417207630900")
    if (cleanedNumbers.length === 0 && cleanedStr.replace(/[^0-9]/g, '').length >= 10) {
        const pureDigits = cleanedStr.replace(/[^0-9]/g, '');
        // Attempt to split into 10-digit chunks (common for concatenated Indian mobiles)
        for (let i = 0; i < pureDigits.length; i += 10) {
            let chunk = pureDigits.substring(i, i + 10);
            if (chunk.length === 10) { // If it's a 10-digit chunk, apply +91
                cleanedNumbers.push('+91' + chunk);
            } else if (chunk.length >= 7) { // Also consider shorter valid numbers (assume local)
                 cleanedNumbers.push('+91' + chunk); 
            }
        }
    }

    // Remove duplicates
    return [...new Set(cleanedNumbers)];
}


/**
 * Parses a reference string to extract name and phone number.
 * Improved logic to prioritize phone extraction and then isolate the name.
 * @param {string} rawRefStr - The raw reference string (e.g., "Name - 1234567890").
 * @returns {{name: string|null, phone: string|null}} Object with extracted name and phone.
 */
function parseReference(rawRefStr) {
    const result = { name: null, phone: null };

    if (!rawRefStr || typeof rawRefStr !== 'string' || rawRefStr.trim().toLowerCase().includes('undisclosed') || rawRefStr.trim() === '') {
        return result; // Return nulls for known placeholders
    }

    let tempStr = rawRefStr.trim();
    const extractedNumbers = cleanAndExtractPhoneNumbers(tempStr);

    if (extractedNumbers.length > 0) {
        result.phone = extractedNumbers[0]; // Take the first best number
        
        // Aggressively remove the extracted number(s) from the string to isolate the name
        let nameCandidate = tempStr;
        for (const num of extractedNumbers) {
            // Use regex with global flag to replace all occurrences of the number and ensure escaping for '+'
            nameCandidate = nameCandidate.replace(new RegExp(num.replace(/\+/g, '\\+'), 'g'), '');
        }

        // Remove common separators and non-name remnants (including trailing punctuation like '.')
        nameCandidate = nameCandidate.replace(/[\d\(\)\[\]\.\-\/,:;&]/g, '') // Remove numbers, common symbols
                                 .replace(/mother|father|well-wisher|whatsapp only|usa|uk|email|ph no|ph.no|mo.no/gi, '') // Remove common phrases
                                 .replace(/\s+/g, ' ') // Normalize multiple spaces
                                 .trim();
        
        // If name part is very short or looks like a remnant, set to null
        if (nameCandidate.length < 2) { // Minimum name length heuristic
            nameCandidate = null;
        }

        result.name = nameCandidate;
    } else {
        // If no number was extracted, the entire string might be the name.
        // Clean it similar to how name part is cleaned.
        let nameCandidate = tempStr.replace(/[\d\(\)\[\]\.\-\/,:;&]/g, '')
                                 .replace(/mother|father|well-wisher|whatsapp only|usa|uk|email|ph no|ph.no|mo.no/gi, '')
                                 .replace(/\s+/g, ' ')
                                 .trim();
        if (nameCandidate.length >= 2) {
            result.name = nameCandidate;
        }
    }
    
    return result;
}

// Rest of the script (transformReferenceData function) remains the same
async function transformReferenceData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // 1. Fetch all profile_id_raw and both reference fields
        const [profiles] = await connection.query(`
            SELECT profile_id_raw, reference_1_raw, reference_2_raw
            FROM profiles_staging
        `);
        console.log(`Fetched ${profiles.length} profiles for reference transformation.`);

        const updates = [];
        for (const profile of profiles) {
            // Process Reference 1
            const ref1 = parseReference(profile.reference_1_raw);
            
            // Process Reference 2
            const ref2 = parseReference(profile.reference_2_raw);
            
            updates.push({
                profile_id_raw: profile.profile_id_raw,
                ref1_name: ref1.name,
                ref1_phone: ref1.phone,
                ref2_name: ref2.name,
                ref2_phone: ref2.phone
            });
        }

        // 2. Perform batch updates
        const batchSize = 50; // Adjust batch size as needed
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            let updateQueries = batch.map(item => {
                const ref1NameValue = item.ref1_name !== null ? connection.escape(item.ref1_name) : 'NULL';
                const ref1PhoneValue = item.ref1_phone !== null ? connection.escape(item.ref1_phone) : 'NULL';
                const ref2NameValue = item.ref2_name !== null ? connection.escape(item.ref2_name) : 'NULL';
                const ref2PhoneValue = item.ref2_phone !== null ? connection.escape(item.ref2_phone) : 'NULL';

                return `UPDATE profiles_staging SET 
                            reference_1_raw = ${ref1NameValue}, 
                            reference_1_phone = ${ref1PhoneValue},
                            reference_2_raw = ${ref2NameValue}, 
                            reference_2_phone = ${ref2PhoneValue}
                        WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Reference field transformation completed successfully.');

    } catch (error) {
        console.error('Error during reference transformation:', error.message);
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

transformReferenceData();