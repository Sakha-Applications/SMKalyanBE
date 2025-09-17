// File: transform_siblings_details.js

const pool = require("../config/db"); // Your existing database connection pool

// Define the canonical dropdown values
const CANONICAL_SISTERS = [
    "No Sisters",
    "1 Sister - Married",
    "1 Sister - Unmarried",
    "2 Sisters - Married",
    "1 Sister Married, 1 Sister Unmarried",
    "2 Sisters - Unmarried",
    "More than 2 Sisters"
];

const CANONICAL_BROTHERS = [
    "No Brothers",
    "1 Brother - Married",
    "1 Brother - Unmarried",
    "2 Brothers - Married",
    "1 Brother Married, 1 Brother Unmarried",
    "2 Brothers - Unmarried",
    "More than 2 Brothers"
];

/**
 * Parses a raw sibling details string to determine brother/sister counts and marital status.
 * This is a heuristic function and may not be 100% accurate for all variations.
 * @param {string} rawDetailsStr - The raw sibling details string.
 * @returns {{sisters: string, brothers: string}} Object with standardized sister and brother counts.
 */
function parseSiblingDetails(rawDetailsStr) {
    let sistersCount = 0;
    let brothersCount = 0;
    let marriedSisters = 0;
    let unmarriedSisters = 0;
    let marriedBrothers = 0;
    let unmarriedBrothers = 0;

    if (!rawDetailsStr || typeof rawDetailsStr !== 'string' || rawDetailsStr.trim().toLowerCase() === 'undisclosed' || rawDetailsStr.trim().toLowerCase() === 'no siblings' || rawDetailsStr.trim() === '') {
        return { sisters: "No Sisters", brothers: "No Brothers" };
    }

    let cleanedStr = rawDetailsStr.trim().toLowerCase();

    // Check for explicit "No Siblings" (already handled above, but good for robustness)
    if (cleanedStr.includes('no siblings')) {
        return { sisters: "No Sisters", brothers: "No Brothers" };
    }

    // --- Heuristics for Sisters ---
    const sisterMatches = cleanedStr.match(/(\d+)\s*sister|sister|sisters/g);
    if (sisterMatches) {
        for (const match of sisterMatches) {
            const numMatch = match.match(/\d+/);
            const count = numMatch ? parseInt(numMatch[0]) : 1;
            sistersCount += count;

            if (cleanedStr.includes('sister married') || cleanedStr.includes('sisters married') || cleanedStr.includes('sister settled')) {
                marriedSisters += count;
            } else if (cleanedStr.includes('sister unmarried') || cleanedStr.includes('sisters unmarried')) {
                unmarriedSisters += count;
            }
        }
    }

    // --- Heuristics for Brothers ---
    const brotherMatches = cleanedStr.match(/(\d+)\s*brother|brother|brothers/g);
    if (brotherMatches) {
        for (const match of brotherMatches) {
            const numMatch = match.match(/\d+/);
            const count = numMatch ? parseInt(numMatch[0]) : 1;
            brothersCount += count;

            if (cleanedStr.includes('brother married') || cleanedStr.includes('brothers married') || cleanedStr.includes('brother settled')) {
                marriedBrothers += count;
            } else if (cleanedStr.includes('brother unmarried') || cleanedStr.includes('brothers unmarried')) {
                unmarriedBrothers += count;
            }
        }
    }

    // --- Refine counts based on specific phrases ---
    if (cleanedStr.includes('one elder sister married')) {
        sistersCount = 1; marriedSisters = 1; unmarriedSisters = 0;
    }
    if (cleanedStr.includes('one sister married')) {
        sistersCount = 1; marriedSisters = 1; unmarriedSisters = 0;
    }
    if (cleanedStr.includes('2 sisters both married')) {
        sistersCount = 2; marriedSisters = 2; unmarriedSisters = 0;
    }
    if (cleanedStr.includes('younger brother an engineer')) { // Implies 1 brother
        brothersCount = Math.max(brothersCount, 1); // Ensure it's at least 1
    }
    if (cleanedStr.includes('one sister doctor married')) {
        sistersCount = Math.max(sistersCount, 1); marriedSisters = Math.max(marriedSisters, 1);
    }
    if (cleanedStr.includes('one brother and works as engineer')) {
        brothersCount = Math.max(brothersCount, 1);
    }
    if (cleanedStr.includes('younger brother, just. completed b tech')) {
        brothersCount = Math.max(brothersCount, 1);
    }
    if (cleanedStr.includes('vinayaka (brother)')) {
        brothersCount = Math.max(brothersCount, 1);
    }
    if (cleanedStr.includes('divya dushi (sister) not married')) {
        sistersCount = Math.max(sistersCount, 1); unmarriedSisters = Math.max(unmarriedSisters, 1);
    }
    if (cleanedStr.includes('elder brother working')) {
        brothersCount = Math.max(brothersCount, 1);
    }
    if (cleanedStr.includes('elder sister married, having her own company')) {
        sistersCount = Math.max(sistersCount, 1); marriedSisters = Math.max(marriedSisters, 1);
    }
    if (cleanedStr.includes('brother-1')) { brothersCount = 1; }
    if (cleanedStr.includes('sister--3')) { sistersCount = 3; } // Assuming 3 sisters, status unknown

    // --- Categorize Sisters ---
    let finalSisters = "No Sisters";
    if (sistersCount === 0 && (marriedSisters > 0 || unmarriedSisters > 0)) { // If counts are zero but status implies existence
        sistersCount = marriedSisters + unmarriedSisters; // Correct count
    }

    if (sistersCount === 1) {
        if (marriedSisters === 1) finalSisters = "1 Sister - Married";
        else if (unmarriedSisters === 1) finalSisters = "1 Sister - Unmarried";
        else if (cleanedStr.includes('married')) finalSisters = "1 Sister - Married"; // Default to married if status mentioned but not specific count
        else finalSisters = "1 Sister - Unmarried"; // Default to unmarried if no status or specific married/unmarried count
    } else if (sistersCount === 2) {
        if (marriedSisters === 2) finalSisters = "2 Sisters - Married";
        else if (unmarriedSisters === 2) finalSisters = "2 Sisters - Unmarried";
        else if (marriedSisters === 1 && unmarriedSisters === 1) finalSisters = "1 Sister Married, 1 Sister Unmarried";
        else if (cleanedStr.includes('married') && cleanedStr.includes('unmarried')) finalSisters = "1 Sister Married, 1 Sister Unmarried";
        else if (cleanedStr.includes('married')) finalSisters = "2 Sisters - Married"; // Default to married if status mentioned
        else finalSisters = "2 Sisters - Unmarried"; // Default to unmarried if no status
    } else if (sistersCount > 2) {
        finalSisters = "More than 2 Sisters";
    }

    // --- Categorize Brothers ---
    let finalBrothers = "No Brothers";
    if (brothersCount === 0 && (marriedBrothers > 0 || unmarriedBrothers > 0)) { // If counts are zero but status implies existence
        brothersCount = marriedBrothers + unmarriedBrothers; // Correct count
    }

    if (brothersCount === 1) {
        if (marriedBrothers === 1) finalBrothers = "1 Brother - Married";
        else if (unmarriedBrothers === 1) finalBrothers = "1 Brother - Unmarried";
        else if (cleanedStr.includes('married')) finalBrothers = "1 Brother - Married";
        else finalBrothers = "1 Brother - Unmarried";
    } else if (brothersCount === 2) {
        if (marriedBrothers === 2) finalBrothers = "2 Brothers - Married";
        else if (unmarriedBrothers === 2) finalBrothers = "2 Brothers - Unmarried";
        else if (marriedBrothers === 1 && unmarriedBrothers === 1) finalBrothers = "1 Brother Married, 1 Brother Unmarried";
        else if (cleanedStr.includes('married') && cleanedStr.includes('unmarried')) finalBrothers = "1 Brother Married, 1 Brother Unmarried";
        else if (cleanedStr.includes('married')) finalBrothers = "2 Brothers - Married";
        else finalBrothers = "2 Brothers - Unmarried";
    } else if (brothersCount > 2) {
        finalBrothers = "More than 2 Brothers";
    }
    
    // Final check: if "No Siblings" was explicit, override
    if (rawDetailsStr.trim().toLowerCase().includes('no siblings')) {
        finalSisters = "No Sisters";
        finalBrothers = "No Brothers";
    }


    return { sisters: finalSisters, brothers: finalBrothers };
}

async function transformSiblingData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // 1. Fetch all profile_id_raw and brothers_sisters_details_raw
        const [profiles] = await connection.query(`SELECT profile_id_raw, brothers_sisters_details_raw FROM profiles_staging`);
        console.log(`Fetched ${profiles.length} profiles for sibling details transformation.`);

        const updates = [];
        for (const profile of profiles) {
            const originalDetails = profile.brothers_sisters_details_raw;
            const parsedSiblings = parseSiblingDetails(originalDetails);
            
            updates.push({
                profile_id_raw: profile.profile_id_raw,
                no_of_sisters: parsedSiblings.sisters,
                no_of_brothers: parsedSiblings.brothers
            });
        }

        // 2. Perform batch updates
        const batchSize = 50; 
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            let updateQueries = batch.map(item => {
                const sistersValue = connection.escape(item.no_of_sisters);
                const brothersValue = connection.escape(item.no_of_brothers);
                return `UPDATE profiles_staging SET 
                            no_of_sisters = ${sistersValue}, 
                            no_of_brothers = ${brothersValue} 
                        WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Sibling details transformation completed successfully.');

    } catch (error) {
        console.error('Error during sibling details transformation:', error.message);
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

transformSiblingData();