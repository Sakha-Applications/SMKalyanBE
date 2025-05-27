const pool = require("../config/db"); // Adjust the path to your database connection pool
console.log("Debug (Model): Imported pool object:", pool);

const savePhotoPath = async (profileId, email, photoPath, filename, isDefault) => {
    let connection;
    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction

        // If this is the default photo, set any existing default photo to false
        if (isDefault) {
            const updateDefaultQuery = "UPDATE profile_photos SET is_default = FALSE WHERE profile_id = ?";
            await connection.execute(updateDefaultQuery, [profileId]);
        }

        // Construct relative URL path
        const urlPath = `/profilePhotos/${filename}`;

        const query = `
            INSERT INTO profile_photos 
            (profile_id, email, photo_path, filename, url_path, is_default) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        const values = [profileId, email, photoPath, filename, urlPath, isDefault];
        const [result] = await connection.execute(query, values);
        const insertId = result.insertId;

        await connection.commit(); // Commit the transaction
        return insertId;
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback the transaction in case of an error
        }
        console.error("Error saving photo path:", error);
        throw error;
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
};

const getPhotosByProfileId = async (profileId) => {
    try {
        const [rows] = await pool.execute(
            "SELECT photo_path, filename, url_path, is_default FROM profile_photos WHERE profile_id = ?",
            [profileId]
        );
        return rows;
    } catch (error) {
        console.error("Error retrieving photos:", error);
        throw error;
    }
};

const getPhotosByEmail = async (email) => {
    try {
        const [rows] = await pool.execute(
            "SELECT photo_path, filename, url_path, is_default FROM profile_photos WHERE email = ?",
            [email]
        );
        return rows;
    } catch (error) {
        console.error("Error retrieving photos by email:", error);
        throw error;
    }
};

const getDefaultPhoto = async (profileId) => {
    try {
        const [rows] = await pool.execute(
            "SELECT photo_path, filename, url_path FROM profile_photos WHERE profile_id = ? AND is_default = TRUE",
            [profileId]
        );
        return rows[0]; // Returns the first row, or undefined if no default
    } catch (error) {
        console.error("Error retrieving default photo:", error);
        throw error;
    }
};

module.exports = {
    savePhotoPath,
    getPhotosByProfileId,
    getPhotosByEmail,
    getDefaultPhoto,
};
