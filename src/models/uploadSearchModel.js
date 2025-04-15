const pool = require("../config/db");
console.log("✅ uploadSearchModel.js loaded");

const findProfilesForUpload = async (searchCriteria) => {
    let query = `SELECT id, name, current_age, gotra FROM profile WHERE 1=1`;
    const values = [];
    const { profileId, email, phone } = searchCriteria; // Extract properties from the input object

    if (profileId) {
        query += ` AND id = ?`;
        values.push(profileId);
    }

    if (email) {
        query += ` AND email = ?`;
        values.push(email);
    }

    if (phone) {
        query += ` AND phone_number = ?`;
        values.push(phone);
    }

    if (values.length === 0) {
        return []; // If no search criteria provided, return empty array
    }
    // REMOVED THE INCORRECT CONSOLE.LOG HERE
    // console.log("🔍🔍🔍 searchProfilesForUpload function is being called with body:", req.body);

    try {
        const [rows] = await pool.execute(query, values);
        return rows;
    } catch (error) {
        console.error("Error searching profiles in MySQL:", error);
        throw error;
    }
};

module.exports = { findProfilesForUpload };