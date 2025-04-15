// rashiController.js
const { getRashiList } = require("../models/rashiModel");

const getRashis = async (req, res) => {
  try {
    const result = await getRashiList();
    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching Rashi list:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getRashis,
};
