// File: transform_profession_designation.js (CORRECTED VERSION)

const pool = require("../config/db"); // Your existing database connection pool

// Canonical data (will be loaded once at the start of the script execution)
let canonicalProfessions = [];
let canonicalDesignations = [];

/**
 * Heuristically parses a raw profession/designation string.
 * It prioritizes finding a specific designation, then a general profession.
 * @param {string} rawString - The raw profession/designation string.
 * @returns {{profession: string|null, designation: string|null}} Object with parsed profession and designation.
 */
function parseProfessionDesignation(rawString) {
    const result = { profession: null, designation: null };

    if (!rawString || typeof rawString !== 'string' || rawString.trim().toLowerCase().includes('undisclosed') || rawString.trim().toLowerCase() === 'dont know' || rawString.trim() === '') {
        return result; // Return nulls for known placeholders
    }

    let cleanedStr = rawString.trim();

    // 1. Prioritize finding a specific Designation (more granular)
    // Iterate through designations from longest to shortest for better matching
    for (const designation of canonicalDesignations) {
        // Create a regex for whole word match, escaping special characters in the designation name
        const regex = new RegExp(`\\b${designation.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (cleanedStr.match(regex)) {
            result.designation = designation;
            // Once found, remove it from the string to help find broader profession if needed
            cleanedStr = cleanedStr.replace(regex, '').trim(); 
            break; 
        }
    }

    // 2. Then try to find a broader Profession (from canonical list)
    // Iterate through professions from longest to shortest
    for (const profession of canonicalProfessions) {
        const regex = new RegExp(`\\b${profession.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (cleanedStr.match(regex)) {
            result.profession = profession;
            break; 
        }
    }
    
    // 3. Fallback/Inference Logic:
    // If a designation was found but no clear profession, infer from designation
    const designationToProfessionMap = { 
        'IT Manager': 'IT', 'IT Director': 'IT', 'IT Consultant': 'IT', 'IT Specialist': 'IT', 'IT Coordinator': 'IT',
        'Chief Information Officer (CIO)': 'IT', 'Chief Technology Officer (CTO)': 'IT', 'Information Systems Manager': 'IT',
        'IT Operations Manager': 'IT Operations', 'Operations Analyst': 'IT Operations', 'DevOps Engineer': 'IT Operations',
        'IT Operations Specialist': 'IT Operations', 'Infrastructure Manager': 'IT Operations', 'Service Delivery Manager': 'IT Operations',
        'IT Operations Coordinator': 'IT Operations', 'Junior Software Engineer': 'Software Engineer', 'Senior Software Engineer': 'Software Engineer',
        'Lead Software Engineer': 'Software Engineer', 'Software Architect': 'Software Engineer', 'Principal Software Engineer': 'Software Engineer',
        'Mobile Developer': 'Software Engineer', 'Backend Developer': 'Software Engineer', 'Frontend Developer': 'Software Engineer',
        'Full Stack Developer': 'Software Engineer', 'Junior Web Developer': 'Web Developer', 'Senior Web Developer': 'Web Developer',
        'Lead Web Developer': 'Web Developer', 'Web Development Manager': 'Web Developer', 'PHP Developer': 'Web Developer',
        'JavaScript Developer': 'Web Developer', 'WordPress Developer': 'Web Developer', 'E-commerce Developer': 'Web Developer',
        'Junior Data Scientist': 'Data Scientist', 'Senior Data Scientist': 'Data Scientist', 'Lead Data Scientist': 'Data Scientist',
        'Machine Learning Engineer': 'Data Scientist', 'AI Specialist': 'Data Scientist', 'Data Science Manager': 'Data Scientist',
        'Business Intelligence Analyst': 'Data Scientist', 'Data Analyst': 'Data Scientist', 'Junior System Administrator': 'System Administrator',
        'Senior System Administrator': 'System Administrator', 'Linux Administrator': 'System Administrator', 'Windows Administrator': 'System Administrator',
        'Cloud Administrator': 'System Administrator', 'Systems Engineer': 'System Administrator', 'Server Administrator': 'System Administrator',
        'Junior Network Engineer': 'Network Engineer', 'Senior Network Engineer': 'Network Engineer', 'Network Architect': 'Network Engineer',
        'Network Manager': 'Network Engineer', 'Network Administrator': 'Network Engineer', 'Telecommunications Specialist': 'Network Engineer',
        'Wireless Network Engineer': 'Network Engineer', 'Junior Security Analyst': 'Cybersecurity Analyst', 'Senior Security Analyst': 'Cybersecurity Analyst',
        'Security Engineer': 'Cybersecurity Analyst', 'Penetration Tester': 'Cybersecurity Analyst', 'Security Architect': 'Cybersecurity Analyst',
        'Chief Information Security Officer (CISO)': 'Cybersecurity Analyst', 'Security Operations Center (SOC) Analyst': 'Cybersecurity Analyst',
        'Information Security Manager': 'Cybersecurity Analyst', 'Junior DBA': 'Database Administrator', 'Senior DBA': 'Database Administrator',
        'Database Manager': 'Database Administrator', 'SQL Developer': 'Database Administrator', 'Oracle DBA': 'Database Administrator',
        'MySQL Administrator': 'Database Administrator', 'SQL Server Administrator': 'Database Administrator', 'Database Architect': 'Database Administrator',
        'Junior Business Analyst': 'Business Analyst', 'Senior Business Analyst': 'Business Analyst', 'Lead Business Analyst': 'Business Analyst',
        'Business Systems Analyst': 'Business Analyst', 'Product Owner': 'Business Analyst', 'Requirements Analyst': 'Business Analyst',
        'Process Analyst': 'Business Analyst', 'Junior Project Manager': 'Project Manager', 'Senior Project Manager': 'Project Manager',
        'Technical Project Manager': 'Project Manager', 'Program Manager': 'Project Manager', 'Scrum Master': 'Project Manager',
        'Agile Coach': 'Project Manager', 'Project Management Office (PMO) Manager': 'Project Manager', 'Project Coordinator': 'Project Manager',
        'Technical Support Specialist': 'Technical Support', 'Help Desk Analyst': 'Technical Support', 'IT Support Technician': 'Technical Support',
        'Desktop Support Technician': 'Technical Support', 'Support Engineer': 'Technical Support', 'IT Support Manager': 'Technical Support',
        'Service Desk Analyst': 'Technical Support', 'Junior QA Engineer': 'QA Engineer', 'Senior QA Engineer': 'QA Engineer',
        'QA Lead': 'QA Engineer', 'QA Manager': 'QA Engineer', 'Test Automation Engineer': 'QA Engineer', 'Manual Tester': 'QA Engineer',
        'Software Tester': 'QA Engineer', 'Junior UI/UX Designer': 'UI/UX Designer', 'Senior UI/UX Designer': 'UI/UX Designer',
        'UI Designer': 'UI/UX Designer', 'UX Designer': 'UI/UX Designer', 'Interaction Designer': 'UI/UX Designer',
        'User Experience Researcher': 'UI/UX Designer', 'Product Designer': 'UI/UX Designer', 'Creative Director': 'UI/UX Designer',
        'Visual Artist': 'Artist', 'Painter': 'Artist', 'Sculptor': 'Artist', 'Illustrator': 'Artist', 'Graphic Artist': 'Artist',
        'Digital Artist': 'Artist', 'Art Director': 'Artist', 'Concept Artist': 'Artist', 'Fine Artist': 'Artist',
        'Content Writer': 'Writer', 'Technical Writer': 'Writer', 'Copywriter': 'Writer', 'Editor': 'Writer', 'Novelist': 'Writer',
        'Screenwriter': 'Writer', 'Journalist': 'Journalist', 'Blogger': 'Writer', 'Grant Writer': 'Writer',
        'Speechwriter': 'Writer', 'Script Writer': 'Writer', 'Medical Writer': 'Writer', 'Performer': 'Musician',
        'Composer': 'Musician', 'Music Producer': 'Musician', 'Orchestra Musician': 'Musician', 'Band Member': 'Musician',
        'Session Musician': 'Musician', 'Music Director': 'Musician', 'Conductor': 'Musician', 'Solo Artist': 'Musician',
        'Music Teacher': 'Teacher', 'DJ': 'Musician', 'Sound Engineer': 'Musician', 'Bank Teller': 'Banker',
        'Bank Manager': 'Banker', 'Loan Officer': 'Banker', 'Credit Analyst': 'Banker', 'Branch Manager': 'Banker',
        'Banking Executive': 'Banker', 'Relationship Manager': 'Banker', 'Investment Banker': 'Banker', 'Private Banker': 'Banker',
        'Bank Director': 'Banker', 'Compliance Officer': 'Banker', 'Risk Manager': 'Banker', 'Junior Financial Analyst': 'Financial Analyst',
        'Senior Financial Analyst': 'Financial Analyst', 'Financial Manager': 'Financial Analyst', 'Investment Analyst': 'Financial Analyst',
        'Portfolio Manager': 'Financial Analyst', 'Equity Analyst': 'Financial Analyst', 'Financial Planner': 'Financial Analyst',
        'Financial Advisor': 'Financial Analyst', 'Financial Controller': 'Financial Analyst', 'Budget Analyst': 'Financial Analyst',
        'Financial Reporting Manager': 'Financial Analyst', 'Reporter': 'Journalist', 'News Anchor': 'Journalist',
        'Editor': 'Writer', 'Feature Writer': 'Writer', 'Investigative Journalist': 'Journalist',
        'Photojournalist': 'Journalist', 'Correspondent': 'Journalist', 'News Editor': 'Journalist',
        'Broadcast Journalist': 'Journalist', 'Columnist': 'Journalist', 'Sports Journalist': 'Journalist',
        'Freelance Journalist': 'Journalist', 'Elected Official': 'Politician', 'Mayor': 'Politician',
        'Council Member': 'Politician', 'State Representative': 'Politician', 'Senator': 'Politician',
        'Member of Parliament': 'Politician', 'Minister': 'Politician', 'Governor': 'Politician',
        'Ambassador': 'Politician', 'Political Advisor': 'Politician', 'Political Aide': 'Politician',
        'Party Official': 'Politician', 'Clinical Psychologist': 'Psychologist', 'Counseling Psychologist': 'Psychologist',
        'School Psychologist': 'Psychologist', 'Organizational Psychologist': 'Psychologist', 'Forensic Psychologist': 'Psychologist',
        'Neuropsychologist': 'Psychologist', 'Health Psychologist': 'Psychologist', 'Sports Psychologist': 'Psychologist',
        'Research Psychologist': 'Psychologist', 'Psychology Professor': 'Psychologist', 'Child Psychologist': 'Psychologist',
        'Cognitive Psychologist': 'Psychologist'
    };


    if (result.designation && !result.profession) {
        result.profession = designationToProfessionMap[result.designation] || null; // Infer from designation if not directly found
    }
    
    // Final fallback: If still no profession/designation, try to extract from the raw string
    if (!result.profession && !result.designation && rawString.length > 2) {
        // This is a simplified regex, may need refinement based on patterns
        const engineerMatch = rawString.match(/\b(senior|junior|lead|principal|chief|staff)?\s*(test|software|design|process|quality|site reliability|system|automation|security|hardware|mechanical|electrical|civil|chemical|aerospace|biomedical|environmental|structural|industrial|petroleum|civil|engineer|architect|developer|scientist|analyst|manager|consultant|specialist|officer|director|executive|associate|assistant|head|vp|team lead|coordinator|administrator|support|technician|auditor|controller)\b/i);
        if (engineerMatch) {
            result.profession = engineerMatch[2].charAt(0).toUpperCase() + engineerMatch[2].slice(1); // Capitalize first letter
            result.designation = (engineerMatch[1] ? engineerMatch[1].charAt(0).toUpperCase() + engineerMatch[1].slice(1) + ' ' : '') + result.profession;
        }
        
        // Generic catch-all if still nothing
        if (!result.profession && !result.designation) {
            if (rawString.toLowerCase().includes('consultant')) result.profession = 'IT'; // Common fallback
            else if (rawString.toLowerCase().includes('manager')) result.profession = 'Businessperson';
            else if (rawString.toLowerCase().includes('executive')) result.profession = 'Businessperson';
            else if (rawString.toLowerCase().includes('analyst')) result.profession = 'Business Analyst';
            else if (rawString.toLowerCase().includes('doctor') || rawString.toLowerCase().includes('surgeon')) result.profession = 'Doctor';
            else if (rawString.toLowerCase().includes('teacher') || rawString.toLowerCase().includes('professor')) result.profession = 'Teacher';
            else if (rawString.toLowerCase().includes('accountant') || rawString.toLowerCase().includes('auditor')) result.profession = 'Accountant';
            else if (rawString.toLowerCase().includes('lawyer') || rawString.toLowerCase().includes('attorney')) result.profession = 'Lawyer';
            else if (rawString.toLowerCase().includes('business')) result.profession = 'Businessperson';
            else if (rawString.toLowerCase().includes('sales')) result.profession = 'Salesperson';
            else if (rawString.toLowerCase().includes('marketing')) result.profession = 'Marketing Specialist';
            else if (rawString.toLowerCase().includes('nurse')) result.profession = 'Nurse';
            else if (rawString.toLowerCase().includes('pharmacist')) result.profession = 'Pharmacist';
            else if (rawString.toLowerCase().includes('architect')) result.profession = 'Architect';
            else if (rawString.toLowerCase().includes('artist')) result.profession = 'Artist';
            else if (rawString.toLowerCase().includes('writer')) result.profession = 'Writer';
            else if (rawString.toLowerCase().includes('musician')) result.profession = 'Musician';
            else if (rawString.toLowerCase().includes('banker')) result.profession = 'Banker';
            else if (rawString.toLowerCase().includes('financial analyst')) result.profession = 'Financial Analyst';
            else if (rawString.toLowerCase().includes('journalist')) result.profession = 'Journalist';
            else if (rawString.toLowerCase().includes('psychologist')) result.profession = 'Psychologist';
            else if (rawString.toLowerCase().includes('ceo') || rawString.toLowerCase().includes('owner') || rawString.toLowerCase().includes('entrepreneur')) result.profession = 'Businessperson';
            else if (rawString.toLowerCase().includes('it')) result.profession = 'IT';
            else if (rawString.toLowerCase().includes('hr')) result.profession = 'HR'; // Add HR to professions
        }
        
        // If still nothing, and it's not a known placeholder, default to Businessperson
        if (!result.profession && !result.designation && rawString.length > 2) {
             result.profession = 'Businessperson'; 
        }
    }


    return result;
}

async function transformProfessionDesignationData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // Load canonical data from lookup tables
        // Assuming 'profession' table has a column 'ProfessionName'
        const [professionsRows] = await connection.query(`SELECT ProfessionName FROM profession`); 
        canonicalProfessions = professionsRows.map(row => row.ProfessionName);
        canonicalProfessions.sort((a, b) => b.length - a.length); // Sort descending by length for better matching

        // Assuming 'designation' table has a column 'DesignationName'
        const [designationsRows] = await connection.query(`SELECT DesignationName FROM designation`);
        canonicalDesignations = designationsRows.map(row => row.DesignationName);
        canonicalDesignations.sort((a, b) => b.length - a.length); // Sort descending by length

        // 1. Fetch all profile_id_raw and profession_designation_raw
        const [profiles] = await connection.query(`SELECT profile_id_raw, profession_designation_raw FROM profiles_staging`);
        console.log(`Fetched ${profiles.length} profiles for profession/designation transformation.`);

        const updates = [];
        for (const profile of profiles) {
            const originalField = profile.profession_designation_raw;
            const parsed = parseProfessionDesignation(originalField);
            
            updates.push({
                profile_id_raw: profile.profile_id_raw,
                profession: parsed.profession,
                designation: parsed.designation
            });
        }

        // 2. Perform batch updates
        const batchSize = 50; // Adjust batch size as needed
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            let updateQueries = batch.map(item => {
                const professionValue = item.profession !== null ? connection.escape(item.profession) : 'NULL';
                const designationValue = item.designation !== null ? connection.escape(item.designation) : 'NULL';
                return `UPDATE profiles_staging SET 
                            profession_final = ${professionValue}, 
                            designation_final = ${designationValue} 
                        WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Profession/Designation transformation completed successfully.');

    } catch (error) {
        console.error('Error during profession/designation transformation:', error.message);
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

transformProfessionDesignationData();