// models/profileModel.js

const db = require("../config/db");

// Create a new profile
const createProfile = async (formData) => {
  const {
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste,
    placeOfBirth,
    rashi, height,
    nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    aboutBrideGroom,
    reference1Name,
    reference1Phone,
    reference2Name,
    reference2Phone,
    howDidYouKnow,
    workingStatus, education, profession, designation,
    currentCompany, profileCategory, profileCategoryneed, annualIncome,
    shareDetailsOnPlatform
  } = formData;

  console.log("🟡 Preparing to insert profile data into Azure MySQL DB");

  // This console.log helps debug the actual values received from the frontend.
  // Verify that all 46 values are present and in the correct order here.
  console.log("Values array for insert:", [
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste,
    placeOfBirth,
    rashi, height,
    nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    aboutBrideGroom,
    reference1Name,
    reference1Phone,
    reference2Name,
    reference2Phone,
    howDidYouKnow,
    workingStatus, education, profession, designation,
    currentCompany, profileCategory, profileCategoryneed, annualIncome,
    shareDetailsOnPlatform
  ]);

  const query = `
    INSERT INTO profile (
      profile_id, name, profile_created_for, profile_for, mother_tongue,
      native_place, current_location, profile_status, married_status, gotra, guru_matha,
      dob, time_of_birth, current_age, sub_caste,
      place_of_birth,
      rashi, height,
      nakshatra, charana_pada, email, phone, alternate_phone,
      communication_address, residence_address, father_name, father_profession,
      mother_name, mother_profession, expectations, siblings,
      about_bride_groom,
      reference1_name,
      reference1_phone,
      reference2_name,
      reference2_phone,
      how_did_you_know,
      working_status, education, profession, designation,
      current_company, profile_category, profile_category_need, annual_income,
      share_details_on_platform,
      created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, -- 11 placeholders
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, -- 11 placeholders
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, -- 11 placeholders
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, -- 11 placeholders
      ?, ?,  NOW()                   -- 2 placeholders + NOW() for 'created_at'
    )
  `;

  // Total `?` placeholders: 11 + 11 + 11 + 11 + 2 = 46.
  // This must match the number of elements in the `values` array.
  const values = [
    profileId, name, profileCreatedFor, profileFor, motherTongue,
    nativePlace, currentLocation, profileStatus, marriedStatus, gotra, guruMatha,
    dob, timeOfBirth, currentAge, subCaste,
    placeOfBirth,
    rashi, height,
    nakshatra, charanaPada, email, phone, alternatePhone,
    communicationAddress, residenceAddress, fatherName, fatherProfession,
    motherName, motherProfession, expectations, siblings,
    aboutBrideGroom,
    reference1Name,
    reference1Phone,
    reference2Name,
    reference2Phone,
    howDidYouKnow,
    workingStatus, education, profession, designation,
    currentCompany, profileCategory, profileCategoryneed, annualIncome,
    shareDetailsOnPlatform
  ]; // This array contains 46 elements.

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

module.exports = { createProfile, fetchAllProfiles };