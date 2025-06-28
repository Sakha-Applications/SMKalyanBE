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

// NEW: Define the route handler function for fetching by ID
const getProfileByIdRouteHandler = (req, res) => { // <--- ADD THIS FUNCTION
  modifyProfileController.getProfileByIdHandler(req, res);
};

// Define the routes
router.put('/modifyProfile', authenticate, updateProfileRouteHandler);
router.get('/modifyProfile', authenticate, getProfileRouteHandler);

// NEW: Add this GET route for fetching profiles by ID
router.get('/modifyProfile/byId', authenticate, getProfileByIdRouteHandler); // <--- ADD THIS ROUTE

// Export the router
module.exports = router;