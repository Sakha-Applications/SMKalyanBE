const UserLogin = require("../models/userLoginModel");

const bcrypt = require('bcryptjs'); // Add this at the top

const createUserLogin = async (req, res) => {
    try {
        const { profileId, user_id, password, role, is_active, notes } = req.body;

        if (!profileId || !user_id || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Hash the password before storing
const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

        const result = await UserLogin.create({
    profileId,
    user_id,
    password: hashedPassword, // Store hashed password
    role: role || 'USER',
    is_active: is_active || 'Yes',
    notes: notes || null
});

        res.status(201).json({
            message: "User login created successfully",
            userId: result.user_id
        });
    } catch (error) {
        console.error("❌ Error creating user login:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

module.exports = { createUserLogin };