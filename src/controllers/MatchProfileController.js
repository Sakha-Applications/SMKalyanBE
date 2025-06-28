// src/backend/controllers/MatchProfileController.js

const MatchProfileModel = require("../models/MatchProfileModel");
const modifyProfileModel = require("../models/modifyProfileModel");

console.log("✅ MatchProfileController.js loaded");

// Helper function to parse array/JSON string fields
const parseToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Smart splitting: handles parentheses with commas inside
      // This regex splits by commas not inside parentheses
      return value.match(/[^,]+(?:\([^)]*\))?/g).map(s => s.trim());
    }
  }

  return [];
};

// NEW HELPER FUNCTION: To extract just the city name from a full location string
const extractCityName = (fullLocationString) => {
    if (!fullLocationString || typeof fullLocationString !== 'string') {
        return null; // Return null for invalid inputs
    }
    const parts = fullLocationString.split('/').map(s => s.trim());
    // The city name should be the last part of the 'Country / State / City' format
    return parts[parts.length - 1];
};


/**
 * Handles the request to find profiles matching the logged-in user's preferences.
 */
const getMatchingProfilesHandler = async (req, res) => {
    console.log("🔍 getMatchingProfilesHandler function is being called");
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);
    
    try {
        // Get profileId from authenticated user
      const loggedInUserProfileId = req.user?.profile_id;

        if (!loggedInUserProfileId) {
            console.log('❌ Logged-in profile ID not available in authentication context.');
            return res.status(400).json({ 
                error: 'Logged-in profile ID not available. Authentication issue., Authentication failed: Profile ID not found in token.',
                userInfo: req.user 
            });
        }

        console.log("🔍 Looking for profile ID:", loggedInUserProfileId);

        // Fetch the logged-in user's complete profile and partner preferences
        // This 'modifyProfileModel.getProfileById' fetches data from the DB,
        // where preferred_cities and preferred_native_origins are stored as JSON strings
        // of arrays containing full hierarchical strings (e.g., "India / Karnataka / Bengaluru").
        const userProfileData = await modifyProfileModel.getProfileById(loggedInUserProfileId);
        if (!userProfileData) {
            console.log('❌ Partner preferences not found for profile ID:', loggedInUserProfileId);
            return res.status(404).json({ 
                error: 'Partner preferences not found for the logged-in user.',
                profileId: loggedInUserProfileId 
            });
        }

        console.log("🟢 Fetched userProfileData for matching:", JSON.stringify(userProfileData, null, 2));

        // Prepare parameters for the MatchProfileModel
        const preferredCriteria = {
            preferredMaritalStatus: userProfileData.preferred_marital_status || null,
            preferredProfileFor: userProfileData.profile_for || null,
            preferredManglikStatus: userProfileData.preferred_manglik_status || null,
            preferredDiet: userProfileData.preferred_diet || null,

            preferredMotherTongues: parseToArray(userProfileData.preferred_mother_tongues),
            preferredSubCastes: parseToArray(userProfileData.preferred_sub_castes),
            preferredGuruMathas: parseToArray(userProfileData.preferred_guru_mathas),
            preferredNakshatras: parseToArray(userProfileData.preferred_nakshatras),
            preferredRashis: parseToArray(userProfileData.preferred_rashis),
            preferredEducation: parseToArray(userProfileData.preferred_education),
            preferredProfessions: parseToArray(userProfileData.preferred_professions),
            preferredHobbies: parseToArray(userProfileData.preferred_hobbies),
            preferredCountries: parseToArray(userProfileData.preferred_countries),
            preferredGotras: parseToArray(userProfileData.preferred_gotras),
        };

        // --- NEW LOGIC: Transform preferredCities and preferredNativeOrigins ---
        // Apply extractCityName to each element and filter out any null results
        preferredCriteria.preferredCities = parseToArray(userProfileData.preferred_cities)
                                                .map(extractCityName)
                                                .filter(city => city !== null && city !== ''); 

        preferredCriteria.preferredNativeOrigins = parseToArray(userProfileData.preferred_native_origins)
                                                      .map(extractCityName)
                                                      .filter(city => city !== null && city !== ''); 
        // --- END NEW LOGIC ---

        // User's own gotra for exclusion (from your previous snippet, kept for context if needed elsewhere)
        const userOwnGotra = userProfileData.gotra || null; 

        console.log("🔍 Searching with criteria:", preferredCriteria);
        console.log("🔍 Excluding gotra:", userOwnGotra);

        const matchedProfiles = await MatchProfileModel.findMatchingProfiles(
            preferredCriteria,
            loggedInUserProfileId
        );
        
        console.log(`✅ Found ${matchedProfiles.length} matches.`);

        // Send response
        res.status(200).json(matchedProfiles);

    } catch (error) {
        console.error("❌ Error in MatchProfileController:", error);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = { getMatchingProfilesHandler };