// src/routes/nativePlaceRoutes.js
const express = require("express");
const router = express.Router();
const { getNativePlaces } = require("../controllers/nativePlaceController");

// Route to get list of native places
router.get("/native-places", getNativePlaces);

module.exports = router;
