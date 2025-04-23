//**2.2 Controller (`uploadPhotosController.js`)**
const uploadPhotosModel = require("../models/uploadPhotosModel");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = "D:\\1. Data\\1. Personal DOcument\\Self Study\\NewGenApp\\SMKalyanUI\\ProfilePhotos";


const uploadPhotos = async (req, res) => {
    console.log("Debug (Controller): uploadPhotos controller function called");
    try {
        console.log('Debug (Controller): Request body:', req.body);
        console.log('Debug (Controller): Request files:', req.files);

        if (!req.files || !req.files.photos) {
            console.log("Debug (Controller): No photos were uploaded.");
            return res.status(400).json({ error: "No photos were uploaded." });
        }

        const { profile_id, email } = req.body;
        console.log('Debug (Controller): Extracted profile_id:', profile_id, 'and email:', email, 'from request body.');
        if (!profile_id || !email) {
            console.log("Debug (Controller): Profile ID or Email is missing in the request body.");
            return res.status(400).json({ error: "Profile ID and Email are required." });
        }

        let uploadedFiles = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];
        console.log('Debug (Controller): Number of uploaded files:', uploadedFiles.length);
        console.log('Debug (Controller): Uploaded files array:', uploadedFiles);

        // Check if is_default is provided and is a valid boolean
        const isDefault = req.body.is_default === 'true';
        console.log('Debug (Controller): is_default from request body:', req.body.is_default, 'interpreted as:', isDefault);

        if (uploadedFiles.length > 5) {
            console.log("Debug (Controller): More than 5 photos uploaded.");
            return res.status(400).json({ error: "Maximum 5 photos allowed." });
        }

        const savedPhotoPaths = [];
        console.log('Debug (Controller): Starting to process uploaded files.');

        // Use Promise.all to wait for all file operations to complete
        await Promise.all(uploadedFiles.map(file => {
            return new Promise(async (resolve, reject) => {
                const originalFilename = file.name;
                const uniqueFilename = `${profile_id}-${Date.now()}-${originalFilename}`;
                const filePath = path.join(UPLOAD_DIR, uniqueFilename);

                console.log('Debug (Controller): Processing file:', originalFilename);
                console.log('Debug (Controller): Temporary file path:', file.tempFilePath);
                console.log('Debug (Controller): New file path:', filePath);

                fs.rename(file.tempFilePath, filePath, async (err) => {
                    if (err) {
                        console.error("Debug (Controller): Error saving file:", err);
                        reject(err);
                        return;
                    }

                    console.log('Debug (Controller): File successfully moved to:', filePath);

                    try {
                        const photoId = await uploadPhotosModel.savePhotoPath(
                            profile_id,
                            email,
                            filePath,
                            uniqueFilename,
                            isDefault
                        );
                        savedPhotoPaths.push({ photoId, filePath, originalFilename, isDefault });
                        console.log('Debug (Controller): Photo details saved to database with ID:', photoId);
                        resolve();
                    } catch (error) {
                        console.error("Debug (Controller): Error saving to database:", error);
                        reject(error);
                    }
                });
            });
        }));

        // Send response after all files have been processed
        console.log('Debug (Controller): All files processed. Sending success response:', { message: "Photos uploaded successfully.", photos: savedPhotoPaths });
        res.json({
            message: "Photos uploaded successfully.",
            photos: savedPhotoPaths
        });

    } catch (error) {
        console.error("Debug (Controller): Error uploading photos:", error);
        res.status(500).json({
            error: "Failed to upload photos.",
            details: error.message
        });
    }
};

const getPhotos = async (req, res) => {
    console.log("Debug (Controller): getPhotos controller function called");
    try {
        const { profileId, email } = req.query;
        console.log('Debug (Controller): Query parameters:', { profileId, email });

        if (profileId) {
            console.log('Debug (Controller): Fetching photos by profile ID:', profileId);
            const photos = await uploadPhotosModel.getPhotosByProfileId(profileId);
            console.log('Debug (Controller): Photos found:', photos);
            res.json(photos);
        } else if (email) {
            console.log('Debug (Controller): Fetching photos by email:', email);
            const photos = await uploadPhotosModel.getPhotosByEmail(email);
            console.log('Debug (Controller): Photos found:', photos);
            res.json(photos);
        } else {
            console.log("Debug (Controller): Profile ID or Email is missing in the query.");
            return res.status(400).json({ error: "Profile ID or Email is required" });
        }
    } catch (error) {
        console.error("Debug (Controller): Error getting photos:", error);
        res.status(500).json({ error: "Failed to retrieve photos.", details: error.message });
    }
};

const getDefaultPhoto = async (req, res) => {
    console.log("Debug (Controller): getDefaultPhoto controller function called");
    try {
        const { profileId } = req.query;
        console.log('Debug (Controller): Query parameter profileId:', profileId);
        if (!profileId) {
            console.log("Debug (Controller): Profile ID is missing in the query.");
            return res.status(400).json({ error: "Profile ID is required." });
        }
        console.log('Debug (Controller): Fetching default photo for profile ID:', profileId);
        const defaultPhoto = await uploadPhotosModel.getDefaultPhoto(profileId);
        console.log('Debug (Controller): Default photo found:', defaultPhoto);
        if (defaultPhoto) {
            res.json(defaultPhoto);
        } else {
            console.log("Debug (Controller): No default photo found for profile ID:", profileId);
            res.status(404).json({ message: "No default photo found for this profile." });
        }
    } catch (error) {
        console.error("Debug (Controller): Error getting default photo:", error);
        res.status(500).json({ error: "Failed to retrieve default photo.", details: error.message });
    }
};

module.exports = { uploadPhotos, getPhotos, getDefaultPhoto };