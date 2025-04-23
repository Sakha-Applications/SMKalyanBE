const express = require("express");
const { getContactDetails, shareContactDetails, sendEmailReport } = require("../controllers/contactDetailsController");
const { authenticate } = require('../middleware/authMiddleware'); // Import the authenticate middleware

const router = express.Router();

// Contact details routes
router.post("/contact-details", getContactDetails);
// Apply the authenticate middleware to the share-contact-details route
router.post("/share-contact-details", authenticate, shareContactDetails);
router.post("/send-email", sendEmailReport); // For future email functionality

module.exports = router;