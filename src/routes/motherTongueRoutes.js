// src/routes/motherTongueRoutes.js
const express = require("express");
const router = express.Router();
const { getMotherTongues } = require("../controllers/motherTongueController");

// Route to get list of mother tongues
router.get("/mother-tongues", getMotherTongues);

module.exports = router;