const express = require("express");

const {
  getDiscoveryCount,
  getDiscoveryProfiles,
  getDiscoverySummary,
} = require("../controllers/dashboardDiscoveryController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const requireApprovedProfile = require("../middleware/requireApprovedProfile");

const router = express.Router();

router.get(
  "/dashboard/discovery-summary",
  authenticate,
  requireApprovedProfile,
  getDiscoverySummary
);

router.get(
  "/dashboard/discovery/:type",
  authenticate,
  requireApprovedProfile,
  getDiscoveryCount
);

router.get(
  "/dashboard/discovery/:type/profiles",
  authenticate,
  requireApprovedProfile,
  getDiscoveryProfiles
);

module.exports = router;