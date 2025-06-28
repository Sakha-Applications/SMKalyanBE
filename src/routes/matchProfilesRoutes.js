// src/backend/routes/matchProfilesRoutes.js

const express = require("express");
const router = express.Router();

const { getMatchingProfilesHandler } = require("../controllers/MatchProfileController");
const { authenticate } = require("../middleware/authMiddleware");

console.log("✅ matchProfilesRoutes.js loaded");

// FIXED: Remove the /api prefix since it's already added in app.js
router.post("/matchProfiles", authenticate, getMatchingProfilesHandler);

module.exports = router;