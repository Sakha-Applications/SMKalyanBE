// controllers/uploadPhotosController.js
const uploadPhotosModel = require("../models/uploadPhotosModel");
const fs = require("fs");
const { uploadFileToAzureBlob, deleteFileFromAzureBlob, ensureContainerExists} = require("../services/azureBlobService"); // Corrected import path

const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || !req.files.photos) {
      return res.status(400).json({ error: "No photos were uploaded." });
    }

    const { profile_id, email } = req.body;
    const isDefault = req.body.is_default === 'true';

    if (!profile_id || !email) {
      return res.status(400).json({ error: "Profile ID and Email are required." });
    }

    let uploadedFiles = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];

    if (uploadedFiles.length > 5) {
      return res.status(400).json({ error: "Maximum 5 photos allowed." });
    }

    const savedPhotoPaths = [];

    // Ensure the container exists before attempting uploads
    await ensureContainerExists();

    await Promise.all(uploadedFiles.map((file, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          // Construct a more robust blobName to avoid potential conflicts and ensure uniqueness
          // Consider adding a timestamp or a UUID if multiple uploads per profile are frequent
          const blobName = `profile_${profile_id}_${Date.now()}_${index + 1}.jpg`; 
          const buffer = fs.readFileSync(file.tempFilePath);
          const azureUrl = await uploadFileToAzureBlob(blobName, buffer, file.mimetype);

          const photoId = await uploadPhotosModel.savePhotoPath( // Corrected function call
            profile_id,
            email,
            azureUrl, // full Azure blob URL
            blobName,
            isDefault && index === 0
          );

          savedPhotoPaths.push({
            photoId,
            url: azureUrl,
            filename: blobName,
            isDefault: isDefault && index === 0
          });
          resolve();
        } catch (err) {
          // Log the specific error during file processing/upload
          console.error(`Error processing file ${file.name}:`, err);
          reject(err);
        } finally {
          // Clean up temporary file regardless of success or failure
          if (file.tempFilePath) {
            fs.unlink(file.tempFilePath, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }
        }
      });
    }));

    res.json({ message: "Photos uploaded successfully.", photos: savedPhotoPaths });
  } catch (error) {
    console.error("Error uploading photos:", error);
    res.status(500).json({ error: "Failed to upload photos.", details: error.message });
  }
};

const getPhotos = async (req, res) => {
  try {
    const { profileId, email } = req.query;
    if (!profileId && !email) return res.status(400).json({ error: "Profile ID or Email is required" });

    const photos = profileId
      ? await uploadPhotosModel.getPhotosByProfileId(profileId)
      : await uploadPhotosModel.getPhotosByEmail(email);

    const processedPhotos = photos.map(photo => ({
      ...photo,
      url: photo.url_path || photo.photo_path
    }));

    res.json(processedPhotos);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve photos.", details: error.message });
  }
};

const getDefaultPhoto = async (req, res) => {
  try {
    const { profileId } = req.query;
    if (!profileId) return res.status(400).json({ error: "Profile ID is required." });

    const photo = await uploadPhotosModel.getDefaultPhoto(profileId);
    if (photo) {
      const url = photo.url_path || photo.photo_path;
      res.json({ ...photo, url });
    } else {
      res.status(404).json({ message: "No default photo found for this profile." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve default photo.", details: error.message });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.query;
    if (!photoId) return res.status(400).json({ error: "Photo ID is required." });

    const photo = await uploadPhotosModel.getPhotoById(photoId);
    if (!photo) return res.status(404).json({ error: "Photo not found." });

    // Use deleteFileFromAzureBlob from the service
    await deleteFileFromAzureBlob(photo.filename); 
    await uploadPhotosModel.deletePhoto(photoId);

    res.json({ message: "Photo deleted successfully." });
  } catch (error) {
    console.error("Error deleting photo:", error); // Added more specific logging
    res.status(500).json({ error: "Failed to delete photo.", details: error.message });
  }
};

module.exports = {
  uploadPhotos,
  getPhotos,
  getDefaultPhoto,
  deletePhoto
};