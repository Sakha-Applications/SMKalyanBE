// src/services/emailService.js
const nodemailer = require('nodemailer');
console.log("✅ emailService.js loaded");

// For a real implementation, you would use environment variables for these settings
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@example.com',
    pass: process.env.EMAIL_PASSWORD || 'your-password'
  }
});

const sendContactDetailsReport = async (recipientEmail, contactDetails) => {
  try {
    // Create HTML table for the contact details
    const tableRows = contactDetails.map(profile => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${profile.profile_id}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${profile.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${profile.profile_for}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${profile.age}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${profile.email}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${profile.phone_number}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${profile.gotra}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
            }
            th {
              background-color: #f2f2f2;
            }
            .report-header {
              text-align: center;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h2>Contact Details Report</h2>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Profile ID</th>
                <th>Name</th>
                <th>Profile For</th>
                <th>Age</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Gotra</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Profile Connect" <noreply@example.com>',
      to: recipientEmail,
      subject: 'Contact Details Report',
      html: htmlContent,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

module.exports = { sendContactDetailsReport };