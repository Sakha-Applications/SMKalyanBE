// File: import_csv_to_staging.js

const pool = require("../config/db"); // Your existing database connection pool
const fs = require('fs');
const { parse } = require('csv-parse'); // For parsing CSV data

async function importCsvToProfilesStaging() {
    let connection; 
    try {
        // Get a connection from the existing pool
        connection = await pool.getConnection(); 
        console.log('Successfully obtained a connection from the existing pool to Azure MySQL database.');

        const csvFilePath = 'src/DataMigration/Form responses 1.csv'; 
        const records = [];
        let headerSkipped = false; // Flag to skip the header row

        // Create a readable stream from the CSV file and pipe it to the CSV parser
        const parser = fs.createReadStream(csvFilePath)
            .pipe(parse({
                delimiter: ',',            // Fields are separated by commas
                relax_quotes: true,        // Allow quotes to be unescaped or contain delimiters
                relax_column_count: true   // Allow rows to have varying numbers of columns (handle potential malformed rows)
            }));

        // Event listener for each 'data' (row) parsed from the CSV
        parser.on('data', (row) => {
            if (!headerSkipped) {
                headerSkipped = true; // Skip the very first row (which is the header)
                return;
            }
            records.push(row); // Add the data row to our records array
        });

        // Event listener for when the CSV parsing is complete
        parser.on('end', async () => {
            console.log(`Finished reading CSV. Found ${records.length} data rows to import.`);

            // The SQL INSERT statement for your profiles_staging table
            const insertQuery = `INSERT INTO profiles_staging (
                timestamp_raw, email_address_raw, profile_created_for_raw, profile_status_raw, 
                details_furnished_raw, full_name_raw, native_place_raw, current_age_raw, 
                gotra_raw, sub_caste_raw, guru_matha_raw, mother_tongue_raw, 
                current_work_location_raw, height_raw, about_profile_raw, photos_raw, 
                rashi_raw, nakshatra_raw, charana_pada_raw, date_of_birth_raw, 
                time_of_birth_raw, place_of_birth_raw, horoscope_copy_raw, phone_number_raw, 
                alternate_phone_number_raw, email_alt_raw, communication_address_raw, 
                residing_address_raw, educational_qualification_raw, is_working_raw, 
                current_company_raw, profession_designation_raw, annual_income_raw, 
                cv_resume_raw, fathers_full_name_raw, father_occupation_raw, 
                mothers_full_name_raw, mother_occupation_raw, mother_native_place_raw, 
                brothers_sisters_details_raw, parents_details_raw, expectations_preferences_raw, 
                reference_1_raw, reference_2_raw, score_raw, how_known_raw, 
                unnamed_46_raw, calc_age_raw, profile_id_raw, calc_eq_raw, unnamed_50_raw
            ) VALUES ?`; // The '?' placeholder is crucial for efficient batch insertion

            // Prepare the data for batch insertion.
            // Ensure each row has exactly 51 columns (matching the table schema).
            // Fill any missing columns in the CSV row with `null` to prevent errors.
            const valuesToInsert = records.map(row => {
                const processedRow = [...row];
                // Pad the row with nulls if it has fewer columns than expected (51 columns in profiles_staging)
                while (processedRow.length < 51) { 
                    processedRow.push(null); 
                }
                // Ensure we only take exactly 51 columns, even if raw CSV has more (due to relax_column_count)
                return processedRow.slice(0, 51); 
            });

            try {
                // Execute the batch insert query
                const [result] = await connection.query(insertQuery, [valuesToInsert]);
                console.log(`Successfully inserted ${result.affectedRows} rows into profiles_staging.`);
            } catch (queryError) {
                console.error('Error during database insert operation:', queryError.message);
                // Log the first few problematic rows for debugging if needed
                // console.error('Problematic data sample:', valuesToInsert.slice(0, 5)); 
            } finally {
                // Always release the connection back to the pool
                if (connection) {
                    connection.release(); 
                    console.log('Database connection released back to pool.');
                }
                // Do NOT call pool.end() here if your application uses this pool for ongoing operations.
                // It would shut down the entire connection pool used by your running app.
                // For a migration script that's run standalone, it's typically fine to leave pool management to the application.
            }
        });

        // Event listener for errors during CSV file reading/parsing
        parser.on('error', (error) => {
            console.error('Error in CSV file stream or parsing:', error.message);
            // Ensure connection is released even on stream errors
            if (connection) connection.release(); 
        });

    } catch (initialConnectionError) {
        console.error('Failed to establish initial database connection from pool:', initialConnectionError.message);
        // If an error occurs before getting a connection, ensure nothing hangs.
        if (connection) connection.release();
    }
}

// Execute the import function
importCsvToProfilesStaging();