// backend/src/controllers/profilesearchController.js

const ProfileSearchModel = require("../models/ProfileSearchModel"); //

console.log("✅ ProfileSearchController.js loaded"); //

const getOppositeProfileFor = (myProfileFor) => {
  if (!myProfileFor) return "";
  const v = String(myProfileFor).trim().toLowerCase();
  if (v === "bride") return "Bridegroom";
  if (v === "bridegroom") return "Bride";
  return "";
};

const isEmpty = (v) => v === null || v === undefined || String(v).trim() === "";

const searchProfiles = async (req, res) => {
  console.log("🔍 searchProfiles function is being called"); //
  console.log("🧾 BASIC SEARCH RAW BODY:", req.body);
  // ✅ Debug token/user context
    console.log("🧾 AUTH HEADER:", req.headers.authorization ? "PRESENT" : "MISSING");
    console.log("🧾 req.user:", req.user || "(EMPTY - auth middleware not attaching user)");

    // ✅ Get logged-in profileId from token middleware (preferred)
    const loggedInProfileId =
      req.user?.profileId ||
      req.user?.profile_id ||
      req.user?.profileIdFk ||
      req.body?.loggedInProfileId ||
      req.body?.profileIdLoggedIn ||
      "";

    console.log("🧾 loggedInProfileId (derived):", loggedInProfileId);
    // ✅ Fetch logged-in user's profile_for from DB (guaranteed)
    let myProfileFor = "";
    if (loggedInProfileId) {
      myProfileFor = await ProfileSearchModel.getProfileForByProfileId(loggedInProfileId);
    }

    console.log("🧾 BASIC SEARCH myProfileFor (from DB):", myProfileFor || "(EMPTY)");

    // ✅ Pass everything to model (including myProfileFor)
    const results = await ProfileSearchModel.searchProfiles({
      ...req.body,
      myProfileFor,
      loggedInProfileId,
    });

    
  try {
    // Extract all search parameters from the request body
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
      traditionalValues, // This corresponds to family_values in DB

      // Optional fallback if you don't have auth middleware yet
      loggedInProfileFor,
    } = req.body;

    // ✅ Default profileFor if not provided:
    // 1) Prefer req.user.profileFor (if auth middleware sets it)
    // 2) Fallback to req.body.loggedInProfileFor (temporary)
    let finalProfileFor = profileFor;

    if (isEmpty(finalProfileFor)) {
      const myProfileFor =
        req?.user?.profileFor ||
        req?.user?.profile_for ||
        loggedInProfileFor ||
        "";

      const opposite = getOppositeProfileFor(myProfileFor);
      if (!isEmpty(opposite)) finalProfileFor = opposite;
    }

    const myProfileFor =
  req?.user?.profileFor ||
  req?.user?.profile_for ||
  loggedInProfileFor ||
  "";

    // 🔎 DEBUG (TEMP): See what controller actually received
console.log("🧾 BASIC SEARCH RAW BODY:", req.body);
console.log("🧾 BASIC SEARCH myProfileFor:", myProfileFor);
console.log("🧾 BASIC SEARCH profileFor(from UI):", profileFor);

// Pass parameters to the model function (✅ correct order)
const profiles = await ProfileSearchModel.searchProfiles(
  profileId,
  myProfileFor,      // logged-in user's profile_for (used for profile_for != ? when UI didn't send profileFor)
  finalProfileFor,        // "Looking For" from UI (if empty => model should apply profile_for != myProfileFor)
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
    console.log(`✅ searchProfiles found ${profiles.length} profiles`); //
    res.json(profiles);
  } catch (error) {
    console.error("❌ Error searching profiles in controller:", error); //
    res.status(500).json({ error: "Internal Server Error" }); //
  }
};


module.exports = { searchProfiles }; //
