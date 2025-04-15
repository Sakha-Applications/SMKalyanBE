const express = require("express");
const { getGotras } = require("../controllers/gotraController");

const router = express.Router();

// Route to fetch all Gotras
router.get("/gotras", getGotras);

module.exports = router;
