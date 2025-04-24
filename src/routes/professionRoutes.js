// src/routes/professionRoutes.js
const express = require("express");
const router = express.Router();
const { getProfession } = require("../controllers/professionController");

// Route to get list of profession options
router.get("/profession", getProfession);

module.exports = router;