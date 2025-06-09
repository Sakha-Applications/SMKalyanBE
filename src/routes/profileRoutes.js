// In your routes file (e.g., profileRoutes.js)
const express = require('express');
const router = express.Router();
const { addProfile, getAllProfiles, getProfileByIdController } = require('../controllers/profileController');

// ✅ Make sure the route parameter is correctly defined
router.get('/profile/:id', getProfileByIdController);
router.post('/profile', addProfile);
router.get('/profiles', getAllProfiles);

module.exports = router;