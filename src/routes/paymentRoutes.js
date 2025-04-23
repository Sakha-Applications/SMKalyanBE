//routes/paymentRoutes.js
const express = require("express");
const { createRazorpayOrder, verifyPayment } = require("../controllers/paymentController");
const requireAuth = require("../middleware/requireAuth"); // Assuming you have an authentication middleware

const router = express.Router();

// Route to create a Razorpay order (requires authentication)
router.post("/razorpay/create-order", requireAuth, createRazorpayOrder);

// Route to verify the payment signature (requires authentication)
router.post("/razorpay/verify-payment", requireAuth, verifyPayment);

module.exports = router;