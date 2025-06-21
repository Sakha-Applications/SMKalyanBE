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

    // CORRECTED: Complete field mappings from frontend camelCase to database snake_case for UPDATES
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
        
        // General profile mappings
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
        
        // NEW: Corrected mappings for guardian phone and family details (camelCase -> snake_case)
        guardianPhone: 'guardian_phone', // Corrected from snake_case:camelCase
        noOfBrothers: 'no_of_brothers', // Corrected from snake_case:camelCase
        noOfSisters: 'no_of_sisters',   // Corrected
        familyStatus: 'family_status',   // Corrected
        familyType: 'family_type',     // Corrected
        familyValues: 'family_values',   // Corrected
        
        // Height fields (if you're using separate feet/inches)
        heightFeet: 'height_feet',
        heightInches: 'height_inches',

        // Other common mappings (ensure these are also correct if they exist elsewhere)
        education: 'education',
        profession: 'profession',
        designation: 'designation',
        gotra: 'gotra',
        rashi: 'rashi',
        nakshatra: 'nakshatra',
        hobbies: 'hobbies',
        diet: 'diet',
        countryLivingIn: 'country_living_in',
        manglikStatus: 'manglik_status',

        // Partner Preferences
        expectations: 'expectations',
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

    // Create mapped profile data
    const mappedProfileData = {};
    
    Object.keys(profileData).forEach(key => {
        // If the key exists in our fieldMappings, use the mapped name
        if (fieldMappings[key]) {
            mappedProfileData[fieldMappings[key]] = profileData[key];
            console.log(`🟢 Mapping field: ${key} -> ${fieldMappings[key]} with value:`, profileData[key]);
        } else if (key.includes('reference') && (key.endsWith('CountryCode') || key.endsWith('PhoneNumber'))) {
            // Special handling for reference phone number parts if they come separately and need to be ignored
            // For example, if the model only expects reference1_phone as a single string
            console.log(`🟡 Ignoring reference phone part: ${key} = ${profileData[key]}`);
        }
        else {
            // For any other field not in mappings, keep its original name (assuming it's already snake_case or handled elsewhere)
            mappedProfileData[key] = profileData[key];
            // Log only if it's not a known field that should be mapped or ignored
            // console.log(`⚪ Keeping original field: ${key} with value:`, profileData[key]);
        }
    });

    // Specific handling for arrays that need to be stringified or joined
    // This logic should ideally be applied after the main fieldMappings,
    // or integrated into it if the mapping function allows.
    // Ensure this matches what modifyProfileModel expects.
    if (Array.isArray(mappedProfileData.hobbies)) {
        mappedProfileData.hobbies = mappedProfileData.hobbies.join(',');
    }
    if (Array.isArray(mappedProfileData.diet)) {
        mappedProfileData.diet = mappedProfileData.diet.join(',');
    }
    if (Array.isArray(mappedProfileData.preferred_education)) {
        mappedProfileData.preferred_education = mappedProfileData.preferred_education.join(',');
    }
    // ... repeat for other multi-select/array fields like preferred_mother_tongues, preferred_sub_castes, etc.
    // If your frontend sends these as simple arrays of strings or directly joins them, this is the place to ensure consistency.

    // Handle array of objects which need to be JSON.stringified
    if (mappedProfileData.preferred_native_origins && Array.isArray(mappedProfileData.preferred_native_origins)) {
        mappedProfileData.preferred_native_origins = JSON.stringify(mappedProfileData.preferred_native_origins);
    }
    if (mappedProfileData.preferred_cities && Array.isArray(mappedProfileData.preferred_cities)) {
        mappedProfileData.preferred_cities = JSON.stringify(mappedProfileData.preferred_cities);
    }
    // Handle age_range, height_range, preferred_income_range if they are arrays and need to be hyphen-separated
    if (Array.isArray(mappedProfileData.age_range)) {
        mappedProfileData.age_range = mappedProfileData.age_range.join('-');
    }
    if (Array.isArray(mappedProfileData.height_range)) {
        mappedProfileData.height_range = mappedProfileData.height_range.join('-');
    }
    if (Array.isArray(mappedProfileData.preferred_income_range)) {
        mappedProfileData.preferred_income_range = mappedProfileData.preferred_income_range.join('-');
    }


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

        // Mappings from database snake_case to frontend camelCase for retrieval
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
            current_location_state: 'currentLocationState',
            current_location_country: 'currentLocationCountry',
            current_location: 'currentLocation',
            place_of_birth_state: 'placeOfBirthState',
            place_of_birth_country: 'placeOfBirthCountry',
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
            height_inches: 'heightInches',

            // Mappings for guardian phone and family details (snake_case -> camelCase)
            guardian_phone: 'guardianPhone',
            no_of_brothers: 'noOfBrothers',
            no_of_sisters: 'noOfSisters',
            family_status: 'familyStatus',
            family_type: 'familyType',
            family_values: 'familyValues',

            // Other mappings for retrieval (from DB snake_case to frontend camelCase)
            education: 'education',
            profession: 'profession',
            designation: 'designation',
            gotra: 'gotra',
            rashi: 'rashi',
            nakshatra: 'nakshatra',
            hobbies: 'hobbies',
            diet: 'diet',
            country_living_in: 'countryLivingIn',
            manglik_status: 'manglikStatus',
            age_range: 'ageRange',
            height_range: 'heightRange',
            preferred_income_range: 'preferredIncomeRange',
            preferred_education: 'preferredEducation',
            preferred_mother_tongues: 'preferredMotherTongues',
            preferred_marital_status: 'preferredMaritalStatus',
            preferred_bride_groom_category: 'preferredBrideGroomCategory',
            preferred_manglik_status: 'preferredManglikStatus',
            preferred_sub_castes: 'preferredSubCastes',
            preferred_guru_mathas: 'preferredGuruMathas',
            preferred_gotras: 'preferredGotras',
            preferred_nakshatras: 'preferredNakshatras',
            preferred_rashis: 'preferredRashis',
            preferred_native_origins: 'preferredNativeOrigins',
            preferred_cities: 'preferredCities',
            preferred_countries: 'preferredCountries',
            preferred_diet: 'preferredDiet',
            preferred_professions: 'preferredProfessions',
            preferred_hobbies: 'preferredHobbies'
        };

        const mappedProfile = { ...profile };

        Object.keys(fieldMappings).forEach(key => {
            if (profile[key] !== undefined) {
                mappedProfile[fieldMappings[key]] = profile[key];
                console.log(`🟢 Mapping: ${key} → ${fieldMappings[key]} =`, profile[key]);
            }
        });

        // Parse array/JSON string fields back to arrays/objects for frontend
        if (mappedProfile.hobbies && typeof mappedProfile.hobbies === 'string') {
            mappedProfile.hobbies = mappedProfile.hobbies.split(',').map(item => item.trim());
        }
        if (mappedProfile.diet && typeof mappedProfile.diet === 'string') {
            mappedProfile.diet = mappedProfile.diet.split(',').map(item => item.trim());
        }
        if (mappedProfile.ageRange && typeof mappedProfile.ageRange === 'string') {
            mappedProfile.ageRange = mappedProfile.ageRange.split('-').map(Number);
        }
        if (mappedProfile.heightRange && typeof mappedProfile.heightRange === 'string') {
            mappedProfile.heightRange = mappedProfile.heightRange.split('-').map(Number);
        }
        if (mappedProfile.preferredIncomeRange && typeof mappedProfile.preferredIncomeRange === 'string') {
            mappedProfile.preferredIncomeRange = mappedProfile.preferredIncomeRange.split('-').map(Number);
        }
        if (mappedProfile.preferredEducation && typeof mappedProfile.preferredEducation === 'string') {
            mappedProfile.preferredEducation = mappedProfile.preferredEducation.split(',').map(item => item.trim());
        }
        if (mappedProfile.preferredMotherTongues && typeof mappedProfile.preferredMotherTongues === 'string') {
            mappedProfile.preferredMotherTongues = mappedProfile.preferredMotherTongues.split(',').map(item => item.trim());
        }
        // ... and so on for other multi-select/array fields

        // Parse JSON stringified arrays of objects back to arrays of objects
        if (mappedProfile.preferredNativeOrigins && typeof mappedProfile.preferredNativeOrigins === 'string') {
            try {
                mappedProfile.preferredNativeOrigins = JSON.parse(mappedProfile.preferredNativeOrigins);
            } catch (e) {
                console.error("Error parsing preferredNativeOrigins JSON:", e);
                mappedProfile.preferredNativeOrigins = [];
            }
        }
        if (mappedProfile.preferredCities && typeof mappedProfile.preferredCities === 'string') {
            try {
                mappedProfile.preferredCities = JSON.parse(mappedProfile.preferredCities);
            } catch (e) {
                console.error("Error parsing preferredCities JSON:", e);
                mappedProfile.preferredCities = [];
            }
        }


        // Extract phone parts for display (country code and number)
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
        
        // Also apply for primary, alternate, and guardian phones if they are handled the same way on frontend
        // Assuming your frontend handles these fields for display directly using 'phone', 'alternatePhone', 'guardianPhone'
        // and expects a single string or extracts parts itself. If it expects separate code/number for *these*, add here.
        // For example:
        // if (mappedProfile.phone) {
        //     const parts = extractPhoneParts(mappedProfile.phone);
        //     mappedProfile.phoneCountryCode = parts.code;
        //     mappedProfile.phoneNumber = parts.number;
        // }


        console.log('🟢 Final mapped profile fields:', Object.keys(mappedProfile));
        console.log('🟢 Sample preview:', {
            reference1Phone: mappedProfile.reference1Phone,
            reference1CountryCode: mappedProfile.reference1CountryCode,
            reference1PhoneNumber: mappedProfile.reference1PhoneNumber,
            fatherProfession: mappedProfile.fatherProfession,
            motherProfession: mappedProfile.motherProfession,
            guardianPhone: mappedProfile.guardianPhone, // Add for sample preview
            noOfBrothers: mappedProfile.noOfBrothers,   // Add for sample preview
            familyValues: mappedProfile.familyValues    // Add for sample preview
        });

        res.status(200).json(mappedProfile);
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = { updateOwnProfile, getOwnProfile };