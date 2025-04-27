const pool = require("../config/db"); // This should already be set up using mysql2/promise

// Fetch Gotra List
const getGotraList = async () => {
  try {
    const [rows] = await pool.query("SELECT * FROM userdb.tblGotra ORDER BY GotraName ASC");
    console.log("Gotra List fetched:", rows); // ✅ Debug log
    return rows;
  } catch (error) {
    console.error("❌ Error fetching Gotra list:", error);
    throw error;
  }
};

module.exports = { getGotraList };


