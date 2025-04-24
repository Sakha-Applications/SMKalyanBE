const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController'); // Adjust the path if needed

router.get('/education', educationController.getEducations);

module.exports = router;