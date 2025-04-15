const express = require("express");
const { getRashis } = require("../controllers/rashiController");

const router = express.Router();

// Route to fetch all Gotras
router.get("/rashis", getRashis);

module.exports = router;
