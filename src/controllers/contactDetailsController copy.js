// src/controllers/contactDetailsController.js
const contactDetailsModel = require("../models/contactDetailsModel");
console.log("✅ contactDetailsController.js loaded");

const getContactDetails = async (req, res) => {
  console.log("🔍 getContactDetails function is being called with body:", req.body);
  
  try {
    const { profileId, profileFor, minAge, maxAge, gotra } = req.body;
    
    // Validate token here if needed
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) return res.status(401).json({ message: 'Unauthorized access' });
    
    const results = await contactDetailsModel.findContactDetails({ 
      profileId, 
      profileFor, 
      minAge, 
      maxAge, 
      gotra 
    });
    
    console.log("Backend Controller: Contact Details Results:", results);
    res.json(results);
    
  } catch (error) {
    console.error("❌ Error fetching contact details:", error);
    res.status(500).json({ message: "Failed to fetch contact details." });
  }
};

// For sending email reports - You can implement this later
const sendEmailReport = async (req, res) => {
  console.log("📧 sendEmailReport function is being called with body:", req.body);
  
  try {
    const { email, subject, data } = req.body;
    
    // Here you would implement the email sending logic
    // This is a placeholder for now
    console.log(`Email would be sent to: ${email}`);
    
    // Simulate success
    setTimeout(() => {
      res.json({ success: true, message: "Email sent successfully" });
    }, 1000);
    
  } catch (error) {
    console.error("❌ Error sending email report:", error);
    res.status(500).json({ message: "Failed to send email report." });
  }
};

module.exports = { getContactDetails, sendEmailReport };