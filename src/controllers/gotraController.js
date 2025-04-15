const { getGotraList } = require("../models/gotraModel");

// Controller to handle get request for gotras
const getGotras = async (req, res) => {
  try {
    const gotras = await getGotraList();
    res.status(200).json(gotras);
  } catch (error) {
    console.error("❌ Error in getGotras controller:", error.message);
    res.status(500).json({ error: "Failed to fetch Gotra list" });
  }
};

module.exports = { getGotras };
