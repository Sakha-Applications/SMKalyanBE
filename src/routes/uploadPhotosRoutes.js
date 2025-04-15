//**2.3 Routes (`uploadPhotosRoutes.js`)**
const express = require("express");
const router = express.Router();
const { uploadPhotos, getPhotos, getDefaultPhoto } = require("../controllers/uploadPhotosController");
const fileUpload = require("express-fileupload");

router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
}));
 // Add debug logs here
 router.post("/upload-photos", (req, res, next) => {
    console.log("Incoming request to /upload-photos");
    next(); // Pass control to the next handler (uploadPhotos)
}, uploadPhotos);

router.get("/get-photos", (req, res, next) => {
    console.log("Incoming request to /get-photos");
    next();
}, getPhotos);

router.get("/get-default-photo", (req, res, next) => {
    console.log("Incoming request to /get-default-photo");
    next();
}, getDefaultPhoto);
module.exports = router;