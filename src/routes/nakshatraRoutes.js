const express = require("express");
const router = express.Router();
const { getNakshatras } = require("../controllers/nakshatraController");

// Route to fetch all Gotras
router.get("/nakshatras", getNakshatras);

module.exports = router;
