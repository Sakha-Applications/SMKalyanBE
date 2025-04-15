// nakshatraController.js
const { getNakshatraList } = require("../models/nakshatraModel");

const getNakshatras = async (req, res) => {
  try {
    const result = await getNakshatraList();
    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching Nakshatra list:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getNakshatras,
};