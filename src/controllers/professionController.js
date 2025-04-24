const { getProfessionList, searchProfession } = require("../models/professionModel");

// Controller to handle get request for profession options
const getProfession = async (req, res) => {
  console.log("getProfession: Request received at /api/profession"); // Debug: Request received
  
  try {
    // Check if search term is provided
    const searchTerm = req.query.search;
    let professionOptions;
    
    if (searchTerm) {
      console.log(`getProfession: Searching for options with term: '${searchTerm}'`);
      professionOptions = await searchProfession(searchTerm);
    } else {
      professionOptions = await getProfessionList();
    }
    
    console.log("getProfession: Data retrieved:", professionOptions); // Debug: Data before response
    
    if (!professionOptions) {
      console.warn("getProfession: Query returned null or undefined");
      return res.status(500).json({ error: "Failed to retrieve Profession options from database" });
    }
    
    if (!Array.isArray(professionOptions)) {
      console.warn("getProfession: Query did not return an array. Check the model.");
      return res.status(500).json({error: "Data is not an array"});
    }
    
    res.status(200).json(professionOptions);
    console.log("getProfession: Response sent with status 200");
  } catch (error) {
    console.error("❌ Error in getProfession controller:", error);
    res.status(500).json({ error: "Failed to fetch Profession list: " + error.message });
  }
};

module.exports = { getProfession };