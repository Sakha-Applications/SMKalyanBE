// src/models/contactDetailsModel.js
const pool = require("../config/db");
console.log("✅ contactDetailsModel.js loaded");

const findContactDetails = async ({ profileId, profileFor, minAge, maxAge, gotra }) => {
  try {
    let query = `
      SELECT 
        *
      FROM profile 
      WHERE 1=1
    `;
    
    let values = [];

    // Add search conditions
    if (profileId) {
      query += ` AND profile_id = ?`;
      values.push(profileId);
    }

    if (profileFor) {
      query += ` AND profile_for = ?`;
      values.push(profileFor);
    }

    if (minAge && maxAge) {
      query += ` AND current_age BETWEEN ? AND ?`;
      values.push(parseInt(minAge), parseInt(maxAge));
    } else if (minAge) {
      query += ` AND current_age >= ?`;
      values.push(parseInt(minAge));
    } else if (maxAge) {
      query += ` AND current_age <= ?`;
      values.push(parseInt(maxAge));
    }

    if (gotra) {
      query += ` AND gotra = ?`;
      values.push(gotra);
    }

    query += " ORDER BY current_age ASC";

    console.log("Executing query:", query, "with values:", values);
    
    const [rows] = await pool.execute(query, values);
    return rows;
  } catch (error) {
    console.error("❌ Error finding contact details in model:", error);
    throw error;
  }
};

module.exports = { findContactDetails };