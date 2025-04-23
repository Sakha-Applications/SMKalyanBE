const db = require("../config/db");

// Create a new profile
const createProfile = async (formData) => {
  const {
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste, rashi, height,
    nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    workingStatus, education, profession, designation,
    currentCompany, profileCategory,profileCategoryneed, annualIncome
  } = formData;

  console.log("🟡 Preparing to insert profile data into Azure MySQL DB");

  console.log([
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste, rashi, height,
    nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    workingStatus, education, profession, designation,
    currentCompany,profileCategory,profileCategoryneed, annualIncome
  ]);

  const query = `
    INSERT INTO profile (
      profile_id, name, profile_created_for, profile_for, mother_tongue,
      native_place, current_location, profile_status, married_status, gotra, guru_matha,
      dob, time_of_birth, current_age, sub_caste, rashi, height,
      nakshatra, charana_pada, email, phone, alternate_phone,
      communication_address, residence_address, father_name, father_profession,
      mother_name, mother_profession, expectations, siblings,
      working_status, education, profession, designation,
      current_company, profile_category, profile_category_need,annual_income, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,  NOW()
    )
  `;

  const values = [
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste, rashi, height,
    nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    workingStatus, education, profession, designation,
    currentCompany, profileCategory,profileCategoryneed, annualIncome
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

// Fetch all profiles
const fetchAllProfiles = async () => {
  const query = `SELECT * FROM profile ORDER BY created_at DESC`;

  try {
    const [rows] = await db.query(query);
    console.log("✅ Retrieved profiles:", rows.length);
    return [rows];
  } catch (error) {
    console.error("❌ Error fetching profiles from Azure MySQL:", error);
    throw error;
  }
};

module.exports = { createProfile, fetchAllProfiles };

