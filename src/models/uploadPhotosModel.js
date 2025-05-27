// models/uploadPhotosModel.js
const pool = require("../config/db");

const savePhotoPath = async (profileId, email, photoPath, filename, isDefault) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (isDefault) {
      await connection.execute(
        "UPDATE profile_photos SET is_default = FALSE WHERE profile_id = ?",
        [profileId]
      );
    }

    const query = `
      INSERT INTO profile_photos 
      (profile_id, email, photo_path, filename, url_path, is_default) 
      VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [profileId, email, photoPath, filename, photoPath, isDefault];
    const [result] = await connection.execute(query, values);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const getPhotosByProfileId = async (profileId) => {
  const [rows] = await pool.execute(
    "SELECT photo_path, filename, url_path, is_default FROM profile_photos WHERE profile_id = ?",
    [profileId]
  );
  return rows;
};

const getPhotosByEmail = async (email) => {
  const [rows] = await pool.execute(
    "SELECT photo_path, filename, url_path, is_default FROM profile_photos WHERE email = ?",
    [email]
  );
  return rows;
};

const getDefaultPhoto = async (profileId) => {
  const [rows] = await pool.execute(
    "SELECT photo_path, filename, url_path FROM profile_photos WHERE profile_id = ? AND is_default = TRUE",
    [profileId]
  );
  return rows[0];
};

const getPhotoById = async (photoId) => {
  const [rows] = await pool.execute(
    "SELECT photo_path, filename FROM profile_photos WHERE id = ?",
    [photoId]
  );
  return rows[0];
};

const deletePhoto = async (photoId) => {
  await pool.execute("DELETE FROM profile_photos WHERE id = ?", [photoId]);
};

module.exports = {
  savePhotoPath,
  getPhotosByProfileId,
  getPhotosByEmail,
  getDefaultPhoto,
  getPhotoById,
  deletePhoto,
};
