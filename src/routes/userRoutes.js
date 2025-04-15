const express = require("express");
const { addUser, getAllUsers } = require("../controllers/userController");
const { addProfile, getAllProfiles } = require("../controllers/profileController");

const router = express.Router();
// User routes
router.post("/addUser", addUser);
router.get("/users", getAllUsers);

// Profile routes
router.post("/addProfile", addProfile);
router.get("/profiles", getAllProfiles);

module.exports = router;
