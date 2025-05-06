// backend/controllers/modifyProfileController.js
const UserLogin = require('../models/userLoginModel');          // Adjust path if needed
const modifyProfileModel = require('../models/modifyProfileModel'); // Consistent import name

// This is the modified function for updating profiles with field name mapping
const updateOwnProfile = async (req, res) => {
    const userEmail = req.user.userId; // Get user ID (email) from the authenticated request
    let profileData = req.body;

    console.log('🟢 Updating profile for user:', userEmail);
    console.log('🟢 Received raw profile data:', JSON.stringify(profileData, null, 2));

    // Process form data to handle objects with value properties
    Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && typeof profileData[key] === 'object') {
            if (profileData[key].value !== undefined) {
                console.log(`🟢 Converting object field ${key} from`, profileData[key], "to", profileData[key].value);
                profileData[key] = profileData[key].value;
            }
        }
    });

    // Map camelCase field names from frontend to snake_case for database
    const fieldMappings = {
        // Map frontend to backend field names
        fatherName: 'father_name',
        motherName: 'mother_name',
        fatherProfession: 'father_profession',
        motherProfession: 'mother_profession',
        guruMatha: 'guru_matha',
        timeOfBirth: 'time_of_birth',
        charanaPada: 'charana_pada',
        subCaste: 'sub_caste',
        // Fix missing field mappings
        alternatePhone: 'alternate_phone',
        communicationAddress: 'communication_address',
        residenceAddress: 'residence_address',
        // Add additional field mappings that were missing
        annualIncome: 'annual_income',
        currentCompany: 'current_company',
        currentAge: 'current_age',
        profileId: 'profile_id',
        workingStatus: 'working_status',
        heightFeet: 'height_feet',
        heightInches: 'height_inches'
    };

    // Create a new object with properly mapped field names
    const mappedProfileData = {};
    
    // Copy all existing fields
    Object.keys(profileData).forEach(key => {
        // If there's a mapping for this field, use the mapped name
        if (fieldMappings[key]) {
            mappedProfileData[fieldMappings[key]] = profileData[key];
            console.log(`🟢 Mapping field: ${key} -> ${fieldMappings[key]} with value:`, profileData[key]);
        } else {
            // Otherwise keep the original field name
            mappedProfileData[key] = profileData[key];
        }
    });

    console.log('🟢 Processed profile data:', JSON.stringify(mappedProfileData, null, 2));

    try {
        // 1. Find the user by email to get the associated profile ID
        const user = await UserLogin.findByUserId(userEmail);
        if (!user) {
            console.log('❌ User not found for email:', userEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        const profileId = user.profile_id; // Use the correct field name
        if (!profileId) {
            console.log('❌ Profile ID not found for user:', userEmail);
            return res.status(400).json({ error: 'Profile ID not found for this user.' });
        }

        console.log('🟢 Found profile ID for user:', profileId);

        // 2. Update the profile data in the database
        const result = await modifyProfileModel.updateProfile(profileId, mappedProfileData); // Use mapped data
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

// This is the function for getting profile data - with field name mapping for frontend
const getOwnProfile = async (req, res) => {
    const userEmail = req.user.userId; // Get user ID (email) from the authenticated request

    console.log('🟢 Fetching profile for user:', userEmail);

    try {
        // 1. Find the user by email to get the associated profile ID
        const user = await UserLogin.findByUserId(userEmail);
        if (!user) {
            console.log('❌ User not found for email:', userEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        const profileId = user.profile_id;
        if (!profileId) {
            console.log('❌ Profile ID not found for user:', userEmail);
            return res.status(400).json({ error: 'Profile ID not found for this user.' });
        }

        console.log('🟢 Found profile ID for user:', profileId);

        // 2. Get the profile data from the database
        const profile = await modifyProfileModel.getProfileById(profileId); // Consistent module name

        if (!profile) {
            console.log('❌ Profile not found for ID:', profileId);
            return res.status(404).json({ error: 'Profile not found' });
        }

        console.log('🟢 Retrieved profile data for ID:', profileId);
        
        // Map snake_case field names from database to camelCase for frontend
        const fieldMappings = {
            // Map backend to frontend field names
            father_name: 'fatherName',
            mother_name: 'motherName',
            father_profession: 'fatherProfession',
            mother_profession: 'motherProfession',
            guru_matha: 'guruMatha',
            time_of_birth: 'timeOfBirth',
            charana_pada: 'charanaPada',
            sub_caste: 'subCaste',
            // Add the previously missing field mappings
            alternate_phone: 'alternatePhone',
            communication_address: 'communicationAddress',
            residence_address: 'residenceAddress',
            // Add additional field mappings that were missing
            annual_income: 'annualIncome',
            current_company: 'currentCompany',
            current_age: 'currentAge',
            working_status: 'workingStatus',
            height_feet: 'heightFeet',
            height_inches: 'heightInches'
        };

        // Create a new response with properly mapped field names for frontend
        const mappedProfile = { ...profile };
        
        // Convert snake_case keys to camelCase for frontend
        Object.keys(fieldMappings).forEach(key => {
            if (profile[key] !== undefined) {
                mappedProfile[fieldMappings[key]] = profile[key];
                // Keep the original key for backward compatibility
            }
        });
        
        // Log a few key fields to verify the data
        console.log('🟢 Sample mapped profile data:', {
            profile_id: mappedProfile.profile_id,
            name: mappedProfile.name,
            fatherName: mappedProfile.fatherName,
            motherName: mappedProfile.motherName,
            guruMatha: mappedProfile.guruMatha,
            timeOfBirth: mappedProfile.timeOfBirth,
            charanaPada: mappedProfile.charanaPada,
            // Log the previously missing fields
            alternatePhone: mappedProfile.alternatePhone,
            communicationAddress: mappedProfile.communicationAddress,
            residenceAddress: mappedProfile.residenceAddress,
            // Log additional fields
            annualIncome: mappedProfile.annualIncome,
            currentCompany: mappedProfile.currentCompany,
            currentAge: mappedProfile.currentAge,
            workingStatus: mappedProfile.workingStatus
        });

        res.status(200).json(mappedProfile);
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Export both functions
module.exports = { updateOwnProfile, getOwnProfile };