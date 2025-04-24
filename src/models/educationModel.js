const pool = require("../config/db"); // Corrected import

const getEducations = async (search) => {
    let query = 'SELECT id, EducationName FROM tblEducation';
    const values = [];

    if (search) {
        query += ' WHERE EducationName LIKE ?';
        values.push(`%${search}%`);
    }
    query += ' ORDER BY EducationName ASC'; // Added ORDER BY clause
    try {
        const [rows] = await pool.query(query, values); // Use pool here
        return rows;
    } catch (error) {
        console.error('Error fetching educations:', error);
        throw error; // Re-throw the error to be caught by the controller
    }
};

module.exports = {
    getEducations,
};
