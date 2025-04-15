const pool = require("../config/db");

const getNakshatraList = async () => {
    console.log("🔍 Fetching Nakshatra List..."); // Debugging
    try {
        const [rows] = await pool.query("SELECT * FROM tblNakshatra ORDER BY NakshatraName ASC");
        console.log("✅ Query Success! Data:", rows);
        return rows;
        } catch (err) {
        console.error("❌ Database Query Failed:", err);
        throw err;
    }
};

module.exports = { getNakshatraList };


