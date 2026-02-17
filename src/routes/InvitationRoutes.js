// src/backend/routes/InvitationRoutes.js

const express = require("express");
const router = express.Router();

const invitationController = require("../controllers/InvitationController");
const { authenticate } = require("../middleware/authMiddleware");
const requireApprovedProfile = require("../middleware/requireApprovedProfile"); // ✅ NEW

console.log("✅ InvitationRoutes.js loaded");

// POST route to send an invitation
router.post(
  "/invitations/send",
  authenticate,
  requireApprovedProfile, // ✅ NEW: block unless APPROVED
  invitationController.sendInvitationHandler
);

// GET route to retrieve invitations received by the logged-in user
router.get(
  "/invitations/received",
  authenticate,
  requireApprovedProfile, // ✅ NEW
  invitationController.getReceivedInvitationsHandler
);

// GET route to retrieve invitations sent by the logged-in user
router.get(
  "/invitations/sent",
  authenticate,
  requireApprovedProfile, // ✅ NEW
  invitationController.getSentInvitationsHandler
);

module.exports = router;
