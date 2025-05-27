// src/services/emailService.js
const nodemailer = require('nodemailer');
console.log("✅ emailService.js loaded (HARD-CODED MODE)");

// ❗️Hardcoded credentials (for testing only — DO NOT use in production)
const EMAIL_USER = "smkalyanasakha@gmail.com";               // Replace with your actual Gmail address
const EMAIL_PASSWORD = "ksvi cuyy szef fbgi";     
const EMAIL_FROM="SM Kalyana Sakha";       // Replace with your Gmail App Password

// Log environment variable status (DO NOT log actual values in production)
console.log("📦 EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Missing");
console.log("📦 EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "✅ Set" : "❌ Missing");

let transporter;

try {
    transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Verify the connection configuration
    transporter.verify((error, success) => {
        if (error) {
            console.error("❌ Transporter verification failed:", error);
        } else {
            console.log("✅ Transporter verified successfully. Ready to send emails.");
        }
    });

} catch (err) {
    console.error("❌ Error creating transporter:", err);
}

const sendEmailReport = async (mailOptions) => {
    console.log("📤 Preparing to send email with the following options:");
    console.log("  ➤ From:", mailOptions.from);
    console.log("  ➤ To:", mailOptions.to);
    console.log("  ➤ Subject:", mailOptions.subject);

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        throw error;
    }
};

module.exports = { sendEmailReport };
