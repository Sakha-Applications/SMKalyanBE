// src/routes/accountAvailabilityRoutes.js
const express = require('express');
const router = express.Router();
const { getAvailability } = require('../controllers/accountAvailabilityController');

// GET /api/account/availability?email=&phoneE164=&phoneCountryCode=&phoneNumber=
router.get('/account/availability', getAvailability);

module.exports = router;
