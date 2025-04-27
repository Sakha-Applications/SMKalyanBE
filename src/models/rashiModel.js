const pool = require("../config/db");

const getRashiList = async () => {
  console.log("🔍 Fetching Rashi List...");
  try {
    pool.connect();
    const [rows] = await pool.query("SELECT * FROM tblRashi ORDER BY RashiName ASC");
    console.log("✅ Query Success! Data:", rows); // ✅ Corrected
    return rows;
  } catch (err) {
    console.error("❌ Database Query Failed:", err);
    throw err;
  }
};

module.exports = { getRashiList };
