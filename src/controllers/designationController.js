// src/controllers/designationController.js
const { 
    getDesignationList, 
    getDesignationsByProfession, 
    searchDesignation,
    getDesignationById
  } = require("../models/designationModel");
  
  // Controller to handle get request for designation options
  const getDesignation = async (req, res) => {
    console.log("getDesignation: Request received at /api/designation"); // Debug: Request received
    
    try {
      // Check if specific ID is requested
      const designationId = req.query.id;
      if (designationId) {
        const designation = await getDesignationById(designationId);
        if (!designation) {
          return res.status(404).json({ error: "Designation not found" });
        }
        return res.status(200).json(designation);
      }
      
      // Check if search term or profession ID is provided
      const searchTerm = req.query.search;
      const professionId = req.query.professionId; 
      let designationOptions;
      
      if (professionId) {
        // If profession ID is provided, get designations for that profession
        if (searchTerm) {
          console.log(`getDesignation: Searching for options with term: '${searchTerm}' for profession ID: ${professionId}`);
          designationOptions = await searchDesignation(searchTerm, professionId);
        } else {
          console.log(`getDesignation: Getting all designations for profession ID: ${professionId}`);
          designationOptions = await getDesignationsByProfession(professionId);
        }
      } else if (searchTerm) {
        // If only search term is provided
        console.log(`getDesignation: Searching for options with term: '${searchTerm}'`);
        designationOptions = await searchDesignation(searchTerm);
      } else {
        // If neither search term nor profession ID is provided, get all designations
        designationOptions = await getDesignationList();
      }
      
      console.log(`getDesignation: Data retrieved: ${designationOptions.length} items`); // Debug: Data before response
      
      if (!designationOptions) {
        console.warn("getDesignation: Query returned null or undefined");
        return res.status(500).json({ error: "Failed to retrieve Designation options from database" });
      }
      
      if (!Array.isArray(designationOptions)) {
        console.warn("getDesignation: Query did not return an array. Check the model.");
        return res.status(500).json({error: "Data is not an array"});
      }
      
      res.status(200).json(designationOptions);
      console.log(`getDesignation: Response sent with status 200 and ${designationOptions.length} items`);
    } catch (error) {
      console.error("❌ Error in getDesignation controller:", error);
      res.status(500).json({ error: "Failed to fetch Designation list: " + error.message });
    }
  };
  
  module.exports = { getDesignation };