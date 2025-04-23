    // src/routes/uploadSearchRoute.js
    const express = require("express");
    const { searchProfilesForUpload } = require("../controllers/uploadSearchController");

    const router = express.Router();
    console.log("➡️ Defining POST /api/search-by-upload route"); // Added log
    router.post("/search-by-upload", searchProfilesForUpload);

    module.exports = router;