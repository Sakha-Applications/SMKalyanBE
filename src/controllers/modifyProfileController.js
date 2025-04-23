// backend/controllers/modifyProfileController.js
const UserLogin = require('../models/userLoginModel');          // Adjust path if needed
const modifyProfileModel = require('../models/modifyProfileModel'); // Consistent import name

// This is the original function you had for updating profiles
const updateOwnProfile = async (req, res) => {
    const userEmail = req.user.userId; // Get user ID (email) from the authenticated request
    const profileData = req.body;

    console.log('🟢 Updating profile for user:', userEmail);
    console.log('🟢 Received profile data:', profileData);

    try {
        // 1. Find the user by email to get the associated profile ID
        const user = await UserLogin.findByUserId(userEmail);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profileId = user.profile_id; // Use the correct field name
        if (!profileId) {
            return res.status(400).json({ error: 'Profile ID not found for this user.' });
        }

        // 2. Update the profile data in the database
        const result = await modifyProfileModel.updateProfile(profileId, profileData); // Consistent module name
        console.log('🟢 Update result:', result);

        if (result && result.affectedRows > 0) {
            res.status(200).json({ message: 'Profile updated successfully', profileId });
        } else {
            res.status(400).json({ error: 'Failed to update profile. Profile may not exist, or no changes were made.' });
        }
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// This is the new function for getting profile data
const getOwnProfile = async (req, res) => {
    const userEmail = req.user.userId; // Get user ID (email) from the authenticated request

    console.log('🟢 Fetching profile for user:', userEmail);

    try {
        // 1. Find the user by email to get the associated profile ID
        const user = await UserLogin.findByUserId(userEmail);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profileId = user.profile_id;
        if (!profileId) {
            return res.status(400).json({ error: 'Profile ID not found for this user.' });
        }

        // 2. Get the profile data from the database
        const profile = await modifyProfileModel.getProfileById(profileId); // Consistent module name

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.status(200).json(profile);
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Export both functions
module.exports = { updateOwnProfile, getOwnProfile };