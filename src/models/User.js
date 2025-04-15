// backend/src/models/User.js
const { DataTypes } = require('sequelize');
console.log('Current working directory:', process.cwd());

const sequelize = require("../config/db"); // Adjust the path to your database configuration

console.log('Imported sequelize object in User.js:', sequelize); // Add this line

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true, // Assuming userId is your primary key
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Add other user fields as needed (e.g., registrationDate, profileDetails, etc.)
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'userlogin', // Make sure this matches your actual table name in MySQL
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = User;