const { createUser, getUsers } = require("../models/userModel");

exports.addUser = async (req, res) => {
    const { name, age, email, phone } = req.body;
    try {
        const result = await createUser(name, age,email, phone);
        res.json({ message: "User added successfully!", user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error adding user" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const result = await getUsers();
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching users" });
    }
};
