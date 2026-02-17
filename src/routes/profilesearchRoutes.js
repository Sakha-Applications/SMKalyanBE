const express = require("express");
const { searchProfiles } = require("../controllers/profilesearchController");
const { authenticate } = require("../middleware/authMiddleware");
const requireApprovedProfile = require("../middleware/requireApprovedProfile");

const router = express.Router();

// Lock search for non-approved users
router.get("/searchProfiles", authenticate, requireApprovedProfile, searchProfiles);
router.post("/searchProfiles", authenticate, requireApprovedProfile, searchProfiles);

module.exports = router;
