// src/controllers/uploadSearchController.js
const uploadSearchModel = require("../models/uploadSearchModel");
console.log("✅ uploadSearchController.js loaded");

const searchProfilesForUpload = async (req, res) => {
  console.log("🔍🔍🔍 searchProfilesForUpload function is being called with body:", req.body); // Added log
  console.log("🔍 searchProfilesForUpload function is being called");
  try {
    const { profileId, email, phone } = req.body;
    const results = await uploadSearchModel.findProfilesForUpload({ profileId, email, phone });
    console.log("Backend Controller: Search Results:", results); // Added log
    res.json(results);
    
  } catch (error) {
    console.error("❌ Error searching profiles for upload:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { searchProfilesForUpload };