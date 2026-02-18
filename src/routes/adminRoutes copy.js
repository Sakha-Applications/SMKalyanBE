// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const isAdmin = require("../middleware/isAdmin");
const adminController = require("../controllers/adminController");

// Approve a profile (admin-only)
router.put("/admin/profile/:profileId/approve", requireAuth, isAdmin, adminController.approveProfile);

// ✅ List PAYMENT_SUBMITTED profiles
router.get("/admin/profiles/payment-submitted", requireAuth, isAdmin, adminController.listPaymentSubmittedProfiles);

// ✅ Admin stats
router.get("/admin/stats", requireAuth, isAdmin, adminController.getAdminStats);

module.exports = router;
