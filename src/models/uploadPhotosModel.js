//**2.1 Model (`uploadPhotosModel.js`)**
const pool = require("../config/db"); // Adjust the path to your database connection pool

const savePhotoPath = async (profileId, email, photoPath, filename, isDefault) => {
    try {
        // Start a transaction to ensure data consistency
        await pool.beginTransaction();

        // If this is the default photo, set any existing default photo to false
        if (isDefault) {
            const updateDefaultQuery = "UPDATE profile_photos SET is_default = FALSE WHERE profile_id = ?";
            await pool.execute(updateDefaultQuery, [profileId]);
        }

        const query = "INSERT INTO profile_photos (profile_id, email, photo_path, filename, is_default) VALUES (?, ?, ?, ?, ?)";
        const values = [profileId, email, photoPath, filename, isDefault];
        const [result] = await pool.execute(query, values);
        const insertId = result.insertId;

         // Commit the transaction
        await pool.commit();
        return insertId;
    } catch (error) {
        // Rollback the transaction in case of an error
        await pool.rollback();
        console.error("Error saving photo path:", error);
        throw error;
    }
};

const getPhotosByProfileId = async (profileId) => {
    try {
        const query = "SELECT photo_path, filename, is_default FROM profile_photos WHERE profile_id = ?";
        const [rows] = await pool.execute(query, [profileId]);
        return rows;
    } catch (error) {
        console.error("Error retrieving photos:", error);
        throw error;
    }
};

const getPhotosByEmail = async (email) => {
  try {
      const query = "SELECT photo_path, filename, is_default FROM profile_photos WHERE email = ?";
      const [rows] = await pool.execute(query, [email]);
      return rows;
  } catch (error) {
      console.error("Error retrieving photos by email:", error);
      throw error;
  }
};

const getDefaultPhoto = async (profileId) => {
    try {
        const query = "SELECT photo_path, filename FROM profile_photos WHERE profile_id = ? AND is_default = TRUE";
        const [rows] = await pool.execute(query, [profileId]);
        return rows[0]; // Returns the first row, or undefined if no default
    } catch (error) {
        console.error("Error retrieving default photo:", error);
        throw error;
    }
};

module.exports = { savePhotoPath, getPhotosByProfileId, getPhotosByEmail, getDefaultPhoto };
