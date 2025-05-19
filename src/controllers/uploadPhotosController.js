const uploadPhotosModel = require("../models/uploadPhotosModel");
const path = require("path");
const fs = require("fs");

// Define upload directory relative to the project root
// IMPORTANT: This should match the directory configured for static file serving in Express
const UPLOAD_DIR = path.join(__dirname, '../../../SMKalyanUI/profilePhotos');
console.log(`Upload directory configured as: ${UPLOAD_DIR}`);

// Log the absolute path for debugging
console.log(`Absolute path of upload directory: ${path.resolve(UPLOAD_DIR)}`);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created uploads directory at: ${UPLOAD_DIR}`);
}

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
                
                // IMPORTANT: This relative path must match how Express serves the files
                // If Express serves from '/profilePhotos', this should be '/profilePhotos/filename'
                const relativePath = `${uniqueFilename}`;

                console.log('Debug (Controller): Processing file:', originalFilename);
                console.log('Debug (Controller): Temporary file path:', file.tempFilePath);
                console.log('Debug (Controller): New file path:', filePath);
                console.log('Debug (Controller): Relative path for URL:', relativePath);

                fs.rename(file.tempFilePath, filePath, async (err) => {
                    if (err) {
                        console.error("Debug (Controller): Error saving file:", err);
                        reject(err);
                        return;
                    }

                    console.log('Debug (Controller): File successfully moved to:', filePath);

                    try {
                        // Store the file path and relative URL path in the database
                        const photoId = await uploadPhotosModel.savePhotoPath(
                            profile_id,
                            email,
                            filePath,  // Full path for system reference
                            relativePath,  // Relative path for URL construction
                            isDefault
                        );
                        
                        savedPhotoPaths.push({ 
                            photoId, 
                            filePath,      // Full path (not exposed to frontend)
                            relativePath,  // URL path for frontend access
                            originalFilename, 
                            isDefault 
                        });
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
        console.log('Debug (Controller): All files processed. Sending success response');
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
            
            // IMPORTANT: Ensure URL paths are consistent with static file serving config
            const processedPhotos = photos.map(photo => {
                // Extract just the filename
                const filename = path.basename(photo.photo_path);
                
                return {
                    ...photo,
                    // Use the stored URL path if available, otherwise construct it
                    url: photo.url_path || `/profilePhotos/${filename}`
                };
            });
            
            console.log('Debug (Controller): Photos found and processed:', processedPhotos);
            res.json(processedPhotos);
        } else if (email) {
            console.log('Debug (Controller): Fetching photos by email:', email);
            const photos = await uploadPhotosModel.getPhotosByEmail(email);
            
            // Process photos the same way
            const processedPhotos = photos.map(photo => {
                const filename = path.basename(photo.photo_path);
                return {
                    ...photo,
                    url: photo.url_path || `/profilePhotos/${filename}`
                };
            });
            
            console.log('Debug (Controller): Photos found and processed:', processedPhotos);
            res.json(processedPhotos);
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
        
        if (defaultPhoto) {
            // Process the default photo URL
            const filename = path.basename(defaultPhoto.photo_path);
            const processedPhoto = {
                ...defaultPhoto,
                url: defaultPhoto.url_path || `/profilePhotos/${filename}`,
                filename: filename
            };
            
            console.log('Debug (Controller): Default photo found and processed:', processedPhoto);
            res.json(processedPhoto);
        } else {
            console.log("Debug (Controller): No default photo found for profile ID:", profileId);
            res.status(404).json({ message: "No default photo found for this profile." });
        }
    } catch (error) {
        console.error("Debug (Controller): Error getting default photo:", error);
        res.status(500).json({ error: "Failed to retrieve default photo.", details: error.message });
    }
};

// Route to delete photos
const deletePhoto = async (req, res) => {
    console.log("Debug (Controller): deletePhoto controller function called");
    try {
        const { photoId } = req.query;
        
        if (!photoId) {
            console.log("Debug (Controller): Photo ID is missing in the query.");
            return res.status(400).json({ error: "Photo ID is required." });
        }
        
        // Get the photo details from the database
        const photo = await uploadPhotosModel.getPhotoById(photoId);
        
        if (!photo) {
            console.log("Debug (Controller): Photo not found for ID:", photoId);
            return res.status(404).json({ error: "Photo not found." });
        }
        
        // Delete the file from the filesystem
        fs.unlink(photo.photo_path, async (err) => {
            if (err) {
                console.error("Debug (Controller): Error deleting file:", err);
                return res.status(500).json({ error: "Failed to delete photo file.", details: err.message });
            }
            
            // Remove the record from the database
            await uploadPhotosModel.deletePhoto(photoId);
            
            console.log('Debug (Controller): Photo successfully deleted:', photoId);
            res.json({ message: "Photo deleted successfully." });
        });
    } catch (error) {
        console.error("Debug (Controller): Error deleting photo:", error);
        res.status(500).json({ error: "Failed to delete photo.", details: error.message });
    }
};

// Route to verify photo existence
const verifyPhoto = async (req, res) => {
    try {
        const { photoPath } = req.query;
        if (!photoPath) {
            return res.status(400).json({ error: "Photo path is required" });
        }
        
        // Extract filename from path
        const filename = path.basename(photoPath);
        const filePath = path.join(UPLOAD_DIR, filename);
        
        console.log('Debug (Controller): Verifying photo existence:', { 
            requestedPath: photoPath,
            filename: filename,
            filePath: filePath
        });
        
        // Check if file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.log('Debug (Controller): Photo does not exist:', filePath);
                return res.status(404).json({ 
                    exists: false, 
                    message: "Photo does not exist",
                    requestedPath: photoPath,
                    resolvedPath: filePath
                });
            }
            
            console.log('Debug (Controller): Photo exists:', filePath);
            return res.json({ 
                exists: true, 
                message: "Photo exists",
                url: `/profilePhotos/${filename}`
            });
        });
    } catch (error) {
        console.error("Debug (Controller): Error verifying photo:", error);
        res.status(500).json({ error: "Failed to verify photo", details: error.message });
    }
};

module.exports = { 
    uploadPhotos, 
    getPhotos, 
    getDefaultPhoto, 
    deletePhoto,
    verifyPhoto 
};