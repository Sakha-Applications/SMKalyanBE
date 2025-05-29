const db = require('../config/db');

const updateProfile = async (profileId, profileData) => {
    console.log("modifyProfileModel: updateProfile called with profileId:", profileId);
    console.log("modifyProfileModel: updateProfile received data:", profileData);
    console.log("modifyProfileModel: All keys in profileData:", Object.keys(profileData));

    // UPDATED: Complete destructuring with all fields that match your database schema
    const {
        name,
        profile_created_for,
        profile_for,
        mother_tongue,
        native_place,
        current_location,
        profile_status,
        married_status,
        gotra,
        guru_matha,
        dob,
        time_of_birth,
        current_age,
        sub_caste,
        place_of_birth,
        rashi,
        height,
        nakshatra,
        charana_pada,
        email,
        phone,
        alternate_phone,
        communication_address,
        residence_address,
        father_name,
        father_profession,
        mother_name,
        mother_profession,
        expectations,
        siblings,
        about_bride_groom,
        reference1_name,
        reference1_phone,
        reference2_name,
        reference2_phone,
        how_did_you_know,
        working_status,
        education,
        profession,
        designation,
        current_company,
        annual_income,
        profile_category,
        profile_category_need,
        share_details_on_platform
    } = profileData;

    console.log("modifyProfileModel: Destructured key fields:", {
        name,
        profile_created_for,
        profile_for,
        how_did_you_know,
        about_bride_groom,
        reference1_name,
        share_details_on_platform
    });
    
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
            place_of_birth = ?,
            rashi = ?,
            height = ?,
            nakshatra = ?,
            charana_pada = ?,
            email = ?,
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
            about_bride_groom = ?,
            reference1_name = ?,
            reference1_phone = ?,
            reference2_name = ?,
            reference2_phone = ?,
            how_did_you_know = ?,
            working_status = ?,
            education = ?,
            profession = ?,
            designation = ?,
            current_company = ?,
            annual_income = ?,
            profile_category = ?,
            profile_category_need = ?,
            share_details_on_platform = ?
        WHERE profile_id = ?
    `;

    const values = [
        name,
        profile_created_for,
        profile_for,
        mother_tongue,
        native_place,
        current_location,
        profile_status,
        married_status,
        gotra,
        guru_matha,
        dob,
        time_of_birth,
        current_age,
        sub_caste,
        place_of_birth,
        rashi,
        height,
        nakshatra,
        charana_pada,
        email,
        phone,
        alternate_phone,
        communication_address,
        residence_address,
        father_name,
        father_profession,
        mother_name,
        mother_profession,
        expectations,
        siblings,
        about_bride_groom,
        reference1_name,
        reference1_phone,
        reference2_name,
        reference2_phone,
        how_did_you_know,
        working_status,
        education,
        profession,
        designation,
        current_company,
        annual_income,
        profile_category,
        profile_category_need,
        share_details_on_platform,
        profileId  // WHERE clause parameter
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