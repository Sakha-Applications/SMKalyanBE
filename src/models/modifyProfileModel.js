const db = require('../config/db');  // Adjust the path if needed

const updateProfile = async (profileId, profileData) => {
    console.log("modifyProfileModel: updateProfile called with profileId:", profileId);
    console.log("modifyProfileModel: updateProfile received data:", profileData);

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
        rashi,
        height,
        nakshatra,
        charana_pada,
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
        working_status,
        education,
        profession,
        designation,
        current_company,
        annual_income,
        profile_category,
        profile_category_need
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
            annual_income = ?,
            profile_category = ?,
            profile_category_need = ?
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
        rashi,
        height,
        nakshatra,
        charana_pada,
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
        working_status,
        education,
        profession,
        designation,
        current_company,
        annual_income,
        profile_category,
        profile_category_need,
        profileId
    ];

    console.log("modifyProfileModel: Constructed Query:", query);
    console.log("modifyProfileModel: Values Array:", values);

    try {
        const [result] = await db.query(query, values);
        console.log("modifyProfileModel: Query Result:", result);
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

module.exports = {
    updateProfile,
    getProfileById
};
