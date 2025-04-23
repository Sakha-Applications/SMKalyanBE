    // src/routes/contactDetailsRoutes.js
    const express = require("express");
    const { getContactDetails, sendEmailReport } = require("../controllers/contactDetailsController");

    const router = express.Router();

    // Contact details routes
    router.post("/contact-details", getContactDetails);
    router.post("/send-email", sendEmailReport); // For future email functionality

    module.exports = router;