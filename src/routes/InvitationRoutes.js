// src/backend/routes/InvitationRoutes.js

const express = require("express");
const router = express.Router();

// Import the new InvitationController and the authentication middleware
const invitationController = require("../controllers/InvitationController");
const { authenticate } = require("../middleware/authMiddleware");

console.log("✅ InvitationRoutes.js loaded");

// Define routes for invitation-related actions
// POST route to send an invitation
router.post("/invitations/send", authenticate, invitationController.sendInvitationHandler);

// GET route to retrieve invitations received by the logged-in user
router.get("/invitations/received", authenticate, invitationController.getReceivedInvitationsHandler);

// NEW: GET route to retrieve invitations sent by the logged-in user
router.get("/invitations/sent", authenticate, invitationController.getSentInvitationsHandler); // <--- ADD THIS LINE

module.exports = router;