//**2.2 Controller (`uploadPhotosController.js`)**
const uploadPhotosModel = require("../models/uploadPhotosModel");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = "D:\\1. Data\\1. Personal DOcument\\Self Study\\NewGenApp\\SMKalyanUI\\ProfilePhotos";


const uploadPhotos = async (req, res) => {
    console.log("uploadPhotos controller function called");
    try {
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        
        if (!req.files || !req.files.photos) {
            return res.status(400).json({ error: "No photos were uploaded." });
        }

        const { profile_id, email } = req.body;
        if (!profile_id || !email) {
            return res.status(400).json({ error: "Profile ID and Email are required." });
        }

        let uploadedFiles = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];
        
        // Check if is_default is provided and is a valid boolean
        const isDefault = req.body.is_default === 'true';

        if (uploadedFiles.length > 5) {
            return res.status(400).json({ error: "Maximum 5 photos allowed." });
        }

        const savedPhotoPaths = [];
        
        // Use Promise.all to wait for all file operations to complete
        await Promise.all(uploadedFiles.map(file => {
            return new Promise((resolve, reject) => {
                const originalFilename = file.name;
                const uniqueFilename = `${profile_id}-${Date.now()}-${originalFilename}`;
                const filePath = path.join(UPLOAD_DIR, uniqueFilename);
                
                fs.rename(file.tempFilePath, filePath, async (err) => {
                    if (err) {
                        console.error("Error saving file:", err);
                        reject(err);
                        return;
                    }
                    
                    try {
                        const photoId = await uploadPhotosModel.savePhotoPath(
                            profile_id, 
                            email, 
                            filePath, 
                            uniqueFilename, 
                            isDefault
                        );
                        savedPhotoPaths.push({ photoId, filePath, originalFilename, isDefault });
                        resolve();
                    } catch (error) {
                        console.error("Error saving to database:", error);
                        reject(error);
                    }
                });
            });
        }));
        
        // Send response after all files have been processed
        res.json({ 
            message: "Photos uploaded successfully.", 
            photos: savedPhotoPaths 
        });
        
    } catch (error) {
        console.error("Error uploading photos:", error);
        res.status(500).json({ 
            error: "Failed to upload photos.", 
            details: error.message 
        });
    }
};

const getPhotos = async (req, res) => {
    try {
        const { profileId, email } = req.query;

        if (profileId) {
            const photos = await uploadPhotosModel.getPhotosByProfileId(profileId);
            res.json(photos);
        } else if (email) {
            const photos = await uploadPhotosModel.getPhotosByEmail(email);
            res.json(photos);
        } else {
            return res.status(400).json({ error: "Profile ID or Email is required" });
        }
    } catch (error) {
        console.error("Error getting photos:", error);
        res.status(500).json({ error: "Failed to retrieve photos.", details: error.message });
    }
};

const getDefaultPhoto = async (req, res) => {
    try {
        const { profileId } = req.query;
        if (!profileId) {
            return res.status(400).json({ error: "Profile ID is required." });
        }
        const defaultPhoto = await uploadPhotosModel.getDefaultPhoto(profileId);
        if (defaultPhoto) {
            res.json(defaultPhoto);
        } else {
            res.status(404).json({ message: "No default photo found for this profile." });
        }
    } catch (error) {
        console.error("Error getting default photo:", error);
        res.status(500).json({ error: "Failed to retrieve default photo.", details: error.message });
    }
};

module.exports = { uploadPhotos, getPhotos, getDefaultPhoto };
