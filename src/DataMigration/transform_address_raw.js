// File: transform_address_raw.js

const pool = require("../config/db"); // Your existing database connection pool

/**
 * Heuristically parses an unstructured address string into structured components.
 * This function is a best-effort attempt and may not achieve 100% accuracy due to varied address formats.
 * @param {string} addressStr - The raw, unstructured address string.
 * @returns {object} An object with parsed components: { house_no, street, area, city, state, country, pin }.
 */
function parseAddress(addressStr) {
    const parsed = {
        house_no: null,
        street: null,
        area: null,
        city: null,
        state: null,
        country: 'India', // Default to India unless specified otherwise
        pin: null
    };

    if (!addressStr || typeof addressStr !== 'string') {
        return parsed;
    }

    let cleanedStr = addressStr.trim();
    if (cleanedStr.toLowerCase() === 'undisclosed' || cleanedStr.toLowerCase() === 'will be disclosed to suitable profiles' ||
        cleanedStr.toLowerCase().includes('call') || cleanedStr.toLowerCase().includes('message') ||
        cleanedStr.toLowerCase().includes('email') || cleanedStr.toLowerCase().includes('whatsapp') || cleanedStr === '') {
        return parsed; // Return nulls for known placeholders
    }

    // Attempt to extract PIN code first (6 digits, sometimes 5-6 digits after a dash)
    const pinMatch = cleanedStr.match(/\b(\d{6})\b/); // Matches 6 digits as a whole word
    if (pinMatch) {
        parsed.pin = pinMatch[1];
        cleanedStr = cleanedStr.replace(pinMatch[0], '').trim(); // Remove PIN from string
    } else {
         const pinMatch5 = cleanedStr.match(/\b(\d{5})\b/); // Matches 5 digits for USA-like Zips
         if (pinMatch5 && parsed.country === 'USA') { // Only apply if country is USA
            parsed.pin = pinMatch5[1];
            cleanedStr = cleanedStr.replace(pinMatch5[0], '').trim();
        }
    }


    // Attempt to extract State (common Indian states, case-insensitive)
    const indianStates = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
        'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        // Common abbreviations
        'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML',
        'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB',
        // Also look for cities that can be confused with states or are part of state names
        'Bangalore', 'Bengaluru', 'Mysore', 'Mysuru', 'Chennai', 'Mumbai', 'Hyderabad', 'Delhi', 'Kolkata', 'Pune', 'Ahmednagar' // Adding cities for specific matches
    ];
    // Sort by length descending to match longer names first (e.g., 'Tamil Nadu' before 'Nadu')
    indianStates.sort((a, b) => b.length - a.length); 

    for (const state of indianStates) {
        const stateRegex = new RegExp(`\\b${state}\\b`, 'i'); // Case-insensitive whole word match
        if (cleanedStr.match(stateRegex)) {
            parsed.state = state;
            cleanedStr = cleanedStr.replace(stateRegex, '').trim();
            break; // Found a state, move on
        }
    }
    
    // Attempt to extract Country (USA, UK, etc. from input)
    const countries = {
        'USA': 'USA', 'US': 'USA', 'United States': 'USA',
        'UK': 'UK', 'United Kingdom': 'UK', 'GB': 'UK', 'Great Britain': 'UK',
        'Germany': 'Germany', 'DE': 'Germany', 'AU': 'Australia', 'Australia': 'Australia'
    };
    for (const countryKey in countries) {
        const countryRegex = new RegExp(`\\b${countryKey}\\b`, 'i');
        if (cleanedStr.match(countryRegex)) {
            parsed.country = countries[countryKey];
            cleanedStr = cleanedStr.replace(countryRegex, '').trim();
            break;
        }
    }


    // Attempt to extract City (common Indian cities, case-insensitive)
    const indianCities = [
        'Bengaluru', 'Bangalore', 'Mysuru', 'Mysore', 'Chennai', 'Mumbai', 'Hyderabad', 'Delhi', 'Kolkata', 'Pune',
        'Ahmednagar', 'Coimbatore', 'Hubballi', 'Gulbarga', 'Shivamogga', 'Koppal', 'Ballari', 'Vijayapura', 'Tirupathi',
        'Secunderabad', 'Noida', 'Katy', 'Dharwad', 'Raichur', 'Thane', 'Tiruppur', 'Madurai', 'Anantapur', 'Kurnool',
        'Belagavi', 'Mangalore', 'Udupi', 'Manipal', 'Sirsi', 'Hospet', 'Kolar', 'Chikkaballapur', 'Tumkur', 'Hassan', 'Kanakanagar',
        'Nanjangud', 'Gangavathi', 'Gadag', 'Athani', 'Siruguppa', 'Mudargi', 'Hangal', 'Kuknoor', 'Jamkhandi', 'Bijapur',
        'Hyderabad', 'Hyderabad', 'Secunderabad', 'Secunderabad', 'Mysuru', 'Mysuru', 'Chennai', 'Chennai', 'Bangalore', 'Bangalore', 'Bengaluru', 'Bengaluru' // Add more from your raw list
    ];
    indianCities.sort((a, b) => b.length - a.length);

    for (const city of indianCities) {
        const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
        if (cleanedStr.match(cityRegex)) {
            parsed.city = city;
            cleanedStr = cleanedStr.replace(cityRegex, '').trim();
            break;
        }
    }

    // Heuristics for House No / Street / Area
    // This is the trickiest part as it's highly unstructured.
    // We'll try to find common patterns or leave as null.
    // This is a very simplified attempt.

    const parts = cleanedStr.split(/, |-/); // Split by comma-space or dash

    // Try to identify house number pattern (e.g., #123, No. 123, H.No. 123, 123/)
    const houseNoRegex = /(?:#|No\.|H\.No\.)\s*(\d+)/i;
    const houseNoMatch = cleanedStr.match(houseNoRegex);
    if (houseNoMatch) {
        parsed.house_no = houseNoMatch[0].trim();
        cleanedStr = cleanedStr.replace(houseNoMatch[0], '').trim();
    } else {
        const leadingNumberMatch = cleanedStr.match(/^(\d+)[ /]?(.*)$/); // Matches leading number like "123 Main Road"
        if (leadingNumberMatch && !leadingNumberMatch[2].match(/^\d/)) { // Ensure the rest is not just another number
            parsed.house_no = leadingNumberMatch[1];
            cleanedStr = leadingNumberMatch[2].trim();
        }
    }


    // The rest of the string is mostly street and area
    // This part is highly unreliable without deeper NLP or specific rules for each city/layout
    if (cleanedStr) {
        // Try to assign based on context. Simplistic.
        const knownStreetTerms = ['main road', 'cross road', 'layout', 'nagar', 'colony', 'street', 'road', 'mutt', 'temple', 'apartment', 'enclave', 'garden', 'extension', 'phase', 'block', 'stage', 'galli', 'beedi', 'palya', 'puram', 'vihar', 'bagar', 'township'];
        let streetAssigned = false;
        let areaAssigned = false;

        for (const term of knownStreetTerms) {
            if (cleanedStr.toLowerCase().includes(term)) {
                // If it's a known layout/area term, it might be the area
                parsed.area = cleanedStr;
                areaAssigned = true;
                break;
            }
        }
        if (!areaAssigned) {
            // Otherwise, assign to street
            parsed.street = cleanedStr;
        }
    }

    return parsed;
}

/**
 * Formats parsed address components into a single string.
 * Skips null or empty components.
 * @param {object} parsedAddress - Object with address components.
 * @returns {string|null} Formatted address string or null if all components are null/empty.
 */
function formatAddressString(parsedAddress) {
    const components = [];
    if (parsedAddress.house_no) components.push(parsedAddress.house_no);
    if (parsedAddress.street) components.push(parsedAddress.street);
    if (parsedAddress.area) components.push(parsedAddress.area);
    if (parsedAddress.city) components.push(parsedAddress.city);
    if (parsedAddress.state) components.push(parsedAddress.state);
    if (parsedAddress.country) components.push(parsedAddress.country);
    if (parsedAddress.pin) components.push(parsedAddress.pin);

    return components.length > 0 ? components.join(', ') : null;
}


async function transformAddressData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // 1. Fetch all profile_id_raw and both address fields
        const [profiles] = await connection.query(`
            SELECT profile_id_raw, communication_address_raw, residing_address_raw
            FROM profiles_staging
        `);
        console.log(`Fetched ${profiles.length} profiles for address transformation.`);

        const updates = [];
        for (const profile of profiles) {
            // Process communication address
            const parsedCommAddress = parseAddress(profile.communication_address_raw);
            const formattedCommAddress = formatAddressString(parsedCommAddress);

            // Process residing address
            const parsedResAddress = parseAddress(profile.residing_address_raw);
            const formattedResAddress = formatAddressString(parsedResAddress);
            
            updates.push({
                profile_id_raw: profile.profile_id_raw,
                formatted_comm_address: formattedCommAddress,
                formatted_res_address: formattedResAddress
            });
        }

        // 2. Perform batch updates
        // We'll update the existing communication_address_raw and residing_address_raw columns
        const batchSize = 50; // Adjust batch size as needed
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            let updateQueries = batch.map(item => {
                const commValue = item.formatted_comm_address !== null ? connection.escape(item.formatted_comm_address) : 'NULL';
                const resValue = item.formatted_res_address !== null ? connection.escape(item.formatted_res_address) : 'NULL';
                return `UPDATE profiles_staging SET 
                            communication_address_raw = ${commValue}, 
                            residing_address_raw = ${resValue} 
                        WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Address transformation completed successfully.');

    } catch (error) {
        console.error('Error during address transformation:', error.message);
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

transformAddressData();