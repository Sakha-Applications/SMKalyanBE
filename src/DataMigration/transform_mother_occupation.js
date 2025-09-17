// File: transform_mother_occupation.js

const pool = require("../config/db"); // Your existing database connection pool

// Canonical data (loaded once at the start of the script execution)
let canonicalProfessions = [];

/**
 * Heuristically parses a raw occupation string and maps it to a canonical profession.
 * This version prioritizes 'Homemaker' and 'Housewife'.
 * @param {string} rawOccupationStr - The raw occupation string.
 * @returns {string|null} The standardized profession string, or null if it cannot be mapped.
 */
function parseMotherOccupation(rawOccupationStr) {
    if (!rawOccupationStr || typeof rawOccupationStr !== 'string') {
        return null;
    }

    let cleanedStr = rawOccupationStr.trim().toLowerCase();

    // 1. Handle Homemaker/Housewife first (high priority for mothers' occupation)
    if (cleanedStr.includes('homemaker') || cleanedStr.includes('housewife') || cleanedStr.includes('gruhini') || cleanedStr.includes('home maker') || cleanedStr.includes('home management') || cleanedStr.includes('hw')) {
        return 'Homemaker'; // Canonical name from your profession table
    }

    // 2. Handle other special statuses / non-professions
    if (cleanedStr.includes('retired') || cleanedStr.includes('retd') || cleanedStr.includes('late') ||
        cleanedStr.includes('expired') || cleanedStr.includes('no more') || cleanedStr.includes('not working') ||
        cleanedStr.includes('unemployed') || cleanedStr.includes('not applicable') || cleanedStr === 'na' || cleanedStr === 'n.a.' ||
        cleanedStr.includes('demised') || cleanedStr.includes('passed away')) {
        return 'Retired'; // Assuming 'Retired' is an acceptable category
    }
    if (cleanedStr.includes('student') || cleanedStr.includes('studying')) {
        return 'Student'; // Assuming 'Student' is an acceptable category
    }
    if (cleanedStr.includes('purohit') || cleanedStr.includes('archaka') || cleanedStr.includes('panditharu') || cleanedStr.includes('priest')) {
        return 'Teacher'; // Mapping Purohit/Archaka to Teacher if more specific is not desired
    }


    // 3. Iterate through canonical professions (longest first) to find a match
    for (const profession of canonicalProfessions) {
        const regex = new RegExp(`\\b${profession.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (cleanedStr.match(regex)) {
            return profession; // Return the canonical name from the list
        }
    }
    
    // 4. Fallback heuristics if no direct match
    if (cleanedStr.includes('engineer') || cleanedStr.includes('engg') || cleanedStr.includes('engr')) return 'Engineer';
    if (cleanedStr.includes('software')) return 'Software Engineer';
    if (cleanedStr.includes('it') || cleanedStr.includes('system') || cleanedStr.includes('network') || cleanedStr.includes('cybersecurity') || cleanedStr.includes('data scientist') || cleanedStr.includes('analyst')) return 'IT';
    if (cleanedStr.includes('doctor') || cleanedStr.includes('physician') || cleanedStr.includes('surgeon')) return 'Doctor';
    if (cleanedStr.includes('teacher') || cleanedStr.includes('lecturer') || cleanedStr.includes('professor') || cleanedStr.includes('faculty')) return 'Teacher';
    if (cleanedStr.includes('accountant') || cleanedStr.includes('audit') || cleanedStr.includes('finance') || cleanedStr.includes('cfo')) return 'Accountant';
    if (cleanedStr.includes('banker') || cleanedStr.includes('bank')) return 'Banker';
    if (cleanedStr.includes('lawyer') || cleanedStr.includes('advocate') || cleanedStr.includes('legal')) return 'Lawyer';
    if (cleanedStr.includes('sales') || cleanedStr.includes('marketing') || cleanedStr.includes('salesman')) return 'Salesperson';
    if (cleanedStr.includes('manager') || cleanedStr.includes('executive') || cleanedStr.includes('officer') || cleanedStr.includes('director') || cleanedStr.includes('head') || cleanedStr.includes('admin')) return 'Businessperson';
    if (cleanedStr.includes('nurse')) return 'Nurse';
    if (cleanedStr.includes('pharmacist')) return 'Pharmacist';
    if (cleanedStr.includes('architect')) return 'Architect';
    if (cleanedStr.includes('artist') || cleanedStr.includes('musician') || cleanedStr.includes('writer')) return 'Artist';
    if (cleanedStr.includes('journalist') || cleanedStr.includes('reporter')) return 'Journalist';
    if (cleanedStr.includes('politician') || cleanedStr.includes('govnt') || cleanedStr.includes('government')) return 'Politician';
    if (cleanedStr.includes('psychologist')) return 'Psychologist';
    if (cleanedStr.includes('farmer') || cleanedStr.includes('agriculture')) return 'Businessperson';
    if (cleanedStr.includes('police')) return 'Politician'; // Mapping to Politician for broadness for govt
    if (cleanedStr.includes('hr')) return 'HR'; // Adding HR as a profession if not already in canonical

    // Catch-all if nothing specific matched but it's not a known null/retired status
    if (cleanedStr.length > 2) { 
        return 'Businessperson'; // Default fallback to a broad category
    }

    return null; // Default to null if no meaningful occupation could be extracted
}

async function transformMotherOccupationData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // Load canonical professions from the 'profession' table
        const [professionsRows] = await connection.query(`SELECT ProfessionName FROM profession`);
        canonicalProfessions = professionsRows.map(row => row.ProfessionName);
        canonicalProfessions.sort((a, b) => b.length - a.length); // Sort descending by length for better matching

        // 1. Fetch all profile_id_raw and mother_occupation_raw
        const [profiles] = await connection.query(`SELECT profile_id_raw, mother_occupation_raw FROM profiles_staging`);
        console.log(`Fetched ${profiles.length} profiles for mother's occupation transformation.`);

        const updates = [];
        for (const profile of profiles) {
            const originalOccupation = profile.mother_occupation_raw;
            const standardizedOccupation = parseMotherOccupation(originalOccupation);
            
            updates.push({
                profile_id_raw: profile.profile_id_raw,
                occupation: standardizedOccupation
            });
        }

        // 2. Perform batch updates
        const batchSize = 50; 
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            let updateQueries = batch.map(item => {
                const occupationValue = item.occupation !== null ? connection.escape(item.occupation) : 'NULL';
                return `UPDATE profiles_staging SET mother_occupation_raw = ${occupationValue} WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Mother\'s occupation transformation completed successfully.');

    } catch (error) {
        console.error('Error during mother\'s occupation transformation:', error.message);
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

transformMotherOccupationData();