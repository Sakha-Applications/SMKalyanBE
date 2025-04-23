// src/models/nativePlaceModel.js
const pool = require("../config/db");

// Fetch all Native Places
const getNativePlaceList = async () => {
  try {
    const [rows] = await pool.query("SELECT id, nativeplace FROM tblnativeplace ORDER BY nativeplace ASC");
    console.log("Native Place List fetched:", rows);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching Native Place list:", error);
    throw error;
  }
};

// Search Native Places by partial match
const searchNativePlaces = async (searchTerm) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nativeplace FROM tblnativeplace WHERE nativeplace LIKE ? ORDER BY nativeplace ASC LIMIT 10",
      [`${searchTerm}%`]
    );
    console.log(`Native Places matching '${searchTerm}' fetched:`, rows);
    return rows;
  } catch (error) {
    console.error(`❌ Error searching Native Places with term '${searchTerm}':`, error);
    throw error;
  }
};

module.exports = { getNativePlaceList, searchNativePlaces };