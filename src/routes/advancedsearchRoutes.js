// backend/src/routes/advancedsearchRoutes.js
const express = require("express");
const { advancedSearchProfiles } = require("../controllers/advancedsearchController");
const { authenticate } = require("../middleware/authMiddleware");
const requireApprovedProfile = require("../middleware/requireApprovedProfile");

const router = express.Router();

// Lock advanced search for non-approved users
router.post("/advancedSearchProfiles", authenticate, requireApprovedProfile, advancedSearchProfiles);
router.get("/advancedSearchProfiles", authenticate, requireApprovedProfile, advancedSearchProfiles);

module.exports = router;
