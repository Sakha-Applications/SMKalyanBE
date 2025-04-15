const UserLogin = require("../models/userLoginModel");

const createUserLogin = async (req, res) => {
    try {
        const { profileId, user_id, password } = req.body;

        const result = await UserLogin.create({ profileId, user_id, password });

        res.status(201).json({
            message: "User login created successfully",
            userId: result.user_id,
            //password: "Password set successfully" // Or a generic confirmation
            password: password // Send the actual password back (CAUTION: Security)
        });
    } catch (error) {
        console.error("❌ Error creating user login:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

module.exports = { createUserLogin };