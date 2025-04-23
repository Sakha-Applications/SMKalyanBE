// src/models/motherTongueModel.js
const pool = require("../config/db");

// Fetch all Mother Tongues
const getMotherTongueList = async () => {
  try {
    const [rows] = await pool.query("SELECT id, mother_tongue FROM mother_tongues ORDER BY mother_tongue ASC");
    console.log("Mother Tongue List fetched:", rows);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching Mother Tongue list:", error);
    throw error;
  }
};

// Search Mother Tongues by partial match
const searchMotherTongues = async (searchTerm) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, mother_tongue FROM mother_tongues WHERE mother_tongue LIKE ? ORDER BY mother_tongue ASC LIMIT 10",
      [`${searchTerm}%`]
    );
    console.log(`Mother Tongues matching '${searchTerm}' fetched:`, rows);
    return rows;
  } catch (error) {
    console.error(`❌ Error searching Mother Tongues with term '${searchTerm}':`, error);
    throw error;
  }
};

module.exports = { getMotherTongueList, searchMotherTongues };