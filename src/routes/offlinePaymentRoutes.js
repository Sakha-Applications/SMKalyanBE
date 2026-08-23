// routes/offlinePaymentRoutes.js
const express = require("express");
const { 
    submitOfflinePayment, 
    getUserOfflinePayments, 
    updateOfflinePaymentStatus 
} = require("../controllers/offlinePaymentController");
const requireAuth = require("../middleware/requireAuth");
const isModeratorOrAdmin = require("../middleware/isModeratorOrAdmin");

const router = express.Router();

// Routes for user
router.post("/offline-payment/submit", requireAuth, submitOfflinePayment);
router.get("/offline-payment/history", requireAuth, getUserOfflinePayments);

// Routes for admin
router.put(
  "/offline-payment/update-status",
  requireAuth,
  isModeratorOrAdmin,
  updateOfflinePaymentStatus
);

module.exports = router;