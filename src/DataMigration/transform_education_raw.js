// File: transform_education_raw.js

const pool = require("../config/db"); // Your existing database connection pool

/**
 * Standardizes an educational qualification string based on a comprehensive mapping logic.
 * @param {string} rawEduStr - The raw educational qualification string.
 * @returns {string|null} The standardized education string, or null if it cannot be mapped.
 */
function standardizeEducation(rawEduStr) {
    if (!rawEduStr || typeof rawEduStr !== 'string') {
        return null;
    }

    let cleanedStr = rawEduStr.trim();
    // Special handling for common placeholders indicating missing data
    if (cleanedStr.toLowerCase() === 'undisclosed' || cleanedStr.toLowerCase() === 'not disclosed' || cleanedStr === '') {
        return null;
    }

    // Function to simplify common patterns and remove institution/location details
    const simplify = (str) => {
        str = str.replace(/ from (?:Manipal|IIM|IIT|GEORGIA tech|UPENN|Rutgers|BITS Pilani|Cornell University|SASTRA UNIVERSITY TANJORE|MES College|NIM|JSS University|Stanford University School of Medicine|New Castel University|IISc|VTU|USC|Purdue University|Texas A&M University|University of Bath|University of South Florida|University of San Francisco|Liverpool University|Delhi University|NIT|XLRI|BVB college|BMS College of Engineering|IIITB|BITS Pilani Goa Campus),? (?:Hyderabad|Udupi|USA|UK|LA|NY|Bengaluru|Uttarkashi|Mysore|Karachi|Jamshedpur)?/gi, '');
        str = str.replace(/ at (?:Manipal|IIM|IIT|GEORGIA tech|UPENN|Rutgers|BITS Pilani|Cornell University|SASTRA UNIVERSITY TANJORE|MES College|NIM|JSS University|Stanford University School of Medicine|New Castel University|IISc|VTU|USC|Purdue University|Texas A&M University|University of Bath|University of South Florida|University of San Francisco|Liverpool University|Delhi University|NIT|XLRI|BVB college|BMS College of Engineering|IIITB|BITS Pilani Goa Campus),? (?:Hyderabad|Udupi|USA|UK|LA|NY|Bengaluru|Uttarkashi|Mysore|Karachi|Jamshedpur)?/gi, '');
        str = str.replace(/ in (?:Manipal|IIM|IIT|GEORGIA tech|UPENN|Rutgers|BITS Pilani|Cornell University|SASTRA UNIVERSITY TANJORE|MES College|NIM|JSS University|Stanford University School of Medicine|New Castel University|IISc|VTU|USC|Purdue University|Texas A&M University|University of Bath|University of South Florida|University of San Francisco|Liverpool University|Delhi University|NIT|XLRI|BVB college|BMS College of Engineering|IIITB|BITS Pilani Goa Campus),? (?:Hyderabad|Udupi|USA|UK|LA|NY|Bengaluru|Uttarkashi|Mysore|Karachi|Jamshedpur)?/gi, '');
        str = str.replace(/ from (?:USC|USA|UK)/gi, '');
        str = str.replace(/ from (?:BITS Pilani|NIT|IIT|SASTRA UNIVERSITY)/gi, '');
        str = str.replace(/ (?:final year|finalist|pursuing|persuning|in progress|inter|dropout|discontinued|sem i qualified|undergraduate|post-doc|ongoing|online|part time|at|currently studying|completed)/gi, '');
        str = str.replace(/ and /gi, ','); // Convert 'and' to comma for splitting
        str = str.replace(/ \+ /g, ','); // Convert '+' to comma for splitting
        str = str.replace(/;/g, ',');    // Convert ';' to comma for splitting
        str = str.replace(/\s+/g, ' ');  // Normalize multiple spaces
        str = str.replace(/[\(\)\{\}\[\]]/g, ''); // Remove parentheses/brackets
        str = str.replace(/ , /g, ', '); // Normalize spacing around commas
        return str.trim().replace(/,$/, ''); // Trim trailing commas
    };

    let simplified = simplify(cleanedStr).toLowerCase();

    // Mapping rules - more specific rules should come before general ones
    // Degrees first
    if (simplified.includes('mbbs')) return 'MBBS (Bachelor of Medicine, Bachelor of Surgery)';
    if (simplified.includes('md') && !simplified.includes('pursuing')) return 'MD (Doctor of Medicine)'; // Ensure not "pursuing MD"
    if (simplified.includes('dnb')) return 'DM (Doctorate of Medicine)';
    if (simplified.includes('bds')) return 'BDS (Bachelor of Dental Surgery)';
    if (simplified.includes('bams')) return 'BAMS (Bachelor of Ayurvedic Medicine and Surgery)';
    if (simplified.includes('bpharm') || simplified.includes('pharmacy')) return 'BPharm (Bachelor of Pharmacy)';
    if (simplified.includes('llm')) return 'LLM (Master of Laws)';
    if (simplified.includes('llb') || simplified.includes('l.l.b')) return 'LLB (Bachelor of Laws)';
    if (simplified.includes('b.arch') || simplified.includes('barch')) return 'BArch (Bachelor of Architecture)';
    if (simplified.includes('march') || simplified.includes('m.arch')) return 'MArch (Master of Architecture)';
    if (simplified.includes('phd') || simplified.includes('p.hd')) return 'PhD (Doctor of Philosophy)';
    
    if (simplified.includes('m.tech') || simplified.includes('mtech')) return 'MTech (Master of Technology)';
    if (simplified.includes('ms') || simplified.includes('m.s') || simplified.includes('master of science') || simplified.includes('master science') || simplified.includes('me')) return 'MSc (Master of Science)'; // ME often implies MSc equivalent
    if (simplified.includes('msc') || simplified.includes('m.sc')) return 'MSc (Master of Science)';
    if (simplified.includes('mcom') || simplified.includes('m.com')) return 'MCom (Master of Commerce)';
    if (simplified.includes('mba') || simplified.includes('m.b.a')) return 'MBA (Master of Business Administration)';
    if (simplified.includes('mca')) return 'MCA (Master of Computer Applications)';
    if (simplified.includes('ma')) return 'MA (Master of Arts)';
    if (simplified.includes('med')) return 'MEd (Master of Education)';
    if (simplified.includes('m.ch')) return 'MCh (Magister Chirurgiae)';
    if (simplified.includes('mpharm')) return 'MPharm (Master of Pharmacy)';
    if (simplified.includes('msw')) return 'MS (Master of Surgery)'; // Masters of Social Work also exists but typically MS in context
    if (simplified.includes('m.sc')) return 'MSc (Master of Science)';

    if (simplified.includes('b.tech') || simplified.includes('btech')) return 'BTech (Bachelor of Technology)';
    if (simplified.includes('b.e') || simplified.includes('be')) return 'BE (Bachelor of Engineering)';
    if (simplified.includes('bcom') || simplified.includes('b.com')) return 'BCom (Bachelor of Commerce)';
    if (simplified.includes('bsc') || simplified.includes('b.sc')) return 'BSc (Bachelor of Science)';
    if (simplified.includes('bba')) return 'BBA (Bachelor of Business Administration)';
    if (simplified.includes('bca')) return 'BCA (Bachelor of Computer Applications)';
    if (simplified.includes('bed')) return 'BEd (Bachelor of Education)';
    if (simplified.includes('bs')) return 'BSc (Bachelor of Science)'; // BS often maps to BSc for base degree

    // Post-graduate Diplomas/Certifications
    if (simplified.includes('post graduate diploma') || simplified.includes('pgd')) return 'Post Graduate Diploma';
    if (simplified.includes('cma')) return 'CMA (Certified Management Accountant)'; // Assuming CMA is this cert
    if (simplified.includes('cs') || simplified.includes('company secretary')) return 'CS (Company Secretary)';
    if (simplified.includes('ca') || simplified.includes('chartered accountant')) return 'CA (Chartered Accountant)';
    if (simplified.includes('cpa')) return 'CPA (Certified Public Accountant)';
    if (simplified.includes('pmp')) return 'PMP (Project Management Professional)';
    if (simplified.includes('acca')) return 'ACCA (Association of Chartered Certified Accountants)';
    if (simplified.includes('cfa')) return 'CFA (Chartered Financial Analyst)';
    if (simplified.includes('sap')) return 'SAP (System Applications and Products)'; // General SAP
    if (simplified.includes('csm')) return 'CSM (Certified Scrum Master)'; // Assuming CSM
    if (simplified.includes('aiml')) return 'AIML (Artificial Intelligence & Machine Learning)'; // Assuming AIML specialization

    // Lower level qualifications
    if (simplified.includes('diploma')) return 'Diploma';
    if (simplified.includes('iti')) return 'ITI';
    if (simplified.includes('puc')) return '12th'; // PUC is 12th standard
    if (simplified.includes('sslc') || simplified.includes('10th')) return '10th';

    // Other specific terms found in your list
    if (simplified.includes('srimanyayasudha')) return 'Sriman Nyayasudha';
    if (simplified.includes('aerospace engineer')) return 'BE (Aerospace Engineering)'; // Assume BE if not explicitly B.Tech
    if (simplified.includes('aeronautical engineer')) return 'BE (Aeronautical Engineering)';
    if (simplified.includes('pharmacist') || simplified.includes('pharmacy')) return 'BPharm (Bachelor of Pharmacy)';
    if (simplified.includes('engineer')) return 'BE (Engineering)'; // Generic if not specific branch
    if (simplified.includes('architect')) return 'BArch (Bachelor of Architecture)';
    if (simplified.includes('geoinformatics')) return 'MSc (Geoinformatics)';
    if (simplified.includes('multimedia')) return 'BSc (Multimedia)';
    if (simplified.includes('interior designing')) return 'BSc (Interior Designing)';
    if (simplified.includes('networking')) return 'BSc (Networking)';
    if (simplified.includes('game developing')) return 'Diploma (Game Development)';
    if (simplified.includes('computer science')) return 'BE (Computer Science)'; // Specific branches already handled, fallback
    if (simplified.includes('electronics')) return 'BE (Electronics)';
    if (simplified.includes('electrical')) return 'BE (Electrical Engineering)';
    if (simplified.includes('mechanical')) return 'BE (Mechanical Engineering)';
    if (simplified.includes('civil')) return 'BE (Civil Engineering)';
    if (simplified.includes('information science')) return 'BE (Information Science)';
    if (simplified.includes('biotechnology')) return 'MSc (Biotechnology)';
    if (simplified.includes('chemistry')) return 'MSc (Chemistry)';
    if (simplified.includes('mathematics')) return 'MSc (Mathematics)';
    if (simplified.includes('physics')) return 'MSc (Physics)';
    if (simplified.includes('microbiology')) return 'MSc (Microbiology)';
    if (simplified.includes('biochemistry')) return 'MSc (Biochemistry)';
    if (simplified.includes('nursing')) return 'BSc (Nursing)'; // If any nursing degrees appear
    if (simplified.includes('management')) return 'MBA (Management)'; // Generic if not specific type
    if (simplified.includes('accounting')) return 'BCom (Accounting)'; // Generic if not specific type
    if (simplified.includes('finance')) return 'MBA (Finance)'; // Generic if not specific type
    if (simplified.includes('marketing')) return 'MBA (Marketing)'; // Generic if not specific type
    if (simplified.includes('hr')) return 'MBA (HR)'; // Generic if not specific type

    // Catch-all for very generic terms or unmappable.
    if (simplified.includes('graduation')) return 'Graduation';
    if (simplified.includes('degree')) return 'Degree';

    // If nothing matched, return null
    return null;
}

async function transformEducationData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // 1. Fetch all profile_id_raw and educational_qualification_raw
        const [profiles] = await connection.query(`SELECT profile_id_raw, educational_qualification_raw FROM profiles_staging`);
        console.log(`Fetched ${profiles.length} profiles for education transformation.`);

        const updates = [];
        for (const profile of profiles) {
            const originalEducation = profile.educational_qualification_raw;
            const standardizedEdu = standardizeEducation(originalEducation);
            
            updates.push({
                profile_id_raw: profile.profile_id_raw,
                standardized_education: standardizedEdu
            });
        }

        // 2. Perform batch updates
        const batchSize = 50; // Adjust batch size as needed
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            let updateQueries = batch.map(item => {
                const eduValue = item.standardized_education !== null ? connection.escape(item.standardized_education) : 'NULL';
                return `UPDATE profiles_staging SET educational_qualification_raw = ${eduValue} WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Educational qualification transformation completed successfully.');

    } catch (error) {
        console.error('Error during educational qualification transformation:', error.message);
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

transformEducationData();