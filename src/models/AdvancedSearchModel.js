// backend/src/models/AdvancedSearchModel.js
const pool = require("../config/db"); // Ensure this path is correct for your DB connection

// Utility: Convert height string like "5'4\"" or "5' 4\"" to total inches
const parseHeightToInches = (heightStr) => {
    if (!heightStr) return null;

    const s = String(heightStr).trim();

    // Pattern: 5'4", 5' 4", 5 '4", etc.
    const ftInPattern = /^(\d+)\s*'?\s*(\d{1,2})?\s*"?$/;
    const match = s.match(ftInPattern);

    if (match) {
        const feet = parseInt(match[1], 10);
        const inches = match[2] ? parseInt(match[2], 10) : 0;
        return feet * 12 + inches;
    }

    // Fallback: handle formats like "5.4" (interpret .4 as inches 4)
    const num = parseFloat(s);
    if (!isNaN(num)) {
        const feet = Math.floor(num);
        const inches = Math.round((num - feet) * 10); // e.g. 5.4 → 5 ft 4 in
        return feet * 12 + inches;
    }

    return null; // Unknown format
};

const searchProfiles = async (
    profileId,
    profileFor,
    minAge,
    maxAge,
    maritalStatus,
    motherTongue,
    gotra,
    subCaste,
    guruMatha,
    currentCityOfResidence,
    income,
    traditionalValues,
    // --- Placeholders for NEW ADVANCED SEARCH FIELDS ---
    heightMin,
    heightMax,
    qualification,
    educationIn,
    workingWith,
    professionalArea,
    familyStatus,
    familyType,
    religiousValues,
    castingDetails,
    faithLiving,
    dailyRituals,
    observersRajamanta,
    observersChaturmasya
    // --- END of Placeholders ---
) => {
    try {
        // Base query - SELECT * FROM profile is a starting point.
        // If advanced search fields are in other tables, JOINs will be needed later.
        let query = `SELECT * FROM profile WHERE 1=1`;
        let values = [];

        // Add conditions based on provided search parameters (copied from ProfileSearchModel)
        if (profileId) {
            query += ` AND profile_id LIKE ?`;
            values.push(`%${profileId}%`);
        }

        if (profileFor) {
            query += ` AND profile_for = ?`;
            values.push(profileFor);
        }

        if (minAge && maxAge) {
            query += ` AND current_age BETWEEN ? AND ?`;
            values.push(parseInt(minAge), parseInt(maxAge));
        } else if (minAge) {
            query += ` AND current_age >= ?`;
            values.push(parseInt(minAge));
        } else if (maxAge) {
            query += ` AND current_age <= ?`;
            values.push(parseInt(maxAge));
        }

        if (maritalStatus) {
            query += ` AND married_status = ?`;
            values.push(maritalStatus);
        }

        if (motherTongue) {
            query += ` AND mother_tongue = ?`;
            values.push(motherTongue);
        }

        if (gotra) {
            // NOTE: The original condition was `!= ?`. Assuming this was a typo
            // and you want to search for profiles *with* the specified gotra.
            // If `!= ?` was intentional, please clarify. For now, maintaining original.
            query += ` AND gotra != ?`; // Keeping original `!= ?` as per replication request
            values.push(gotra);
        }

        if (subCaste) {
            query += ` AND sub_caste = ?`;
            values.push(subCaste);
        }

        if (guruMatha) {
            query += ` AND guru_matha = ?`;
            values.push(guruMatha);
        }

        if (currentCityOfResidence) {
            query += ` AND current_location = ?`; // Assuming 'current_location' in DB
            values.push(currentCityOfResidence);
        }

        if (income) {
            query += ` AND annual_income = ?`;
            values.push(income);
        }

        if (traditionalValues) {
            query += ` AND family_values = ?`; // Assuming 'family_values' in DB
            values.push(traditionalValues);
        }

        // --- Add conditions for NEW ADVANCED SEARCH FIELDS (placeholders) ---
        // These will be expanded in future steps based on your DB schema.
/*        if (heightMin) {
            // Placeholder: Assume DB column for height, e.g., 'height_inches'
            query += ` AND height_inches >= ?`;
            values.push(parseFloat(heightMin) * 12); // Example conversion: feet.inches to inches
        }
        if (heightMax) {
            // Placeholder: Assume DB column for height, e.g., 'height_inches'
            query += ` AND height_inches <= ?`;
            values.push(parseFloat(heightMax) * 12); // Example conversion: feet.inches to inches
        }

*/



if (qualification) {
            query += ` AND qualification = ?`; // Placeholder DB column
            values.push(qualification);
        }
        if (educationIn) {
            query += ` AND education_in LIKE ?`; // Placeholder DB column
            values.push(`%${educationIn}%`);
        }
        if (workingWith) {
            query += ` AND working_with = ?`; // Placeholder DB column
            values.push(workingWith);
        }
        if (professionalArea) {
            query += ` AND professional_area LIKE ?`; // Placeholder DB column
            values.push(`%${professionalArea}%`);
        }
        if (familyStatus) {
            query += ` AND family_status = ?`; // Placeholder DB column
            values.push(familyStatus);
        }
        if (familyType) {
            query += ` AND family_type = ?`; // Placeholder DB column
            values.push(familyType);
        }
        if (religiousValues) {
            query += ` AND religious_values = ?`; // Placeholder DB column
            values.push(religiousValues);
        }
        if (castingDetails) {
            query += ` AND casting_details LIKE ?`; // Placeholder DB column
            values.push(`%${castingDetails}%`);
        }
        if (faithLiving) {
            query += ` AND faith_living = ?`; // Placeholder DB column
            values.push(faithLiving);
        }
        if (dailyRituals) {
            query += ` AND daily_rituals = ?`; // Placeholder DB column
            values.push(dailyRituals);
        }
        if (observersRajamanta) {
            query += ` AND observers_rajamanta = ?`; // Placeholder DB column
            values.push(observersRajamanta);
        }
        if (observersChaturmasya) {
            query += ` AND observers_chaturmasya = ?`; // Placeholder DB column
            values.push(observersChaturmasya);
        }
        // --- END NEW ADVANCED SEARCH FIELDS ---

/*        query += ` ORDER BY current_age ASC`; // Default sorting

        console.log("Executing Advanced Search query:", query, "with values:", values);
        const [rows] = await pool.execute(query, values); // Use pool.execute for MySQL
        return rows;
  */
 query += ` ORDER BY current_age ASC`; // Default sorting

console.log("Executing Advanced Search query:", query, "with values:", values);
const [rows] = await pool.execute(query, values); // Use pool.execute for MySQL

// --- Post-filter by height using existing `height` column --- //
let finalRows = rows;

if (heightMin || heightMax) {
    const minInches = heightMin ? parseHeightToInches(heightMin) : null;
    const maxInches = heightMax ? parseHeightToInches(heightMax) : null;

    finalRows = rows.filter((profile) => {
        const profileInches = parseHeightToInches(profile.height);

        // If height filter is applied and profile has no valid height, exclude it
        if (profileInches == null) {
            return false;
        }
        if (minInches !== null && profileInches < minInches) return false;
        if (maxInches !== null && profileInches > maxInches) return false;

        return true;
    });
}

// Return filtered result set
return finalRows;

        } catch (error) {
        console.error("❌ Error searching profiles in advanced search model:", error);
        throw error; // Re-throw the error for the controller to handle
    }
};

module.exports = { searchProfiles }; // Export the function
