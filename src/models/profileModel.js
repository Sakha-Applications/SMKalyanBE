// models/profileModel.js

const db = require("../config/db");

// Create a new profile
const createProfile = async (formData) => {

  const {
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocationState, currentLocationCountry,currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste,
    placeOfBirth,
    rashi, height,
    nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    aboutBrideGroom,
    reference1Name, reference1Phone,
    reference2Name, reference2Phone,
    howDidYouKnow,
    workingStatus, education, profession, designation,
    currentCompany, profileCategory, profileCategoryNeed, annualIncome,
    shareDetailsOnPlatform,
    diet, hobbies, countryLivingIn, manglikStatus,
    ageRange, heightRange, preferredIncomeRange, preferredEducation,
    preferredMotherTongues, preferredMaritalStatus, preferredBrideGroomCategory,
    preferredManglikStatus, preferredSubCastes, preferredGuruMathas,
    preferredGotras, preferredNakshatras, preferredRashis, preferredNativeOrigins,
    preferredCities, preferredCountries, preferredDiet, preferredProfessions, preferredHobbies
  } = formData;

  console.log("🟡 Preparing to insert profile data into Azure MySQL DB");

  const query = `
  INSERT INTO profile (
    profile_id, name, profile_created_for, profile_for, mother_tongue,
    native_place,current_location_state, current_location_country, current_location, profile_status, married_status, gotra, guru_matha,
    dob, time_of_birth, current_age, sub_caste, place_of_birth,
    rashi, height, nakshatra, charana_pada, email, phone, alternate_phone,
    communication_address, residence_address, father_name, father_profession,
    mother_name, mother_profession, expectations, siblings,
    about_bride_groom,
    reference1_name, reference1_phone,
    reference2_name, reference2_phone,
    how_did_you_know,
    working_status, education, profession, designation,
    current_company, profile_category, profile_category_need, annual_income,
    share_details_on_platform,
    diet, hobbies, country_living_in, manglik_status,
    age_range, height_range, preferred_income_range, preferred_education,
    preferred_mother_tongues, preferred_marital_status, preferred_bride_groom_category,
    preferred_manglik_status, preferred_sub_castes, preferred_guru_mathas,
    preferred_gotras, preferred_nakshatras, preferred_rashis, preferred_native_origins,
    preferred_cities, preferred_countries, preferred_diet, preferred_professions, preferred_hobbies
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?
  )
`;

  const values = [
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocationState, currentLocationCountry,currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste, placeOfBirth,
    rashi, height, nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    aboutBrideGroom,
    reference1Name, reference1Phone,
    reference2Name, reference2Phone,
    howDidYouKnow,
    workingStatus, education, profession, designation,
    currentCompany, profileCategory, profileCategoryNeed, annualIncome,
    shareDetailsOnPlatform,
    diet?.join(','), hobbies?.join(','), countryLivingIn, manglikStatus,
    ageRange?.join('-'), heightRange?.join('-'), preferredIncomeRange?.join('-'), preferredEducation?.join(','),
    preferredMotherTongues?.join(','), preferredMaritalStatus, preferredBrideGroomCategory,
    preferredManglikStatus, preferredSubCastes?.join(','), preferredGuruMathas?.join(','),
    preferredGotras?.join(','), preferredNakshatras?.join(','), preferredRashis?.join(','), 
    preferredNativeOrigins ? JSON.stringify(preferredNativeOrigins) : null,
preferredCities ? JSON.stringify(preferredCities) : null,
 
    preferredCountries?.join(','), preferredDiet?.join(','), preferredProfessions?.join(','), preferredHobbies?.join(',')
  ];

  try {
    const [result] = await db.query(query, values);
    console.log("✅ Inserted into Azure MySQL. ID:", result.insertId);
    return { success: true, insertId: result.insertId };
  } catch (error) {
    console.error("❌ Azure MySQL error during insert:", error);
    throw error;
  }
};

// Fetch all profiles (ensure this also includes the new fields if you ever fetch them)
const fetchAllProfiles = async () => {
  const query = `SELECT * FROM profile ORDER BY created_at DESC`;

  try {
    const [rows] = await db.query(query);
    return rows;
  } catch (error) {
      console.error("❌ Azure MySQL error during fetchAllProfiles:", error);
    throw error;
  }
};

// ✅ Fixed getProfileById function
const getProfileById = async (profileId) => {
  console.log("🔵 getProfileById called with:", profileId, "| Type:", typeof profileId);
  
  // ✅ Add validation to ensure profileId is a string
  if (!profileId || typeof profileId !== 'string') {
    console.error("❌ Invalid profileId received:", profileId, "Type:", typeof profileId);
    throw new Error('Invalid profile ID provided');
  }

  const query = "SELECT * FROM profile WHERE profile_id = ?";
  
  try {
    // ✅ Ensure we're passing only the profileId string, not an object
    const [rows] = await db.query(query, [profileId.toString()]);
    console.log("🔍 Query executed. Rows found:", rows.length);
    return rows[0] || null;
  } catch (error) {
    console.error("❌ Error in getProfileById model:", error);
    console.error("❌ ProfileId that caused error:", profileId);
    throw error;
  }
};

module.exports = {
  createProfile,
  fetchAllProfiles,
  getProfileById
};