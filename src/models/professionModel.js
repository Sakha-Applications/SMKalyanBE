// src/models/professionModel.js
const pool = require("../config/db");

// Fetch all Profession options
const getProfessionList = async () => {
  try {
    const [rows] = await pool.query("SELECT id, ProfessionName FROM Profession ORDER BY ProfessionName ASC");
    console.log("Profession List fetched:", rows);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching Profession list:", error);
    throw error;
  }
};

// Search Profession by partial match
const searchProfession = async (searchTerm) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, ProfessionName FROM Profession WHERE ProfessionName LIKE ? ORDER BY ProfessionName ASC LIMIT 10",
      [`${searchTerm}%`]
    );
    console.log(`Profession options matching '${searchTerm}' fetched:`, rows);
    return rows;
  } catch (error) {
    console.error(`❌ Error searching Profession with term '${searchTerm}':`, error);
    throw error;
  }
};

module.exports = { getProfessionList, searchProfession };