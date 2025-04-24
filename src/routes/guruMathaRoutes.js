// src/routes/guruMathaRoutes.js
const express = require("express");
const router = express.Router();
const { getGuruMatha } = require("../controllers/guruMathaController");

// Route to get list of guru matha options
router.get("/guru-matha", getGuruMatha);

module.exports = router;