// backend/controllers/directUpdateController.js
const modifyProfileModel = require('../models/modifyProfileModel');

const updateProfileDirect = async (req, res) => {
    const profileId = req.params.profileId;
    const { profileData } = req.body;

    console.log('🟢 Direct profile update for ID:', profileId);
    console.log('🟢 Received raw profile data:', JSON.stringify(profileData, null, 2));

    if (!profileId) {
        return res.status(400).json({ error: 'Profile ID is required' });
    }

    if (!profileData) {
        return res.status(400).json({ error: 'Profile data is required' });
    }

    // Process form data to handle objects with value properties
    Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && typeof profileData[key] === 'object') {
            if (profileData[key].value !== undefined) {
                console.log(`🟢 Converting object field ${key} from`, profileData[key], "to", profileData[key].value);
                profileData[key] = profileData[key].value;
            }
        }
    });

    // Use the same field mappings as modifyProfileController
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
  profileCreatedFor: 'profile_created_for',
  profileFor: 'profile_for',
  motherTongue: 'mother_tongue',
  nativePlace: 'native_place',
  currentLocation: 'current_location',
  profileStatus: 'profile_status',
  marriedStatus: 'married_status',
  placeOfBirth: 'place_of_birth',
  aboutBrideGroom: 'about_bride_groom',
  reference1Name: 'reference1_name',
  reference1Phone: 'reference1_phone',
  reference2Name: 'reference2_name',
  reference2Phone: 'reference2_phone',
  howDidYouKnow: 'how_did_you_know',
  profileCategory: 'profile_category',
  profileCategoryNeed: 'profile_category_need',
  shareDetailsOnPlatform: 'share_details_on_platform',
  heightFeet: 'height_feet',
  heightInches: 'height_inches',

  // NEW Lifestyle fields
  diet: 'diet',
  hobbies: 'hobbies',
  countryLivingIn: 'country_living_in',
  manglikStatus: 'manglik_status',

  // Partner Preferences
  ageRange: 'age_range',
  heightRange: 'height_range',
  preferredIncomeRange: 'preferred_income_range',
  preferredEducation: 'preferred_education',
  preferredMotherTongues: 'preferred_mother_tongues',
  preferredMaritalStatus: 'preferred_marital_status',
  preferredBrideGroomCategory: 'preferred_bride_groom_category',
  preferredManglikStatus: 'preferred_manglik_status',
  preferredSubCastes: 'preferred_sub_castes',
  preferredGuruMathas: 'preferred_guru_mathas',
  preferredGotras: 'preferred_gotras',
  preferredNakshatras: 'preferred_nakshatras',
  preferredRashis: 'preferred_rashis',
  preferredNativeOrigins: 'preferred_native_origins',
  preferredCities: 'preferred_cities',
  preferredCountries: 'preferred_countries',
  preferredDiet: 'preferred_diet',
  preferredProfessions: 'preferred_professions',
  preferredHobbies: 'preferred_hobbies'
};


// Convert arrays to comma-separated strings for DB
Object.keys(profileData).forEach(key => {
  if (Array.isArray(profileData[key])) {
    console.log(`🔄 Flattening array field ${key}:`, profileData[key]);
    profileData[key] = profileData[key].join(',');
  }
});

    // Create mapped profile data
    const mappedProfileData = {};
    
    Object.keys(profileData).forEach(key => {
        if (fieldMappings[key]) {
            mappedProfileData[fieldMappings[key]] = profileData[key];
            console.log(`🟢 Mapping field: ${key} -> ${fieldMappings[key]} with value:`, profileData[key]);
        } else {
            // Keep original field name for fields that don't need mapping
            mappedProfileData[key] = profileData[key];
        }
    });

    console.log('🟢 Processed profile data for direct update:', JSON.stringify(mappedProfileData, null, 2));

    try {
        // Use existing modifyProfileModel to update the profile
        const result = await modifyProfileModel.updateProfile(profileId, mappedProfileData);
        console.log('🟢 Direct update result:', result);

        if (result && result.affectedRows > 0) {
            res.status(200).json({ 
                message: 'Profile updated successfully via direct update', 
                profileId,
                affectedRows: result.affectedRows 
            });
        } else {
            res.status(400).json({ 
                error: 'Failed to update profile. Profile may not exist, or no changes were made.',
                profileId 
            });
        }
    } catch (error) {
        console.error('❌ Error in direct profile update:', error);
        res.status(500).json({ 
            error: 'Internal server error during direct profile update', 
            details: error.message,
            profileId 
        });
    }
};

module.exports = { updateProfileDirect };