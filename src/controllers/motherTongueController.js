const { getMotherTongueList, searchMotherTongues } = require("../models/motherTongueModel");

// Controller to handle get request for mother tongues
const getMotherTongues = async (req, res) => {
  console.log("getMotherTongues: Request received at /api/mother-tongues"); // Debug: Request received
  
  try {
    // Check if search term is provided
    const searchTerm = req.query.search;
    let motherTongues;
    
    if (searchTerm) {
      console.log(`getMotherTongues: Searching for languages with term: '${searchTerm}'`);
      motherTongues = await searchMotherTongues(searchTerm);
    } else {
      motherTongues = await getMotherTongueList();
    }
    
    console.log("getMotherTongues: Data retrieved:", motherTongues); // Debug: Data before response
    
    if (!motherTongues) {
      console.warn("getMotherTongues: Query returned null or undefined");
      return res.status(500).json({ error: "Failed to retrieve mother tongues from database" });
    }
    
    if (!Array.isArray(motherTongues)) {
      console.warn("getMotherTongues: Query did not return an array. Check the model.");
      return res.status(500).json({error: "Data is not an array"});
    }
    
    res.status(200).json(motherTongues);
    console.log("getMotherTongues: Response sent with status 200");
  } catch (error) {
    console.error("❌ Error in getMotherTongues controller:", error);
    res.status(500).json({ error: "Failed to fetch Mother Tongue list: " + error.message });
  }
};

module.exports = { getMotherTongues };