// backend/src/routes/advancedsearchRoutes.js
const express = require("express");
const { advancedSearchProfiles } = require("../controllers/advancedsearchController"); // Using the new controller

const router = express.Router();

// Define the POST route for advanced profile search
// This endpoint will be hit by the frontend's AdvancedSearchForm
router.post("/advancedSearchProfiles", advancedSearchProfiles);

// A GET route is included for testing purposes, mimicking the original,
// but the frontend will use POST.
router.get("/advancedSearchProfiles", advancedSearchProfiles);

module.exports = router;
