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

    // 1) get myProfileFor from body if present
    let myProfileFor = String(myProfileForFromBody || "").trim();

    // 2) If missing, derive from DB using myProfileId (server-side enforced)
    if (isBlank(myProfileFor) && !isBlank(myProfileId)) {
      console.log("⚠️ BASIC SEARCH myProfileFor missing -> fetching from DB using myProfileId...");
      try {
        const dbProfileFor = await ProfileSearchModel.getProfileForByProfileId(myProfileId);
        myProfileFor = String(dbProfileFor || "").trim();
        console.log("🧾 BASIC SEARCH myProfileFor(from DB):", myProfileFor || "(EMPTY)");
      } catch (e) {
        console.log("❌ BASIC SEARCH DB lookup failed:", e?.message);
      }
    }

    console.log("🧾 BASIC SEARCH myProfileFor(final):", myProfileFor || "(EMPTY)");

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
      applyOppositeByDefault
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
