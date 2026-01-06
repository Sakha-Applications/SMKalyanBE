// backend/src/controllers/advancedsearchController.js

const AdvancedSearchModel = require("../models/AdvancedSearchModel");

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
      subCaste,
      guruMatha,
      currentCityOfResidence,
      income,
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

      // ✅ NEW (from UI)
      myProfileId,
      myProfileFor: myProfileForFromBody,
    } = req.body || {};

    console.log("🧾 ADV SEARCH myProfileId(from body):", myProfileId || "(EMPTY)");
    console.log("🧾 ADV SEARCH myProfileFor(from body):", myProfileForFromBody || "(EMPTY)");

    // ✅ Determine applyOppositeByDefault based on UI selection
    const uiProfileFor = String(profileFor || "").trim();
    const applyOppositeByDefault = isBlank(uiProfileFor);

    console.log("🧾 ADV SEARCH profileFor(from UI):", uiProfileFor || "(EMPTY)");
    console.log("🧾 ADV SEARCH applyOppositeByDefault:", applyOppositeByDefault);

    // ✅ Resolve myProfileFor (server-side)
    let myProfileFor = String(myProfileForFromBody || "").trim();

    if (isBlank(myProfileFor) && !isBlank(myProfileId)) {
      console.log("⚠️ ADV SEARCH myProfileFor missing -> fetching from DB using myProfileId...");
      try {
        const dbProfileFor = await AdvancedSearchModel.getProfileForByProfileId(myProfileId);
        myProfileFor = String(dbProfileFor || "").trim();
        console.log("🧾 ADV SEARCH myProfileFor(from DB):", myProfileFor || "(EMPTY)");
      } catch (e) {
        console.log("❌ ADV SEARCH DB lookup failed:", e?.message || e);
      }
    }

    console.log("🧾 ADV SEARCH myProfileFor(final):", myProfileFor || "(EMPTY)");

    if (applyOppositeByDefault) {
      console.log("✅ ADV SEARCH default-opposite requested. Expect SQL: AND profile_for != myProfileFor");
    }

    const profiles = await AdvancedSearchModel.searchProfiles(
      profileId || "",
      uiProfileFor || "",
      minAge || "",
      maxAge || "",
      maritalStatus || "",
      motherTongue || "",
      gotra || "",
      subCaste || "",
      guruMatha || "",
      currentCityOfResidence || "",
      income || "",
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

      // ✅ NEW (end args)
      myProfileFor || "",
      applyOppositeByDefault
    );

    console.log(`✅ ADV SEARCH results count: ${profiles.length}`);
    res.json(profiles);
  } catch (error) {
    console.error("❌ Error in advanced search controller:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = { advancedSearchProfiles };
