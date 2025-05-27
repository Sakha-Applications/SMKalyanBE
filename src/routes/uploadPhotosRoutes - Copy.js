//**2.3 Routes (`uploadPhotosRoutes.js`)**
const express = require("express");
const router = express.Router();
const { uploadPhotos, getPhotos, getDefaultPhoto } = require("../controllers/uploadPhotosController");
const fileUpload = require("express-fileupload");

router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
}, (err) => { // Debug: Log any error during file upload middleware setup
    if (err) {
        console.error("Debug (Routes): Error setting up file upload middleware:", err);
    } else {
        console.log("Debug (Routes): File upload middleware initialized successfully.");
    }
}));

// Add debug logs here
router.post("/upload-photos", (req, res, next) => {
    console.log("Debug (Routes): Incoming request to /upload-photos");
    console.log("Debug (Routes): Request body:", req.body);
    console.log("Debug (Routes): Request files:", req.files);
    next(); // Pass control to the next handler (uploadPhotos)
}, uploadPhotos);

router.get("/get-photos", (req, res, next) => {
    console.log("Debug (Routes): Incoming request to /get-photos");
    console.log("Debug (Routes): Query parameters:", req.query);
    next();
}, getPhotos);

router.get("/get-default-photo", (req, res, next) => {
    console.log("Debug (Routes): Incoming request to /get-default-photo");
    console.log("Debug (Routes): Query parameters:", req.query);
    next();
}, getDefaultPhoto);

module.exports = router;