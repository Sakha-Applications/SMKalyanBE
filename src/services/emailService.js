// src/services/emailService.js

const nodemailer = require("nodemailer");

console.log("✅ emailService.js loaded");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "SM Kalyana Sakha";

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error(
      "Email configuration missing. EMAIL_USER and EMAIL_PASSWORD are required."
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  return transporter;
};


const sendEmailReport = async ({
  to,
  subject,
  text,
  html
}) => {
  if (!to) {
    throw new Error(
      "Email recipient is required."
    );
  }

  const mailTransporter =
    getTransporter();

  const mailOptions = {
    from: `"${EMAIL_FROM}" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info =
      await mailTransporter.sendMail(
        mailOptions
      );

    console.log(
      "✅ Email sent:",
      info.messageId
    );

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(
      "❌ Failed to send email:",
      error
    );

    throw error;
  }
};

module.exports = {
  sendEmailReport
};