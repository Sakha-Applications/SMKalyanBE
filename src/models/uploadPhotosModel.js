// models/uploadPhotosModel.js
const pool = require("../config/db");

const savePhotoPath = async (profileId, email, photoPath, filename, isDefault) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (isDefault) {
      const updateQuery = "UPDATE profile_photos SET is_default = FALSE WHERE profile_id = ?";
      console.log("Debug (Model - Update Default): Executing SQL:", updateQuery, "with values:", [profileId]); // Log update query
      await connection.execute(updateQuery, [profileId]);
    }

    const insertQuery = `
      INSERT INTO profile_photos 
      (profile_id, email, photo_path, filename, url_path, is_default) 
      VALUES (?, ?, ?, ?, ?, ?)`;
    const insertValues = [profileId, email, photoPath, filename, photoPath, isDefault];
    
    console.log("Debug (Model - Insert): Executing SQL:", insertQuery, "with values:", insertValues); // Log insert query
    const [result] = await connection.execute(insertQuery, insertValues);
    console.log("Debug (Model - Insert): Insert result:", result); // Log insert result

    await connection.commit();
    return result.insertId;
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error (Model - Insert): Transaction rolled back due to error:", error.message); // Log rollback error
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const getPhotosByProfileId = async (profileId) => {
  const query = "SELECT photo_id, photo_path, filename, url_path, is_default FROM profile_photos WHERE profile_id = ?";
  console.log("Debug (Model - Get By Profile ID): Executing SQL:", query, "with values:", [profileId]); // Log get query
  const [rows] = await pool.execute(query, [profileId]);
  console.log("Debug (Model - Get By Profile ID): Result rows:", rows); // Log get result
  return rows;
};

const getPhotosByEmail = async (email) => {
  const query = "SELECT photo_id, photo_path, filename, url_path, is_default FROM profile_photos WHERE email = ?";
  console.log("Debug (Model - Get By Email): Executing SQL:", query, "with values:", [email]); // Log get query
  const [rows] = await pool.execute(query, [email]);
  console.log("Debug (Model - Get By Email): Result rows:", rows); // Log get result
  return rows;
};

const getDefaultPhoto = async (profileId) => {
  const query = "SELECT photo_id, photo_path, filename, url_path FROM profile_photos WHERE profile_id = ? AND is_default = TRUE";
  console.log("Debug (Model - Get Default Photo): Executing SQL:", query, "with values:", [profileId]); // Log get query
  const [rows] = await pool.execute(query, [profileId]);
  console.log("Debug (Model - Get Default Photo): Result row:", rows[0]); // Log get result (single row)
  return rows[0];
};

const getPhotoById = async (photoId) => {
  // Corrected the column name from 'id' to 'photo_id' for consistency with your schema
  const query = "SELECT photo_id, photo_path, filename FROM profile_photos WHERE photo_id = ?"; 
  console.log("Debug (Model - Get By Photo ID): Executing SQL:", query, "with values:", [photoId]); // Log get query
  const [rows] = await pool.execute(query, [photoId]);
  console.log("Debug (Model - Get By Photo ID): Result row:", rows[0]); // Log get result (single row)
  return rows[0];
};

const deletePhoto = async (photoId) => {
  // Corrected the column name from 'id' to 'photo_id' for consistency with your schema
  const query = "DELETE FROM profile_photos WHERE photo_id = ?"; 
  console.log("Debug (Model - Delete Photo): Executing SQL:", query, "with values:", [photoId]); // Log delete query
  const [result] = await pool.execute(query, [photoId]);
  console.log("Debug (Model - Delete Photo): Delete result:", result); // Log delete result
};

module.exports = {
  savePhotoPath,
  getPhotosByProfileId,
  getPhotosByEmail,
  getDefaultPhoto,
  getPhotoById,
  deletePhoto,
};