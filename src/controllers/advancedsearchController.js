// backend/src/controllers/advancedsearchController.js

const AdvancedSearchModel = require("../models/AdvancedSearchModel"); // Using the new model

console.log("✅ AdvancedSearchController.js loaded"); // Log for debugging

const advancedSearchProfiles = async (req, res) => {
    console.log("🔍 advancedSearchProfiles function is being called with request body:", req.body); // Log the request body
    try {
        // Extract ALL search parameters from the request body.
        // These names MUST match the keys in your frontend's searchQuery state
        // in AdvancedSearchForm.jsx.
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
            currentCityOfResidence, // Corresponds to current_location in DB
            income,
            traditionalValues, // Corresponds to family_values in DB
            // --- Placeholders for NEW ADVANCED SEARCH FIELDS ---
            heightMin,
            heightMax,
            qualification,
            educationIn,
            workingWith,
            professionalArea,
            familyStatus,
            familyType,
            religiousValues,
            castingDetails,
            faithLiving,
            dailyRituals,
            observersRajamanta,
            observersChaturmasya
            // --- END of Placeholders ---
        } = req.body;

        // Pass ALL extracted parameters to the new model function.
        // Even if a field is empty/null from the frontend, it will be passed,
        // and the model will conditionally add it to the query.
        const profiles = await AdvancedSearchModel.searchProfiles(
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
            traditionalValues,
            // --- Pass NEW ADVANCED SEARCH FIELDS ---
            heightMin,
            heightMax,
            qualification,
            educationIn,
            workingWith,
            professionalArea,
            familyStatus,
            familyType,
            religiousValues,
            castingDetails,
            faithLiving,
            dailyRituals,
            observersRajamanta,
            observersChaturmasya
            // --- END NEW ADVANCED SEARCH FIELDS ---
        );
        res.json(profiles); // Send the search results back to the frontend
    } catch (error) {
        console.error("❌ Error searching profiles in advanced search controller:", error); // Log the specific error
        res.status(500).json({ error: "Internal Server Error" }); // Send a generic error response
    }
};

module.exports = { advancedSearchProfiles }; // Export the new function
