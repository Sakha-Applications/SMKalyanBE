// src/backend/models/MatchProfileModel.js

const pool = require("../config/db");
const mysql = require('mysql2'); // at top
console.log("✅ MatchProfileModel.js loaded");

/**
 * Converts a height string like "5'7"" to total inches.
 */
const convertHeightToInches = (heightStr) => {
    if (!heightStr || typeof heightStr !== 'string') return null;
    const parts = heightStr.match(/^(\d+)'(\d+)"$/);
    if (parts && parts.length === 3) {
        const feet = parseInt(parts[1], 10);
        const inches = parseInt(parts[2], 10);
        if (!isNaN(feet) && !isNaN(inches)) {
            return (feet * 12) + inches;
        }
    }
    return null;
};

/**
 * Parses an income range string like "₹25 to ₹50 Lakh" to extract min/max values.
 */
const parseAnnualIncomeRange = (incomeStr) => {
    if (!incomeStr || typeof incomeStr !== 'string') return null;

    const numericMatch = incomeStr.match(/₹(\d+) (?:to ₹(\d+))? Lakh/);
    if (numericMatch) {
        let min = parseInt(numericMatch[1], 10);
        let max = numericMatch[2] ? parseInt(numericMatch[2], 10) : min;

        if (incomeStr.includes("Below")) {
            return { min: 0, max: min };
        } else if (incomeStr.includes("Above")) {
            return { min: min, max: 999999 };
        }
        return { min, max };
    } else if (incomeStr.includes("Above ₹1 Crore")) {
        return { min: 100, max: 999999 };
    }

    return null;
};

/**
 * Finds profiles matching the given preferences.
 */
// Replace the entire existing `findMatchingProfiles` with this version:
const findMatchingProfiles = async (preferredCriteria, loggedInUserProfileId, db) => {
  try {
    let query = `
      SELECT 
        profile_id,
        name,
        mother_tongue,
        gotra,
        current_age
      FROM profile
      WHERE profile_id != ?
        AND profile_for != ?
    `;
    const values = [loggedInUserProfileId, preferredCriteria.preferredProfileFor];

    const addInCondition = (column, list) => {
      if (Array.isArray(list) && list.length > 0) {
        query += ` AND ${column} IN (${list.map(() => '?').join(',')})`;
        values.push(...list);
      }
    };

    addInCondition('gotra', preferredCriteria.preferredGotras);
    addInCondition('mother_tongue', preferredCriteria.preferredMotherTongues);
    addInCondition('sub_caste', preferredCriteria.preferredSubCastes);
    addInCondition('guru_matha', preferredCriteria.preferredGuruMathas);
   // addInCondition('nakshatra', preferredCriteria.preferredNakshatras);
   // addInCondition('rashi', preferredCriteria.preferredRashis);
    addInCondition('native_place', preferredCriteria.preferredNativeOrigins);
    addInCondition('current_location', preferredCriteria.preferredCities);
    addInCondition('country_living_in', preferredCriteria.preferredCountries);
    addInCondition('profession', preferredCriteria.preferredProfessions);
    addInCondition('education', preferredCriteria.preferredEducation);
    addInCondition('diet', preferredCriteria.preferredDiet ? [preferredCriteria.preferredDiet] : []);
   // addInCondition('hobbies', preferredCriteria.preferredHobbies);
   // addInCondition('married_status', preferredCriteria.preferredMaritalStatus ? [preferredCriteria.preferredMaritalStatus] : []);

    query += ` ORDER BY current_age ASC`;

    console.log("✅ Final SQL:", mysql.format(query, values));

    const [rows] = await pool.execute(query, values);
    return rows;
  } catch (err) {
    console.error("❌ Error in findMatchingProfiles:", err);
    throw err;
  }
};


module.exports = { findMatchingProfiles };