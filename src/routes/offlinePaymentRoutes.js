// routes/offlinePaymentRoutes.js
const express = require("express");
const { 
    submitOfflinePayment, 
    getUserOfflinePayments, 
    updateOfflinePaymentStatus 
} = require("../controllers/offlinePaymentController");
const requireAuth = require("../middleware/requireAuth");
const isAdmin = require("../middleware/isAdmin"); // Assuming you have admin middleware

const router = express.Router();

// Routes for user
router.post("/offline-payment/submit", requireAuth, submitOfflinePayment);
router.get("/offline-payment/history", requireAuth, getUserOfflinePayments);

// Routes for admin
router.put("/offline-payment/update-status", requireAuth, isAdmin, updateOfflinePaymentStatus);

module.exports = router;