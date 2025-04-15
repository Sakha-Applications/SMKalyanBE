const express = require("express");
const { createUserLogin } = require("../controllers/userLoginController");

const router = express.Router();

router.post("/userlogin", createUserLogin);

module.exports = router;