const db = require('../config/db');

const updateProfile = async (profileId, profileData) => {
  console.log("modifyProfileModel: updateProfile called with profileId:", profileId);
  console.log("modifyProfileModel: updateProfile received data:", profileData);
  console.log("modifyProfileModel: All keys in profileData:", Object.keys(profileData));

  const {
    name, profile_created_for, profile_for, mother_tongue, native_place, current_location, profile_status,
    married_status, gotra, guru_matha, dob, time_of_birth, current_age, sub_caste, place_of_birth,
    rashi, height, nakshatra, charana_pada, email, phone, alternate_phone,
    communication_address, residence_address, father_name, father_profession,
    mother_name, mother_profession, expectations, siblings, about_bride_groom,
    reference1_name, reference1_phone, reference2_name, reference2_phone, how_did_you_know,
    working_status, education, profession, designation, current_company,
    annual_income, profile_category, profile_category_need, share_details_on_platform,
    diet, hobbies, country_living_in, manglik_status,
    age_range, height_range, preferred_income_range, preferred_education,
    preferred_mother_tongues, preferred_marital_status, preferred_bride_groom_category,
    preferred_manglik_status, preferred_sub_castes, preferred_guru_mathas,
    preferred_gotras, preferred_nakshatras, preferred_rashis, preferred_native_origins,
    preferred_cities, preferred_countries, preferred_diet, preferred_professions, preferred_hobbies
  } = profileData;

  function sanitize(value) {
    return value !== undefined ? value : null;
  }

  const query = `
    UPDATE profile SET
      name = ?, profile_created_for = ?, profile_for = ?, mother_tongue = ?,
      native_place = ?, current_location = ?, profile_status = ?, married_status = ?, gotra = ?, guru_matha = ?,
      dob = ?, time_of_birth = ?, current_age = ?, sub_caste = ?, place_of_birth = ?,
      rashi = ?, height = ?, nakshatra = ?, charana_pada = ?, email = ?, phone = ?, alternate_phone = ?,
      communication_address = ?, residence_address = ?, father_name = ?, father_profession = ?,
      mother_name = ?, mother_profession = ?, expectations = ?, siblings = ?, about_bride_groom = ?,
      reference1_name = ?, reference1_phone = ?, reference2_name = ?, reference2_phone = ?, how_did_you_know = ?,
      working_status = ?, education = ?, profession = ?, designation = ?, current_company = ?,
      annual_income = ?, profile_category = ?, profile_category_need = ?, share_details_on_platform = ?,
      diet = ?, hobbies = ?, country_living_in = ?, manglik_status = ?,
      age_range = ?, height_range = ?, preferred_income_range = ?, preferred_education = ?,
      preferred_mother_tongues = ?, preferred_marital_status = ?, preferred_bride_groom_category = ?,
      preferred_manglik_status = ?, preferred_sub_castes = ?, preferred_guru_mathas = ?,
      preferred_gotras = ?, preferred_nakshatras = ?, preferred_rashis = ?, preferred_native_origins = ?,
      preferred_cities = ?, preferred_countries = ?, preferred_diet = ?, preferred_professions = ?, preferred_hobbies = ?
    WHERE profile_id = ?
  `;

  const values = [
    sanitize(name), sanitize(profile_created_for), sanitize(profile_for), sanitize(mother_tongue),
    sanitize(native_place), sanitize(current_location), sanitize(profile_status), sanitize(married_status),
    sanitize(gotra), sanitize(guru_matha), sanitize(dob), sanitize(time_of_birth), sanitize(current_age),
    sanitize(sub_caste), sanitize(place_of_birth), sanitize(rashi), sanitize(height), sanitize(nakshatra),
    sanitize(charana_pada), sanitize(email), sanitize(phone), sanitize(alternate_phone),
    sanitize(communication_address), sanitize(residence_address), sanitize(father_name), sanitize(father_profession),
    sanitize(mother_name), sanitize(mother_profession), sanitize(expectations), sanitize(siblings), sanitize(about_bride_groom),
    sanitize(reference1_name), sanitize(reference1_phone), sanitize(reference2_name), sanitize(reference2_phone),
    sanitize(how_did_you_know), sanitize(working_status), sanitize(education), sanitize(profession), sanitize(designation),
    sanitize(current_company), sanitize(annual_income), sanitize(profile_category), sanitize(profile_category_need),
    sanitize(share_details_on_platform),
    sanitize(Array.isArray(diet) ? diet.join(',') : diet),
    sanitize(Array.isArray(hobbies) ? hobbies.join(',') : hobbies),
    sanitize(country_living_in), sanitize(manglik_status),
    sanitize(Array.isArray(age_range) ? age_range.join('-') : age_range),
    sanitize(Array.isArray(height_range) ? height_range.join('-') : height_range),
    sanitize(Array.isArray(preferred_income_range) ? preferred_income_range.join('-') : preferred_income_range),
    sanitize(Array.isArray(preferred_education) ? preferred_education.join(',') : preferred_education),
    sanitize(Array.isArray(preferred_mother_tongues) ? preferred_mother_tongues.join(',') : preferred_mother_tongues),
    sanitize(preferred_marital_status), sanitize(preferred_bride_groom_category),
    sanitize(preferred_manglik_status),
    sanitize(Array.isArray(preferred_sub_castes) ? preferred_sub_castes.join(',') : preferred_sub_castes),
    sanitize(Array.isArray(preferred_guru_mathas) ? preferred_guru_mathas.join(',') : preferred_guru_mathas),
    sanitize(Array.isArray(preferred_gotras) ? preferred_gotras.join(',') : preferred_gotras),
    sanitize(Array.isArray(preferred_nakshatras) ? preferred_nakshatras.join(',') : preferred_nakshatras),
    sanitize(Array.isArray(preferred_rashis) ? preferred_rashis.join(',') : preferred_rashis),
    sanitize(Array.isArray(preferred_native_origins) ? preferred_native_origins.join(',') : preferred_native_origins),
    sanitize(Array.isArray(preferred_cities) ? preferred_cities.join(',') : preferred_cities),
    sanitize(Array.isArray(preferred_countries) ? preferred_countries.join(',') : preferred_countries),
    sanitize(Array.isArray(preferred_diet) ? preferred_diet.join(',') : preferred_diet),
    sanitize(Array.isArray(preferred_professions) ? preferred_professions.join(',') : preferred_professions),
    sanitize(Array.isArray(preferred_hobbies) ? preferred_hobbies.join(',') : preferred_hobbies),
    profileId
  ];

  console.log("modifyProfileModel: Constructed Query:", query);
  console.log("modifyProfileModel: Values Array Length:", values.length);
  console.log("modifyProfileModel: Sample Values:", {
    name: values[0],
    profile_created_for: values[1],
    profile_for: values[2],
    how_did_you_know: values[35],
    profileId: values[values.length - 1]
  });

  try {
    const [result] = await db.query(query, values);
    console.log("modifyProfileModel: Query Result:", result);
    return result;
  } catch (error) {
    console.error("Database error updating profile:", error);
    console.error("Error details:", error.message);
    throw error;
  }
};

const getProfileById = async (profileId) => {
    const query = `SELECT * FROM profile WHERE profile_id = ?`;

    try {
        const [rows] = await db.query(query, [profileId]);
        console.log("modifyProfileModel: Retrieved profile fields:", rows[0] ? Object.keys(rows[0]) : 'No profile found');
        return rows[0];
    } catch (error) {
        console.error("Database error getting profile:", error);
        throw error;
    }
};

module.exports = {
    updateProfile,
    getProfileById
};