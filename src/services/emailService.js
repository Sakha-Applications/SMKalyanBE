// src/services/emailService.js
const nodemailer = require('nodemailer');
console.log("✅ emailService.js loaded");

// Configure the transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,       // Your Gmail address (e.g., smkalyanasakha@gmail.com)
        pass: process.env.EMAIL_PASSWORD  // Your Gmail app password
    }
});

const sendEmailReport = async (mailOptions) => {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

module.exports = { sendEmailReport };