// src/routes/designationRoutes.js
const express = require("express");
const router = express.Router();
const { getDesignation } = require("../controllers/designationController");

// Route to get list of designation options
router.get("/designation", getDesignation);

module.exports = router;