// src/models/guruMathaModel.js
const pool = require("../config/db");

// Fetch all GuruMatha options
const getGuruMathaList = async () => {
  try {
    const [rows] = await pool.query("SELECT id, GuruMathaName FROM tblGuruMatha ORDER BY GuruMathaName ASC");
    console.log("GuruMatha List fetched:", rows);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching GuruMatha list:", error);
    throw error;
  }
};

// Search GuruMatha by partial match
const searchGuruMatha = async (searchTerm) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, GuruMathaName FROM tblGuruMatha WHERE GuruMathaName LIKE ? ORDER BY GuruMathaName ASC LIMIT 10",
      [`${searchTerm}%`]
    );
    console.log(`GuruMatha options matching '${searchTerm}' fetched:`, rows);
    return rows;
  } catch (error) {
    console.error(`❌ Error searching GuruMatha with term '${searchTerm}':`, error);
    throw error;
  }
};

module.exports = { getGuruMathaList, searchGuruMatha };