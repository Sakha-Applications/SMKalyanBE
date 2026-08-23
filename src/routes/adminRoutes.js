// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const isAdmin = require("../middleware/isAdmin");
const isModeratorOrAdmin = require("../middleware/isModeratorOrAdmin");
const adminController = require("../controllers/adminController");

// Approve a profile (admin-only)
router.put(
  "/admin/profile/:profileId/approve",
  requireAuth,
  isModeratorOrAdmin,
  adminController.approveProfile
);

// List PAYMENT_SUBMITTED profiles (admin-only)
router.get(
  "/admin/profiles/payment-submitted",
  requireAuth,
  isModeratorOrAdmin,
  adminController.listPaymentSubmittedProfiles
);

// List PENDING offline payments (Registration Fee + Recharge) (admin-only)
router.get(
  "/admin/offline-payments/pending",
  requireAuth,
  isModeratorOrAdmin,
  adminController.listPendingOfflinePayments
);

// ✅ NEW: Admin Settings (Registration Fee, X views, Recharge Fee)
router.get(
  "/admin/settings",
  requireAuth,
  isAdmin,
  adminController.getAdminSettings
);

router.put(
  "/admin/settings",
  requireAuth,
  isAdmin,
  adminController.updateAdminSettings
);

// Admin stats (admin-only)
router.get(
  "/admin/stats",
  requireAuth,
  isAdmin,
  adminController.getAdminStats
);

module.exports = router;
