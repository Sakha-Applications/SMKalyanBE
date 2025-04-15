// backend/routes/forgotPasswordRoutes.js
const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPasswordController'); // Updated import

console.log('Forgot Password routes file loaded');

router.post('/forgot-password', forgotPasswordController.forgotPassword);

console.log('Forgot Password routes defined:', router.stack.map(r => r.route?.path).filter(Boolean));

module.exports = router;