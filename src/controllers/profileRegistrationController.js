const { createProfile, fetchAllProfiles } = require("../models/profileModel");
const axios = require('axios'); // Import axios to make HTTP requests

// Add a new profile
const addProfile = async (req, res) => {
    console.log("🟢 Received request to add profile:", req.body);
    const { profileData, userLoginData } = req.body;

    console.log("➡️ profileData:", profileData);
    console.log("➡️ userLoginData:", userLoginData);

    const calculatedProfileId = profileData.profileId; // The generated VARCHAR profileId
    console.log("➡️ Calculated Profile ID at start:", calculatedProfileId); // Debug

    try {
        // 1. Insert the profile data
        const profileResult = await createProfile(profileData);
        console.log("✅ Profile creation result:", profileResult);

        if (profileResult && profileResult.insertId >= 0) {
            console.log("✅ Profile inserted successfully. Calculated Profile ID:", calculatedProfileId);

            let userLoginResponseData = null;

            // 2. Insert the user login data by calling the separate user login API
            if (userLoginData && calculatedProfileId) {
                try {
                    console.log("➡️ Attempting to create user login with profileId:", calculatedProfileId, "user_id:", userLoginData.user_id);
                    const userLoginResponse = await axios.post("${config.apiUrl}/userlogin", {
                        profileId: calculatedProfileId, // Use the generated VARCHAR profileId
                        user_id: userLoginData.user_id,
                        password: userLoginData.password
                    });

                    console.log("✅ User login details inserted successfully:", userLoginResponse.data);
                    userLoginResponseData = userLoginResponse.data;
                    console.log("➡️ Before successful response:", calculatedProfileId); // Debug
                    return res.status(201).json({
                        message: "Profile and user login created successfully",
                        profileId: calculatedProfileId, // Send back the generated profileId
                        userId: userLoginResponseData?.userId,
                        password: userLoginData.password // Include the password in the response
                    });

                } catch (userLoginError) {
                    console.error("❌ Error creating user login via API:", userLoginError);
                    console.log("➡️ In userLoginError catch:", calculatedProfileId); // Debug
                    return res.status(500).json({
                        message: "Profile created successfully, but failed to create user login",
                        profileId: calculatedProfileId, // Send back the generated profileId
                        userLoginError: userLoginError.message
                    });
                }
            } else {
                console.log("➡️ User login data missing:", calculatedProfileId); // Debug
                return res.status(201).json({
                    message: "Profile created successfully (user login data missing)",
                    profileId: calculatedProfileId, // Send back the generated profileId
                });
            }
        } else {
            console.error("❌ Error during profile creation: profileResult indicates failure");
            return res.status(500).json({
                error: "Internal Server Error during profile creation",
                details: "Failed to insert profile data."
            });
        }
    } catch (error) {
        console.error("❌ Unexpected error in addProfile:", error);
        console.log("➡️ In main catch block:", calculatedProfileId); // Debug
        return res.status(500).json({ error: "Unexpected Internal Server Error", details: error.message });
    }

    console.warn("⚠️ Reached the end of addProfile without sending a response. Check your logic.");
};

// Fetch all profiles (using the imported fetchAllProfiles)
const getAllProfiles = async (req, res) => {
    try {
        const profiles = await fetchAllProfiles();
        res.status(200).json(profiles[0]); // Assuming fetchAllProfiles returns an array with one element being the rows
    } catch (error) {
        console.error("❌ Error fetching all profiles:", error);
        res.status(500).json({ error: "Failed to fetch profiles", details: error.message });
    }
};

module.exports = { addProfile, getAllProfiles };