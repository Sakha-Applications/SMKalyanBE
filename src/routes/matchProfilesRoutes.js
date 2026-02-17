// src/backend/routes/matchProfilesRoutes.js
const express = require("express");
const router = express.Router();

const { getMatchingProfilesHandler } = require("../controllers/MatchProfileController");
const { authenticate } = require("../middleware/authMiddleware");
const requireApprovedProfile = require("../middleware/requireApprovedProfile");

console.log("✅ matchProfilesRoutes.js loaded");

// Only APPROVED users can access matches
router.post("/matchProfiles", authenticate, requireApprovedProfile, getMatchingProfilesHandler);

module.exports = router;
