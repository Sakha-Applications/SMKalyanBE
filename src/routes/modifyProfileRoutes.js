// backend/routes/modifyProfileRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller and middleware
const modifyProfileController = require('../controllers/modifyProfileController');
const { authenticate } = require('../middleware/authMiddleware');

console.log("🟢 modifyProfileRoutes.js loaded");

// Define the route handler functions
const updateProfileRouteHandler = (req, res) => {
  modifyProfileController.updateOwnProfile(req, res);
};

// Add this new function for GET requests
const getProfileRouteHandler = (req, res) => {
  modifyProfileController.getOwnProfile(req, res);
};

// Define the routes
router.put('/modifyProfile', authenticate, updateProfileRouteHandler);
router.get('/modifyProfile', authenticate, getProfileRouteHandler); // Add this GET route

// Export the router
module.exports = router;