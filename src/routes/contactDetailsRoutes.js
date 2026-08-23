//
const express = require("express");
const {
  getContactDetails,
  shareContactDetails,
  sendEmailReport,
  listMyContactRequests,
  listContactRequests,
  reviewContactRequest
} = require("../controllers/contactDetailsController");

const { authenticate } = require("../middleware/authMiddleware");
const requireApprovedProfile = require("../middleware/requireApprovedProfile");
const isModeratorOrAdmin = require("../middleware/isModeratorOrAdmin");

const router = express.Router();

// Contact details routes (blocked until APPROVED)
router.get(
  "/contact-details/:profileId",
  authenticate,
  requireApprovedProfile,
  getContactDetails
);

router.post(
  "/share-contact-details",
  authenticate,
  requireApprovedProfile,
  shareContactDetails
);

router.get(
  "/contact-requests/my",
  authenticate,
  requireApprovedProfile,
  listMyContactRequests
);

// For future email functionality (keep protected to avoid misuse in production)
router.post(
  "/send-email",
  authenticate,
  requireApprovedProfile,
  sendEmailReport
);

// Moderator/Admin: contact request work queue
router.get(
  "/moderator/contact-requests",
  authenticate,
  isModeratorOrAdmin,
  listContactRequests
);

// Moderator/Admin: approve / reject / clarification
router.put(
  "/moderator/contact-requests/:requestId/review",
  authenticate,
  isModeratorOrAdmin,
  reviewContactRequest
);

module.exports = router;
