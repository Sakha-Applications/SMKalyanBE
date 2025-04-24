const educationModel = require('../models/educationModel'); // Adjust the path if needed

const getEducations = async (req, res) => {
    try {
        const searchText = req.query.search || '';
        const educations = await educationModel.getEducations(searchText);
        res.json(educations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch educations' });
    }
};

module.exports = {
    getEducations,
};
