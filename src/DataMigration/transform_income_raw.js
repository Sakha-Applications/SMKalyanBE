// File: transform_income_raw.js

const pool = require("../config/db"); // Your existing database connection pool

// Define conversion rates (approximate, adjust as needed for migration date)
const USD_TO_INR = 83.5; // Example: 1 USD = 83.5 INR
const AUD_TO_INR = 55.0; // Example: 1 AUD = 55.0 INR
const EUR_TO_INR = 90.0; // Example: 1 Euro = 90.0 INR
const GBP_TO_INR = 105.0; // Example: 1 GBP = 105.0 INR

// Define your target income ranges for categorization
const INCOME_RANGES = [
    { label: "Below ₹2 Lakh", minLakhs: 0, maxLakhs: 2 },
    { label: "₹2 to ₹4 Lakh", minLakhs: 2, maxLakhs: 4 },
    { label: "₹4 to ₹6 Lakh", minLakhs: 4, maxLakhs: 6 },
    { label: "₹6 to ₹10 Lakh", minLakhs: 6, maxLakhs: 10 },
    { label: "₹10 to ₹15 Lakh", minLakhs: 10, maxLakhs: 15 },
    { label: "₹15 to ₹25 Lakh", minLakhs: 15, maxLakhs: 25 },
    { label: "₹25 to ₹50 Lakh", minLakhs: 25, maxLakhs: 50 },
    { label: "₹50 Lakh to ₹1 Crore", minLakhs: 50, maxLakhs: 100 }, // 1 Crore = 100 Lakhs
    { label: "Above ₹1 Crore", minLakhs: 100, maxLakhs: Infinity }
];

/**
 * Parses an income string and normalizes it to INR Lakhs.
 * @param {string} incomeStr - The raw income string.
 * @returns {number|null} Income in INR Lakhs, or null if parsing/mapping fails.
 */
function normalizeIncomeToLakhsINR(incomeStr) {
    if (!incomeStr || typeof incomeStr !== 'string') {
        return null;
    }

    let cleanedStr = incomeStr.trim().toLowerCase();

    // Handle special cases first
    if (cleanedStr.includes('undisclosed') || cleanedStr === 'na' || cleanedStr === 'unemployed' || cleanedStr === 'studying' || cleanedStr.includes('company turnover')) {
        return null; // Map to NULL, will be categorized as 'Undisclosed' by findIncomeRange
    }
    
    // Pattern to extract number and unit
    const match = cleanedStr.match(/([0-9]+\.?[0-9]*)\s*(lakhs pa|lakhs|lakh|lpa|cr|crore|k usd|k euros|k gbp|usd|aud|euros|gbp|\$|per annum|pa)?/);

    if (!match) {
        console.warn(`Could not parse income: "${incomeStr}". Mapping to NULL.`);
        return null;
    }

    let value = parseFloat(match[1]);
    let unit = match[2] ? match[2].trim() : '';

    if (isNaN(value)) {
        return null;
    }

    let incomeInLakhs = 0;

    if (unit.includes('lpa') || unit.includes('lakhs') || unit.includes('lakh')) {
        incomeInLakhs = value;
    } else if (unit.includes('cr') || unit.includes('crore')) {
        incomeInLakhs = value * 100; // 1 Crore = 100 Lakhs
    } else if (unit.includes('k usd') || unit === 'usd' || unit === '$') {
        incomeInLakhs = (value * 1000 * USD_TO_INR) / 100000; // Convert to INR, then to Lakhs
    } else if (unit.includes('k euros') || unit === 'euros') {
        incomeInLakhs = (value * 1000 * EUR_TO_INR) / 100000; // Convert to INR, then to Lakhs
    } else if (unit.includes('k gbp') || unit === 'gbp') {
        incomeInLakhs = (value * 1000 * GBP_TO_INR) / 100000; // Convert to INR, then to Lakhs
    } else if (unit.includes('aud')) {
        incomeInLakhs = (value * AUD_TO_INR) / 100000; // Assuming 'lacks AUD$' meant lakhs, but standardizing to unit of 1 AUD
    } else if (!unit && value > 1000000) { // Large numbers without unit, assume in Rupees and convert to Lakhs
        incomeInLakhs = value / 100000;
    } else if (!unit && value < 1000) { // Small numbers like '5k' or '50k' might be in thousands if no unit
        if (cleanedStr.includes('k')) { // e.g. "5k"
            incomeInLakhs = (value * 1000) / 100000;
        } else if (cleanedStr.includes('per annum')) { // e.g. "5000 per annum"
             incomeInLakhs = value / 100000;
        } else { // Could be just a number in Lakhs if unit is missing and it's reasonable
            incomeInLakhs = value; // Assume it's already in Lakhs if no unit and small. E.g. "7"
        }
    } else { // Fallback for other unhandled units or ambiguous numbers
        incomeInLakhs = value; // Default to assuming it's in lakhs if no clear unit
    }

    // Handle ranges that might have been processed: e.g. "10 - 12 LPA" -> 11 LPA
    const rangeMatch = cleanedStr.match(/([0-9]+\.?[0-9]*)\s*-\s*([0-9]+\.?[0-9]*)/);
    if (rangeMatch) {
        const lower = parseFloat(rangeMatch[1]);
        const upper = parseFloat(rangeMatch[2]);
        if (!isNaN(lower) && !isNaN(upper)) {
            return normalizeIncomeToLakhsINR(`${(lower + upper) / 2} ${unit}`); // Re-evaluate the average
        }
    }
    
    return parseFloat(incomeInLakhs.toFixed(2));
}

/**
 * Categorizes an income in INR Lakhs into the predefined ranges.
 * @param {number|null} incomeLakhs - The normalized income in INR Lakhs.
 * @returns {string} The matching income range label, or 'Undisclosed'.
 */
function findIncomeRange(incomeLakhs) {
    if (incomeLakhs === null || isNaN(incomeLakhs)) {
        return 'Undisclosed';
    }

    if (incomeLakhs < 2) {
        return "Below ₹2 Lakh";
    }

    for (const range of INCOME_RANGES) {
        if (incomeLakhs >= range.minLakhs && incomeLakhs < range.maxLakhs) {
            return range.label;
        }
    }

    // Fallback for Above ₹1 Crore or unhandled large values
    if (incomeLakhs >= 100) {
        return "Above ₹1 Crore";
    }

    return 'Undisclosed'; // Should not be reached if ranges are exhaustive
}

async function transformIncomeData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        // 1. Fetch all profile_id_raw and annual_income_raw
        const [profiles] = await connection.query(`SELECT profile_id_raw, annual_income_raw FROM profiles_staging`);
        console.log(`Fetched ${profiles.length} profiles for income transformation.`);

        const updates = [];
        for (const profile of profiles) {
            const originalIncome = profile.annual_income_raw;
            const normalizedIncome = normalizeIncomeToLakhsINR(originalIncome);
            const incomeCategory = findIncomeRange(normalizedIncome);
            
            updates.push({
                profile_id_raw: profile.profile_id_raw,
                income_category: incomeCategory
            });
        }

        // 2. Perform batch updates
        // We'll update the annual_income_raw column itself in place
        const batchSize = 100; // Adjust batch size as needed
        console.log(`Starting batch updates for ${updates.length} profiles...`);

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            // Build a multi-line UPDATE statement for the batch
            let updateQueries = batch.map(item => {
                const incomeValue = connection.escape(item.income_category); // Escape string value
                return `UPDATE profiles_staging SET annual_income_raw = ${incomeValue} WHERE profile_id_raw = ${connection.escape(item.profile_id_raw)};`;
            }).join('\n');

            // Ensure SQL_SAFE_UPDATES is off for these mass updates
            await connection.query('SET SQL_SAFE_UPDATES = 0;'); 
            const [result] = await connection.query(updateQueries);
            console.log(`Batch ${Math.floor(i/batchSize) + 1} processed. Affected rows: ${result.affectedRows}`);
        }

        console.log('Annual income transformation completed successfully.');

    } catch (error) {
        console.error('Error during annual income transformation:', error.message);
        if (error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
    } finally {
        if (connection) {
            connection.release();
            console.log('Database connection released back to pool.');
        }
        // Ensure SQL_SAFE_UPDATES is re-enabled for general use outside this script
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

transformIncomeData();