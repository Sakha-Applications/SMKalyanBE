// backend/src/controllers/advancedsearchController.js

const AdvancedSearchModel = require("../models/AdvancedSearchModel");
const ProfileSearchModel = require("../models/ProfileSearchModel");

console.log("✅ AdvancedSearchController.js loaded");

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

const advancedSearchProfiles = async (req, res) => {
  console.log("🔍 advancedSearchProfiles called. RAW BODY:", req.body);

  try {
    const {
      profileId,
      profileFor,
      minAge,
      maxAge,
      maritalStatus,
      motherTongue,
      gotra,
      rashi,
      nakshatra,
      subCaste,
      guruMatha,
      currentCityOfResidence,
      currentLocationCountry,
      currentLocationState,
      income,
      education,
      profession,
      traditionalValues,

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
      observersChaturmasya,

      myProfileId,
    } = req.body || {};

    console.log(
      "🧾 ADV SEARCH myProfileId(from body):",
      myProfileId || "(EMPTY)"
    );

    const uiProfileFor =
      String(profileFor || "").trim();

    if (isBlank(myProfileId)) {
      return res.status(400).json({
        error:
          "Logged-in profile ID is required for search.",
      });
    }

    const eligibilityContext =
      await ProfileSearchModel
        .getCandidateEligibilityContext(
          myProfileId
        );

    console.log(
      "✅ ADV SEARCH candidate eligibility context loaded:",
      eligibilityContext
    );

    const profiles = await AdvancedSearchModel.searchProfiles(
      profileId || "",
      uiProfileFor || "",
      minAge || "",
      maxAge || "",
      maritalStatus || "",
      motherTongue || "",
      gotra || "",
      rashi || "",
      nakshatra || "",
      subCaste || "",
      guruMatha || "",
      currentCityOfResidence || "",
      currentLocationCountry || "",
      currentLocationState || "",
      income || "",
      education || "",
      profession || "",
      traditionalValues || "",

      heightMin || "",
      heightMax || "",
      qualification || "",
      educationIn || "",
      workingWith || "",
      professionalArea || "",
      familyStatus || "",
      familyType || "",
      religiousValues || "",
      castingDetails || "",
      faithLiving || "",
      dailyRituals || "",
      observersRajamanta || "",
      observersChaturmasya || "",

      eligibilityContext
    );

    console.log(`✅ ADV SEARCH results count: ${profiles.length}`);
    res.json(profiles);
  } catch (error) {
    console.error("❌ Error in advanced search controller:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = { advancedSearchProfiles };
