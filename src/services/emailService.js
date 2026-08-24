// src/services/emailService.js

const nodemailer = require("nodemailer");
const crypto = require("crypto");

console.log("✅ emailService.js loaded");

const EMAIL_USER =
  process.env.EMAIL_USER;

const EMAIL_PASSWORD =
  process.env.EMAIL_PASSWORD;

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "SM Kalyana Sakha";

const EMAIL_PASSWORD_FINGERPRINT =
  EMAIL_PASSWORD
    ? crypto
        .createHash("sha256")
        .update(EMAIL_PASSWORD)
        .digest("hex")
        .substring(0, 8)
    : "missing";

console.log(
  "[EmailService] Configuration:",
  {
    userConfigured: Boolean(EMAIL_USER),
    passwordConfigured: Boolean(EMAIL_PASSWORD),
    from: EMAIL_FROM
  }
);

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