// backend/src/controllers/profilesearchController.js

const ProfileSearchModel = require("../models/ProfileSearchModel"); //

console.log("✅ ProfileSearchController.js loaded"); //

const searchProfiles = async (req, res) => {
    console.log("🔍 searchProfiles function is being called"); //
    try {
        // Extract all search parameters from the request body
        // These names must match the keys in your frontend's searchQuery state
        const {
            profileId,
            profileFor,
            minAge,
            maxAge,
            maritalStatus,
            motherTongue,
            gotra,
            subCaste,
            guruMatha,
            currentCityOfResidence, // This corresponds to current_location in DB
            income,
            traditionalValues   // This corresponds to family_values in DB
        } = req.body; // Changed from req.query to req.body

        // Pass all extracted parameters to the model function
        const profiles = await ProfileSearchModel.searchProfiles(
            profileId,
            profileFor,
            minAge,
            maxAge,
            maritalStatus,
            motherTongue,
            gotra,
            subCaste,
            guruMatha,
            currentCityOfResidence,
            income,
            traditionalValues
        );
        res.json(profiles);
    } catch (error) {
        console.error("❌ Error searching profiles in controller:", error); //
        res.status(500).json({ error: "Internal Server Error" }); //
    }
};

module.exports = { searchProfiles }; //