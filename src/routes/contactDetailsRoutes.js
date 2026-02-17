//
const express = require("express");
const {
  getContactDetails,
  shareContactDetails,
  sendEmailReport
} = require("../controllers/contactDetailsController");

const { authenticate } = require("../middleware/authMiddleware");
const requireApprovedProfile = require("../middleware/requireApprovedProfile");

const router = express.Router();

// Contact details routes (blocked until APPROVED)
router.post(
  "/share-contact-details",
  authenticate,
  requireApprovedProfile,
  shareContactDetails
);

router.get(
  "/contact-details/:profileId",
  authenticate,
  requireApprovedProfile,
  getContactDetails
);

// For future email functionality (keep protected to avoid misuse in production)
router.post(
  "/send-email",
  authenticate,
  requireApprovedProfile,
  sendEmailReport
);

module.exports = router;
