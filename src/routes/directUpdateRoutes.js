// backend/routes/directUpdateRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller
const directUpdateController = require('../controllers/directUpdateController');

console.log("🟢 directUpdateRoutes.js loaded");

// Define the route handler function
const updateProfileDirectRouteHandler = (req, res) => {
  directUpdateController.updateProfileDirect(req, res);
};

// Define the route - PUT /updateProfile/:profileId
// Note: No authentication middleware for direct updates during registration
router.put('/updateProfile/:profileId', updateProfileDirectRouteHandler);

// Export the router
module.exports = router;