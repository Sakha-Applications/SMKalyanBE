const ProfileSearchModel = require("../models/ProfileSearchModel");

console.log("✅ profilesearchController.js loaded");

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

const searchProfiles = async (req, res) => {
  try {
    console.log("🔍 BASIC SEARCH: searchProfiles called");
    console.log("🧾 BASIC SEARCH RAW BODY:", req.body);

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
      currentLocationCountry,
      currentLocationState,

      // ✅ added from UI
      myProfileId,
      myProfileFor: myProfileForFromBody,
    } = req.body || {};

    // ---- Source tracing logs ----
    console.log("🧾 BASIC SEARCH myProfileId(from body):", myProfileId || "(EMPTY)");
    console.log("🧾 BASIC SEARCH myProfileFor(from body):", myProfileForFromBody || "(EMPTY)");

    let eligibilityContext = null;

if (!isBlank(myProfileId)) {
  console.log(
    "BASIC SEARCH loading candidate eligibility context for:",
    myProfileId
  );

  eligibilityContext =
    await ProfileSearchModel.getCandidateEligibilityContext(
      myProfileId
    );

  console.log(
    "BASIC SEARCH candidate eligibility context loaded:",
    eligibilityContext
  );
}

const myProfileFor =
  eligibilityContext?.loggedInProfileFor ||
  String(myProfileForFromBody || "").trim();

    const uiProfileFor = String(profileFor || "").trim();
    const applyOppositeByDefault = isBlank(uiProfileFor);

    console.log("🧾 BASIC SEARCH profileFor(from UI):", uiProfileFor || "(EMPTY)");
    console.log("🧾 BASIC SEARCH applyOppositeByDefault:", applyOppositeByDefault);

    if (applyOppositeByDefault) {
      console.log(
        "✅ BASIC SEARCH default-opposite requested. Expect SQL: AND profile_for != myProfileFor"
      );
    }

    const results = await ProfileSearchModel.searchProfiles(
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
      currentLocationCountry || "",
      currentLocationState || "",
myProfileFor || "",
applyOppositeByDefault,
eligibilityContext
);

    console.log(`✅ BASIC SEARCH results count: ${results.length}`);
    return res.status(200).json(results);
  } catch (error) {
    console.error("❌ BASIC SEARCH controller error:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = { searchProfiles };
