//backend/src/models/ProfileSearchModel.js
const pool = require("../config/db"); //



const searchProfiles = async (profileFor, minAge, maxAge, gotra) => {
    try {
        let query = `SELECT * FROM profile WHERE 1=1`;
        let values = [];

        if (profileFor) {
            query += ` AND profile_for = ?`;
            values.push(`${profileFor}`);
        }

        if (minAge && maxAge) {
            query += ` AND current_age BETWEEN ? AND ?`;
            values.push(parseInt(minAge), parseInt(maxAge));
        }

        if (gotra) {
            query += ` AND gotra != ?`;
            values.push(gotra);
        }

        query += " ORDER BY current_age ASC"; // Sorting by age (optional)

        console.log("Executing query:", query, "with values:", values);
        const [rows] = await pool.execute(query, values); // Use pool.execute for MySQL
        return rows;
    } catch (error) {
        console.error("❌ Error searching profiles in model:", error);
        throw error; // Re-throw the error for the controller to handle
    }
};

module.exports = { searchProfiles };