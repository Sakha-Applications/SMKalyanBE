// backend/models/modifyProfileModel.js  // Renamed file
const db = require('../config/db');  // Adjust the path if needed

const updateProfile = async (profileId, profileData) => {
    const {
        name,
        profileCreatedFor,
        profileFor,
        motherTongue,
        nativePlace,
        currentLocation,
        profileStatus,
        marriedStatus,
        gotra,
        guruMatha,
        dob,
        timeOfBirth,
        currentAge,
        subCaste,
        rashi,
        height,
        nakshatra,
        charanaPada,
        phone,
        alternatePhone,
        communicationAddress,
        residenceAddress,
        fatherName,
        fatherProfession,
        motherName,
        motherProfession,
        expectations,
        siblings,
        workingStatus,
        education,
        profession,
        designation,
        currentCompany,
        annualIncome
    } = profileData;

    const query = `
    UPDATE profile
    SET
        name = ?,
        profile_created_for = ?,
        profile_for = ?,
        mother_tongue = ?,
        native_place = ?,
        current_location = ?,
        profile_status = ?,
        married_status = ?,
        gotra = ?,
        guru_matha = ?,
        dob = ?,
        time_of_birth = ?,
        current_age = ?,
        sub_caste = ?,
        rashi = ?,
        height = ?,
        nakshatra = ?,
        charana_pada = ?,
        phone = ?,
        alternate_phone = ?,
        communication_address = ?,
        residence_address = ?,
        father_name = ?,
        father_profession = ?,
        mother_name = ?,
        mother_profession = ?,
        expectations = ?,
        siblings = ?,
        working_status = ?,
        education = ?,
        profession = ?,
        designation = ?,
        current_company = ?,
        annual_income = ?
    WHERE
        profile_id = ?
    `;

    const values = [
        name,
        profileCreatedFor,
        profileFor,
        motherTongue,
        nativePlace,
        currentLocation,
        profileStatus,
        marriedStatus,
        gotra,
        guruMatha,
        dob,
        timeOfBirth,
        currentAge,
        subCaste,
        rashi,
        height,
        nakshatra,
        charanaPada,
        phone,
        alternatePhone,
        communicationAddress,
        residenceAddress,
        fatherName,
        fatherProfession,
        motherName,
        motherProfession,
        expectations,
        siblings,
        workingStatus,
        education,
        profession,
        designation,
        currentCompany,
        annualIncome,
        profileId
    ];

    

    try {
        const [result] = await db.query(query, values);
        return result;
    } catch (error) {
        console.error("Database error updating profile:", error);
        throw error;
    }
    

};

const getProfileById = async (profileId) => {
    const query = `SELECT * FROM profile WHERE profile_id = ?`;
    
    try {
        const [rows] = await db.query(query, [profileId]);
        return rows[0];
    } catch (error) {
        console.error("Database error getting profile:", error);
        throw error;
    }
};

module.exports = { updateProfile,
    getProfileById
 };