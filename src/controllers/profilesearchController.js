//backend/src/controllers/ProfileSearchController.js


const ProfileSearchModel = require("../models/ProfileSearchModel");

console.log("✅ ProfileSearchController.js loaded");

const searchProfiles = async (req, res) => {
    console.log("🔍 searchProfiles function is being called");
    try {
        const { profileFor, minAge, maxAge, gotra } = req.query;

        const profiles = await ProfileSearchModel.searchProfiles(profileFor, minAge, maxAge, gotra);
        res.json(profiles);
    } catch (error) {
        console.error("❌ Error searching profiles in controller:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { searchProfiles };
