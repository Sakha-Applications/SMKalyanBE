const express = require("express");
const { searchProfiles } = require("../controllers/profilesearchController");

const router = express.Router();

// Profile search route (GET method for testing in browser)
router.get("/searchProfiles", searchProfiles);

// Add this route to handle POST requests
router.post("/searchProfiles", searchProfiles);

module.exports = router;
