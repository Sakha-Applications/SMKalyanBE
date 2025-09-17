// data-migration/migrate.js

require('dotenv').config(); // Load environment variables from .env
const pool = require("../config/db"); // Your existing database connection pool
const bcrypt = require('bcrypt'); // For password hashing

// --- Configuration ---
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// --- Helper Functions for Data Transformation ---

/**
 * Simple helper to parse location strings into state and country.
 * This is a basic implementation and might need significant enhancement
 * for real-world, varied location data. Consider a dedicated library or lookup table.
 * @param {string} locationString - The raw location string (e.g., "Bengaluru, Karnataka, India")
 * @returns {{state: string|null, country: string|null}}
 */
function parseLocation(locationString) {
    if (!locationString) return { state: null, country: null };
    const parts = locationString.split(',').map(p => p.trim());
    let state = null;
    let country = null;

    if (parts.length >= 3) {
        country = parts[parts.length - 1];
        state = parts[parts.length - 2];
    } else if (parts.length === 2) {
        // Could be "City, State" or "City, Country" - heuristic needed
        state = parts[1]; // Assuming State
    } else if (parts.length === 1) {
        state = parts[0]; // Could be just a city or country
    }

    // Basic cleanup/standardization for common cases
    if (country && country.toLowerCase() === 'india' && state && state.length <= 3) {
        const stateMap = {
            'ka': 'Karnataka', 'mh': 'Maharashtra', 'tn': 'Tamil Nadu',
            'dl': 'Delhi', 'ts': 'Telangana', 'up': 'Uttar Pradesh',
            // Add more as needed
        };
        state = stateMap[state.toLowerCase()] || state;
    }

    return { state: state || null, country: country || null };
}

/**
 * Generates a random password.
 * @param {number} length - The desired length of the password.
 * @returns {string} The generated password.
 */
function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Transforms a single row from profiles_staging into data suitable for 'profile' and 'userlogin' tables.
 * @param {Object} stagingRow - A row object from the profiles_staging table.
 * @returns {{profileData: Object, userLoginData: Object, warnings: string[]}}
 */
function transformProfileDataForMigration(stagingRow) {
    const profileData = {};
    const userLoginData = {};
    const warnings = [];

    // --- Profile Table Mappings ---
    profileData.profile_id = stagingRow.profile_id_raw;
    profileData.name = stagingRow.full_name_raw;
    profileData.profile_created_for = stagingRow.profile_created_for_raw;
    profileData.profile_status = stagingRow.profile_status_raw;
    profileData.mother_tongue = stagingRow.mother_tongue_raw;
    profileData.current_age = stagingRow.current_age_raw;
    profileData.gotra = stagingRow.gotra_raw;
    profileData.sub_caste = stagingRow.sub_caste_raw;
    profileData.guru_matha = stagingRow.guru_matha_raw;
    profileData.dob = stagingRow.date_of_birth_raw;
    profileData.time_of_birth = stagingRow.time_of_birth_raw;
    profileData.rashi = stagingRow.rashi_raw;
    profileData.height = stagingRow.height_raw;
    profileData.nakshatra = stagingRow.nakshatra_raw;
    profileData.charana_pada = stagingRow.charana_pada_raw;
    // FIX: Provide a default value for 'education' if 'educational_qualification_raw' is null/empty
    profileData.education = stagingRow.educational_qualification_raw || 'Not Specified';
    profileData.working_status = stagingRow.is_working_raw;
    profileData.current_company = stagingRow.current_company_raw;
    profileData.annual_income = stagingRow.annual_income_raw;
    profileData.father_name = stagingRow.fathers_full_name_raw;
    profileData.father_profession = stagingRow.father_occupation_raw;
    profileData.mother_name = stagingRow.mothers_full_name_raw;
    profileData.mother_profession = stagingRow.mother_occupation_raw;
    profileData.expectations = stagingRow.expectations_preferences_raw;
    profileData.about_bride_groom = stagingRow.about_profile_raw;
    profileData.how_did_you_know = stagingRow.how_known_raw;
    profileData.profession = stagingRow.profession_final;
    profileData.designation = stagingRow.designation_final;
    profileData.no_of_sisters = stagingRow.no_of_sisters;
    profileData.no_of_brothers = stagingRow.no_of_brothers;
    profileData.reference1_phone = stagingRow.reference_1_phone;
    profileData.reference2_phone = stagingRow.reference_2_phone;
    profileData.reference1_name = stagingRow.reference_1_raw; // Assuming it's just the name
    profileData.reference2_name = stagingRow.reference_2_raw; // Assuming it's just the name
    profileData.siblings = stagingRow.brothers_sisters_details_raw; // Keep as text, or parse further if needed

    // Cleaned/Transformed fields
    profileData.email = stagingRow.email_address_raw ? stagingRow.email_address_raw.trim().toLowerCase() : null;
    profileData.phone = stagingRow.phone_number_raw ? stagingRow.phone_number_raw.replace(/\D/g, '') : null;
    profileData.alternate_phone = stagingRow.alternate_phone_number_raw ? stagingRow.alternate_phone_number_raw.replace(/\D/g, '') : null;

    // Location parsing
    profileData.native_place = stagingRow.native_place_raw;
    const nativePlaceParsed = parseLocation(stagingRow.native_place_raw);
    profileData.native_place_state = nativePlaceParsed.state;
    profileData.native_place_country = nativePlaceParsed.country;

    profileData.current_location = stagingRow.current_work_location_raw;
    const currentLocationParsed = parseLocation(stagingRow.current_work_location_raw);
    profileData.current_location_state = currentLocationParsed.state;
    profileData.current_location_country = currentLocationParsed.country;

    profileData.place_of_birth = stagingRow.place_of_birth_raw;
    const placeOfBirthParsed = parseLocation(stagingRow.place_of_birth_raw);
    profileData.place_of_birth_state = placeOfBirthParsed.state;
    profileData.place_of_birth_country = placeOfBirthParsed.country;

    profileData.communication_address = stagingRow.communication_address_raw;
    const communicationAddressParsed = parseLocation(stagingRow.communication_address_raw);
    profileData.communication_state = communicationAddressParsed.state;

    profileData.residence_address = stagingRow.residing_address_raw;
    const residenceAddressParsed = parseLocation(stagingRow.residing_address_raw);
    profileData.residence_state = residenceAddressParsed.state;

    // Default values for new fields in 'profile' (ensure these match your profile table schema defaults)
    profileData.profile_for = 'Self'; // Default, review if logic exists in staging
    profileData.share_details_on_platform = 'No';
    profileData.married_status = 'Unmarried';
    profileData.profile_category = 'General';
    profileData.profile_category_need = null;
    profileData.diet = null; // Assuming these are stored as comma-separated strings or JSON if they were arrays
    profileData.hobbies = null; // Assuming these are stored as comma-separated strings or JSON if they were arrays
    profileData.country_living_in = currentLocationParsed.country;
    profileData.manglik_status = null;
    profileData.age_range = null;
    profileData.height_range = null;
    profileData.preferred_income_range = null;
    profileData.preferred_education = null;
    profileData.preferred_mother_tongues = null;
    profileData.preferred_marital_status = null;
    profileData.preferred_bride_groom_category = null;
    profileData.preferred_manglik_status = null;
    profileData.preferred_sub_castes = null;
    profileData.preferred_guru_mathas = null;
    profileData.preferred_gotras = null;
    profileData.preferred_nakshatras = null;
    profileData.preferred_rashis = null;
    profileData.preferred_native_origins = null;
    profileData.preferred_cities = null;
    profileData.preferred_countries = null;
    profileData.preferred_diet = null;
    profileData.preferred_professions = null;
    profileData.preferred_hobbies = null;
    profileData.guardian_phone = null;
    profileData.family_status = null;
    profileData.family_type = null;
    profileData.family_values = null;

    // FIX: Handle '0000-00-00 00:00:00' and invalid dates for created_at
    let parsedCreatedAt = null;
    if (stagingRow.timestamp_raw && stagingRow.timestamp_raw.trim() !== '0000-00-00 00:00:00') {
        try {
            const dateObj = new Date(stagingRow.timestamp_raw);
            if (!isNaN(dateObj.getTime())) { // Check if date parsing was successful
                parsedCreatedAt = dateObj;
            } else {
                warnings.push(`Could not parse timestamp_raw for profile ${stagingRow.profile_id_raw}: '${stagingRow.timestamp_raw}'. Setting to NULL.`);
            }
        } catch (e) {
            warnings.push(`Error parsing timestamp_raw for profile ${stagingRow.profile_id_raw}: '${stagingRow.timestamp_raw}'. Setting to NULL. Error: ${e.message}`);
        }
    } else if (stagingRow.timestamp_raw && stagingRow.timestamp_raw.trim() === '0000-00-00 00:00:00') {
        warnings.push(`'timestamp_raw' for profile ${stagingRow.profile_id_raw} is '0000-00-00 00:00:00'. Setting to NULL.`);
    }
    profileData.created_at = parsedCreatedAt;


    // --- User Login Table Mappings ---
    userLoginData.profile_id = stagingRow.profile_id_raw;
    userLoginData.user_id = profileData.email; // Assuming email is the user_id for login
    // password will be generated and set in the main migration loop
    userLoginData.resetPasswordToken = null; // Explicitly set to NULL
    userLoginData.resetPasswordExpires = null; // Explicitly set to NULL
    userLoginData.password_change_count = 0; // Explicitly set to 0
    userLoginData.first_login = 1; // Explicitly set to 1
    userLoginData.role = 'USER';
    userLoginData.is_active = 'Yes';
    userLoginData.notes = 'Migrated from old system.';
    // Use profile created_at if valid, otherwise use current date for userlogin
    userLoginData.created_at = parsedCreatedAt || new Date();

    // Warnings for unmapped/ambiguous fields from staging
    if (stagingRow.details_furnished_raw) warnings.push(`'details_furnished_raw' was not mapped: ${stagingRow.details_furnished_raw}`);
    if (stagingRow.photos_raw) warnings.push(`'photos_raw' contains photo data. Needs separate media migration: ${stagingRow.photos_raw}`);
    if (stagingRow.horoscope_copy_raw) warnings.push(`'horoscope_copy_raw' contains horoscope data. Needs separate media migration: ${stagingRow.horoscope_copy_raw}`);
    if (stagingRow.email_alt_raw) warnings.push(`'email_alt_raw' contains alternate email. No target field in 'profile': ${stagingRow.email_alt_raw}`);
    if (stagingRow.cv_resume_raw) warnings.push(`'cv_resume_raw' contains CV/resume data. Needs separate media migration: ${stagingRow.cv_resume_raw}`);
    if (stagingRow.mother_native_place_raw) warnings.push(`'mother_native_place_raw' was not mapped: ${stagingRow.mother_native_place_raw}`);
    if (stagingRow.parents_details_raw) warnings.push(`'parents_details_raw' was not mapped. Review its content: ${stagingRow.parents_details_raw}`);
    if (stagingRow.score_raw) warnings.push(`'score_raw' was not mapped. Appears to be an internal scoring field: ${stagingRow.score_raw}`);

    return { profileData, userLoginData, warnings };
}

// --- Main Migration Function ---
async function runMigration() {
    // The 'pool' is already imported from '../config/db'

    try {
        console.log('🔗 Attempting to get a connection from the existing database pool...');
        const connection = await pool.getConnection(); // Get a connection to test the pool
        console.log('✅ Successfully obtained a connection from the existing pool.');
        connection.release(); // Release the test connection immediately

        console.log('📊 Fetching data from profiles_staging...');
        const [stagingRows] = await pool.execute('SELECT * FROM profiles_staging');
        console.log(`✅ Fetched ${stagingRows.length} rows from profiles_staging.`);

        let migratedCount = 0;
        let failedCount = 0;
        const migrationErrors = [];

        for (const row of stagingRows) {
            const profileId = row.profile_id_raw;
            console.log(`\nProcessing profile ID: ${profileId}`);

            // Use a connection from the pool for the transaction
            const transactionConnection = await pool.getConnection();
            try {
                await transactionConnection.beginTransaction();

                const { profileData, userLoginData, warnings } = transformProfileDataForMigration(row);

                if (warnings.length > 0) {
                    console.warn(`⚠️ Warnings for ${profileId}:`);
                    warnings.forEach(w => console.warn(`   - ${w}`));
                }

                // 1. Check if profile already exists in target (for idempotency)
                const [existingProfiles] = await transactionConnection.execute(
                    'SELECT profile_id FROM profile WHERE profile_id = ?',
                    [profileData.profile_id]
                );

                if (existingProfiles.length > 0) {
                    console.log(`⏭️ Profile ${profileId} already exists in target. Skipping.`);
                    await transactionConnection.rollback();
                    migratedCount++; // Count as "processed" rather than "migrated"
                    continue;
                }

                // 2. Insert into 'profile' table
                const profileColumns = Object.keys(profileData).join(', ');
                const profilePlaceholders = Object.keys(profileData).map(() => '?').join(', ');
                const profileValues = Object.values(profileData);

                const profileInsertQuery = `INSERT INTO profile (${profileColumns}) VALUES (${profilePlaceholders})`;
                await transactionConnection.execute(profileInsertQuery, profileValues);
                console.log(`   ✅ Inserted profile ${profileId}.`);

                // 3. Generate password hash and insert into 'userlogin' table
                const plainPassword = generateRandomPassword(); // Generate a new random password
                const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
                userLoginData.password = hashedPassword; // Assign to 'password' column

                const userLoginColumns = Object.keys(userLoginData).join(', ');
                const userLoginPlaceholders = Object.keys(userLoginData).map(() => '?').join(', ');
                const userLoginValues = Object.values(userLoginData);

                const userLoginInsertQuery = `INSERT INTO userlogin (${userLoginColumns}) VALUES (${userLoginPlaceholders})`;
                await transactionConnection.execute(userLoginInsertQuery, userLoginValues);
                console.log(`   ✅ Inserted user login for ${userLoginData.user_id}.`);
                console.log(`   🔑 Generated password for ${userLoginData.user_id}: ${plainPassword}`); // LOG THIS CAREFULLY IN PRODUCTION!

                // ⚠️ IMPORTANT: Store generated passwords securely if you need to communicate them to users.
                // For a real migration, you'd save these to a secure file or a temporary table
                // that is later used for communication (e.g., email, SMS, or force password reset).
                // DO NOT log them to console in a production environment.
                // For this example, we log it for demonstration purposes.

                await transactionConnection.commit();
                console.log(`   🎉 Successfully migrated ${profileId}.`);
                migratedCount++;

            } catch (error) {
                console.error(`   ❌ Failed to migrate profile ${profileId}:`, error.message);
                migrationErrors.push({ profileId, error: error.message, stack: error.stack });
                failedCount++;
                try {
                    // Rollback if any error occurs within the transaction
                    await transactionConnection.rollback();
                    console.log(`   ↩️ Rolled back transaction for ${profileId}.`);
                } catch (rollbackError) {
                    console.error(`   🚨 Error during rollback for ${profileId}:`, rollbackError.message);
                }
            } finally {
                if (transactionConnection) transactionConnection.release(); // Release the connection back to the pool
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Total profiles in staging: ${stagingRows.length}`);
        console.log(`Successfully migrated/skipped: ${migratedCount}`);
        console.log(`Failed migrations: ${failedCount}`);

        if (migrationErrors.length > 0) {
            console.error('\n--- Detailed Migration Errors ---');
            migrationErrors.forEach(err => {
                console.error(`Profile ID: ${err.profileId}`);
                console.error(`Error: ${err.error}`);
                // console.error(`Stack: ${err.stack}`); // Uncomment for full stack trace
                console.error('---');
            });
        }

    } catch (error) {
        console.error('Fatal error during migration setup or execution:', error.message);
        console.error(error.stack);
    } finally {
        // No need to close the pool here as it's managed by ../config/db
        console.log('🔌 Migration script finished. Database connection pool remains active via ../config/db.');
    }
}

// Run the migration
runMigration();
    