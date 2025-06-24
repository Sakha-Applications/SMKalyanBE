// backend/src/models/ProfileSearchModel.js
const pool = require("../config/db"); //

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
    traditionalValues
) => {
    try {
        let query = `SELECT * FROM profile WHERE 1=1`; // Base query
        let values = [];

        // Add conditions based on provided search parameters
        // Each condition is added only if the parameter has a value
        if (profileId) {
            // Case-insensitive search for profile_id, using LIKE for partial matches if needed
            query += ` AND profile_id LIKE ?`;
            values.push(`%${profileId}%`);
        }

        if (profileFor) {
            query += ` AND profile_for = ?`; //
            values.push(profileFor); //
        }

        if (minAge && maxAge) {
            // Ensure age is treated as a number
            query += ` AND current_age BETWEEN ? AND ?`; //
            values.push(parseInt(minAge), parseInt(maxAge)); //
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
            query += ` AND gotra != ?`; // Corrected from '!=' to '=' for positive match search
            values.push(gotra); //
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
            // Assuming current_location in DB stores the city name
            query += ` AND current_location = ?`;
            values.push(currentCityOfResidence);
        }

        if (income) {
            query += ` AND annual_income = ?`; // Exact match for income range string
            values.push(income);
        }

        if (traditionalValues) {
            query += ` AND family_values = ?`; // Exact match for traditional values string
            values.push(traditionalValues);
        }

        query += ` ORDER BY current_age ASC`; // Default sorting

        console.log("Executing query:", query, "with values:", values); //
        const [rows] = await pool.execute(query, values); // Use pool.execute for MySQL
        return rows;
    } catch (error) {
        console.error("❌ Error searching profiles in model:", error); //
        throw error; // Re-throw the error for the controller to handle
    }
};

module.exports = { searchProfiles }; //