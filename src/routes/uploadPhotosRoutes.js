// D:\1. Data\1. Personal DOcument\00.SM\NewProject\dev\SMKalyanBE\src\routes\uploadPhotosRoutes.js

const express = require("express");
const router = express.Router();
// --- MODIFY THIS LINE ---
const { uploadPhotos, getPhotos, getDefaultPhoto, deletePhoto } = require("../controllers/uploadPhotosController"); // Import deletePhoto
// -----------------------
const fileUpload = require("express-fileupload");

router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
}, (err) => {
    if (err) {
        console.error("Debug (Routes): Error setting up file upload middleware:", err);
    } else {
        console.log("Debug (Routes): File upload middleware initialized successfully.");
    }
}));

router.post("/upload-photos", (req, res, next) => {
    console.log("Debug (Routes): Incoming request to /upload-photos");
    console.log("Debug (Routes): Request body:", req.body);
    console.log("Debug (Routes): Request files:", req.files);
    next();
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

// --- ADD THIS NEW ROUTE FOR PHOTO DELETION ---
router.delete("/delete-photo", (req, res, next) => {
    console.log("Debug (Routes): Incoming request to /delete-photo");
    console.log("Debug (Routes): Query parameters:", req.query); // Log incoming query params
    next();
}, deletePhoto);
// ---------------------------------------------

module.exports = router;