const express = require("express");
const { addProfile, getAllProfiles } = require("../controllers/profileController");

const router = express.Router();

// Profile routes
router.post("/addProfile", addProfile);
router.get("/profiles", getAllProfiles);

module.exports = router;
