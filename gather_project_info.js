// gather_project_info.js
const fs = require('fs');
const path = require('path');

// Force use of mysql2 from SMKalyanBE
const mysql = require(path.join(__dirname, 'SMKalyanBE', 'node_modules', 'mysql2', 'promise'));

// --- Output files setup ---
const outputFilePath = path.join(__dirname, 'project_info_output.txt');   // full details
const summaryFilePath = path.join(__dirname, 'project_info_summary.txt'); // summary only

const outputStream = fs.createWriteStream(outputFilePath, { flags: 'w' });
const summaryStream = fs.createWriteStream(summaryFilePath, { flags: 'w' });

// ✅ ADDED: Track files for the final list (same idea as your other script)
let processedFiles = [];

function logToConsoleAndFile(message) {
    console.log(message);
    outputStream.write(message + '\n');
}

function logSummary(message) {
    summaryStream.write(message + '\n');
}

function readAllFiles(dirPath, filesArray = [], excludePatterns) {
    try {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            // Check if the file or directory should be excluded
            const isExcluded = excludePatterns.some(pattern => {
                if (typeof pattern === 'string') {
                    return file.includes(pattern);
                }
                return pattern.test(file);
            });

            if (!isExcluded) {
                if (stat.isDirectory()) {
                    readAllFiles(fullPath, filesArray, excludePatterns);
                } else {
                    filesArray.push({ path: fullPath, content: fs.readFileSync(fullPath, 'utf8') });

                    // ✅ ADDED: Collect file list for FINAL LIST output
                    processedFiles.push(fullPath.replace(__dirname, ''));
                }
            }
        });
    } catch (err) {
        logToConsoleAndFile(`Error reading directory ${dirPath}: ${err.message}`);
    }
    return filesArray;
}

async function getProjectInformation() {
    let connection = null;

    try {
        logToConsoleAndFile("=========================================================");
        logToConsoleAndFile("=== GATHERING PROJECT INFORMATION ===");
        logToConsoleAndFile("=========================================================\n");

        // --- DB Connection Test ---
        logToConsoleAndFile("=== DATABASE CONNECTION TEST ===");

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
        });

        logToConsoleAndFile("✅ MySQL database connection successful.\n");

        // --- Directory scanning ---
        const backendPath = path.join(__dirname, 'SMKalyanBE');
        const frontendPath = path.join(__dirname, 'SMKalyanFE');

        const excludePatterns = [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            '.next',
            '.cache',
            '.DS_Store',
            /package-lock\.json$/,
            /yarn\.lock$/,
            /pnpm-lock\.yaml$/,
            /\.log$/,
            /\.png$/,
            /\.jpg$/,
            /\.jpeg$/,
            /\.gif$/,
            /\.svg$/,
            /\.ico$/,
            /\.pdf$/,
            /\.zip$/,
            /\.tar$/,
            /\.gz$/,
            /\.map$/
        ];

        // --- Backend file collection ---
        logToConsoleAndFile("=== SCANNING BACKEND FILES ===");
        const backendFiles = readAllFiles(backendPath, [], excludePatterns);

        logToConsoleAndFile(`Found ${backendFiles.length} backend files.\n`);
        logSummary(`Backend Files Count: ${backendFiles.length}`);

        backendFiles.forEach(file => {
            logToConsoleAndFile(`--- File: ${file.path.replace(__dirname, '')} ---`);
            logToConsoleAndFile(file.content);
            logToConsoleAndFile('---------------------------------------------------\n');

            // summary only file paths
            logSummary(`Backend File: ${file.path.replace(__dirname, '')}`);
        });

        // --- Frontend file collection ---
        logToConsoleAndFile("=== SCANNING FRONTEND FILES ===");
        const frontendFiles = readAllFiles(frontendPath, [], excludePatterns);

        logToConsoleAndFile(`Found ${frontendFiles.length} frontend files.\n`);
        logSummary(`Frontend Files Count: ${frontendFiles.length}`);

        logToConsoleAndFile('--- Frontend Files ---\n');
        frontendFiles.forEach(file => {
            logToConsoleAndFile(`--- File: ${file.path.replace(__dirname, '')} ---`);
            logToConsoleAndFile(file.content);
            logToConsoleAndFile('---------------------------------------------------\n');

            // summary only file paths
            logSummary(`Frontend File: ${file.path.replace(__dirname, '')}`);
        });

        // ✅ ADDED: FINAL SUMMARY LIST (numbered list of all files reviewed)
        logToConsoleAndFile("\n=========================================================");
        logToConsoleAndFile("=== FINAL LIST OF FILES REVIEWED ===");
        logToConsoleAndFile("=========================================================");
        processedFiles.forEach((f, i) => logToConsoleAndFile(`${i + 1}. ${f}`));

        logToConsoleAndFile("\n=========================================================");
        logToConsoleAndFile("=== GATHERING COMPLETE ===");
        logToConsoleAndFile("=========================================================");

        logSummary("=== GATHERING COMPLETE (SUMMARY) ===");
        logSummary(`Total Files Reviewed: ${processedFiles.length}`);

    } catch (err) {
        logToConsoleAndFile(`❌ ERROR: ${err.message}`);
        logSummary(`ERROR: ${err.message}`);
    } finally {
        try {
            if (connection) await connection.end();
        } catch (e) {
            // keep silent (do not change behavior)
        }

        outputStream.end();
        summaryStream.end();

        // Optional console note (matches the style used in your other file, but harmless)
        console.log(`\nDone! Processed ${processedFiles.length} files.`);
    }
}

getProjectInformation();
