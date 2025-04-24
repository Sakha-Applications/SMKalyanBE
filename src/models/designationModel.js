// src/models/designationModel.js
const pool = require("../config/db");

// Fetch all Designation options
const getDesignationList = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT id, DesignationName, ProfessionId FROM Designation WHERE IsActive = TRUE ORDER BY DesignationName ASC"
    );
    console.log(`Total designations fetched: ${rows.length}`);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching Designation list:", error);
    throw error;
  }
};

// Fetch designations by profession ID
const getDesignationsByProfession = async (professionId) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, DesignationName FROM Designation WHERE ProfessionId = ? AND IsActive = TRUE ORDER BY DesignationName ASC",
      [professionId]
    );
    console.log(`Designations for profession ID ${professionId} fetched: ${rows.length}`);
    return rows;
  } catch (error) {
    console.error(`❌ Error fetching designations for profession ID ${professionId}:`, error);
    throw error;
  }
};

// Search designations by partial match and profession ID
const searchDesignation = async (searchTerm, professionId = null) => {
  try {
    let query = "SELECT id, DesignationName, ProfessionId FROM Designation WHERE DesignationName LIKE ? AND IsActive = TRUE";
    let params = [`%${searchTerm}%`];  // Changed to search anywhere in the name, not just prefix
    
    if (professionId) {
      query += " AND ProfessionId = ?";
      params.push(professionId);
    }
    
    query += " ORDER BY DesignationName ASC LIMIT 15";
    
    const [rows] = await pool.query(query, params);
    console.log(`Designation options matching '${searchTerm}' ${professionId ? `for profession ${professionId} ` : ''}fetched: ${rows.length}`);
    return rows;
  } catch (error) {
    console.error(`❌ Error searching Designation with term '${searchTerm}':`, error);
    throw error;
  }
};

// Get designation by ID
const getDesignationById = async (id) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, DesignationName, ProfessionId FROM Designation WHERE id = ? AND IsActive = TRUE",
      [id]
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (error) {
    console.error(`❌ Error fetching designation with ID ${id}:`, error);
    throw error;
  }
};

module.exports = { 
  getDesignationList,
  getDesignationsByProfession,
  searchDesignation,
  getDesignationById
};