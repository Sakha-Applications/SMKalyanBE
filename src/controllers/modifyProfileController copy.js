// backend/controllers/modifyProfileController.js
const UserLogin = require('../models/userLoginModel');
const modifyProfileModel = require('../models/modifyProfileModel');

const updateOwnProfile = async (req, res) => {
    const userEmail = req.user.userId;
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

    // UPDATED: Complete field mappings from frontend camelCase to database snake_case
    const fieldMappings = {
        // Basic mappings
        fatherName: 'father_name',
        motherName: 'mother_name',
        fatherProfession: 'father_profession',
        motherProfession: 'mother_profession',
        guruMatha: 'guru_matha',
        timeOfBirth: 'time_of_birth',
        charanaPada: 'charana_pada',
        subCaste: 'sub_caste',
        alternatePhone: 'alternate_phone',
        communicationAddress: 'communication_address',
        residenceAddress: 'residence_address',
        annualIncome: 'annual_income',
        currentCompany: 'current_company',
        currentAge: 'current_age',
        workingStatus: 'working_status',
        
        // MISSING MAPPINGS - These were causing the population issues:
        profileCreatedFor: 'profile_created_for',
        profileFor: 'profile_for',
        motherTongue: 'mother_tongue',
        nativePlace: 'native_place',
nativePlaceState: 'native_place_state',
nativePlaceCountry: 'native_place_country',
        currentLocationState: 'current_location_state',
        currentLocationCountry: 'current_location_country',
        currentLocation: 'current_location',
        profileStatus: 'profile_status',
        marriedStatus: 'married_status',
        placeOfBirth: 'place_of_birth',
        placeOfBirthState: 'place_of_birth_state',
placeOfBirthCountry: 'place_of_birth_country',
        aboutBrideGroom: 'about_bride_groom',
        reference1Name: 'reference1_name',
        reference1Phone: 'reference1_phone',
        reference2Name: 'reference2_name',
        reference2Phone: 'reference2_phone',
        howDidYouKnow: 'how_did_you_know',
        profileCategory: 'profile_category',
        profileCategoryNeed: 'profile_category_need',
        shareDetailsOnPlatform: 'share_details_on_platform',
        guardian_phone: 'guardianPhone', // Add this
    no_of_brothers: 'noOfBrothers', // Add this
    no_of_sisters: 'noOfSisters',   // Add this
    family_status: 'familyStatus',   // Add this
    family_type: 'familyType',     // Add this
    family_values: 'familyValues',   // Add this
        
        // Height fields (if you're using separate feet/inches)
        heightFeet: 'height_feet',
        heightInches: 'height_inches'
    };

    // Create mapped profile data
    const mappedProfileData = {};
    
    Object.keys(profileData).forEach(key => {
        if (fieldMappings[key]) {
            mappedProfileData[fieldMappings[key]] = profileData[key];
            if (
  ['preferred_native_origins', 'preferred_cities'].includes(fieldMappings[key]) &&
  Array.isArray(profileData[key])
) {
  mappedProfileData[fieldMappings[key]] = JSON.stringify(profileData[key]);
}

            console.log(`🟢 Mapping field: ${key} -> ${fieldMappings[key]} with value:`, profileData[key]);
        } else {
            // Keep original field name for fields that don't need mapping
            mappedProfileData[key] = profileData[key];
        }
    });

    console.log('🟢 Processed profile data:', JSON.stringify(mappedProfileData, null, 2));

    try {
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

        const result = await modifyProfileModel.updateProfile(profileId, mappedProfileData);
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

const getOwnProfile = async (req, res) => {
    const userEmail = req.user.userId;
    console.log('🟢 Fetching profile for user:', userEmail);

    try {
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

        const profile = await modifyProfileModel.getProfileById(profileId);
        if (!profile) {
            console.log('❌ Profile not found for ID:', profileId);
            return res.status(404).json({ error: 'Profile not found' });
        }

        console.log('🟢 Raw DB profile data keys:', Object.keys(profile));

        const fieldMappings = {
            father_name: 'fatherName',
            mother_name: 'motherName',
            father_profession: 'fatherProfession',
            mother_profession: 'motherProfession',
            guru_matha: 'guruMatha',
            time_of_birth: 'timeOfBirth',
            charana_pada: 'charanaPada',
            sub_caste: 'subCaste',
            alternate_phone: 'alternatePhone',
            communication_address: 'communicationAddress',
            residence_address: 'residenceAddress',
            annual_income: 'annualIncome',
            current_company: 'currentCompany',
            current_age: 'currentAge',
            working_status: 'workingStatus',
            profile_created_for: 'profileCreatedFor',
            profile_for: 'profileFor',
            mother_tongue: 'motherTongue',
            native_place: 'nativePlace',
            currentLocationState: 'currentLocationState',
            currentLocationCountry: 'currentLocationCountry',
            current_location: 'currentLocation',
            placeOfBirthState: 'place_of_birth_state',
placeOfBirthCountry: 'place_of_birth_country',
            profile_status: 'profileStatus',
            married_status: 'marriedStatus',
            place_of_birth: 'placeOfBirth',
            about_bride_groom: 'aboutBrideGroom',
            reference1_name: 'reference1Name',
            reference1_phone: 'reference1Phone',
            reference2_name: 'reference2Name',
            reference2_phone: 'reference2Phone',
            how_did_you_know: 'howDidYouKnow',
            profile_category: 'profileCategory',
            profile_category_need: 'profileCategoryNeed',
            share_details_on_platform: 'shareDetailsOnPlatform',
            height_feet: 'heightFeet',
            guardian_phone: 'guardianPhone', // Add this
    no_of_brothers: 'noOfBrothers', // Add this
    no_of_sisters: 'noOfSisters',   // Add this
    family_status: 'familyStatus',   // Add this
    family_type: 'familyType',     // Add this
    family_values: 'familyValues',   // Add this
            height_inches: 'heightInches'
        };

        const mappedProfile = { ...profile };

        Object.keys(fieldMappings).forEach(key => {
            if (profile[key] !== undefined) {
                mappedProfile[fieldMappings[key]] = profile[key];
                console.log(`🟢 Mapping: ${key} → ${fieldMappings[key]} =`, profile[key]);
            }
        });

        // Extract phone parts
        const extractPhoneParts = (fullPhone = '') => {
            const match = fullPhone.match(/^(\+\d{1,4})(\d+)$/);
            if (match) {
                console.log(`🟢 Split phone "${fullPhone}" into code="${match[1]}" and number="${match[2]}"`);
                return { code: match[1], number: match[2] };
            } else {
                console.log(`⚠️ Could not split phone "${fullPhone}", returning raw`);
                return { code: '', number: fullPhone };
            }
        };

        const phoneFields = [
            { full: 'reference1Phone', code: 'reference1CountryCode', number: 'reference1PhoneNumber' },
            { full: 'reference2Phone', code: 'reference2CountryCode', number: 'reference2PhoneNumber' }
        ];

        phoneFields.forEach(({ full, code, number }) => {
            const fullValue = mappedProfile[full];
            if (fullValue) {
                const parts = extractPhoneParts(fullValue);
                mappedProfile[code] = parts.code;
                mappedProfile[number] = parts.number;
                console.log(`🟢 Added to mappedProfile → ${code}: ${parts.code}, ${number}: ${parts.number}`);
            }
        });

        console.log('🟢 Final mapped profile fields:', Object.keys(mappedProfile));
        console.log('🟢 Sample preview:', {
            reference1Phone: mappedProfile.reference1Phone,
            reference1CountryCode: mappedProfile.reference1CountryCode,
            reference1PhoneNumber: mappedProfile.reference1PhoneNumber,
            fatherProfession: mappedProfile.fatherProfession,
            motherProfession: mappedProfile.motherProfession
        });

        res.status(200).json(mappedProfile);
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};



module.exports = { updateOwnProfile, getOwnProfile };