const { getNativePlaceList, searchNativePlaces } = require("../models/nativePlaceModel");

// Controller to handle get request for native places
const getNativePlaces = async (req, res) => {
  console.log("getNativePlaces: Request received at /api/native-places"); // Debug: Request received
  
  try {
    // Check if search term is provided
    const searchTerm = req.query.search;
    let nativePlaces;
    
    if (searchTerm) {
      console.log(`getNativePlaces: Searching for places with term: '${searchTerm}'`);
      nativePlaces = await searchNativePlaces(searchTerm);
    } else {
      nativePlaces = await getNativePlaceList();
    }
    
    console.log("getNativePlaces: Data retrieved:", nativePlaces); // Debug: Data before response
    
    if (!nativePlaces) {
      console.warn("getNativePlaces: Query returned null or undefined");
      return res.status(500).json({ error: "Failed to retrieve native places from database" });
    }
    
    if (!Array.isArray(nativePlaces)) {
      console.warn("getNativePlaces: Query did not return an array. Check the model.");
      return res.status(500).json({error: "Data is not an array"});
    }
    
    res.status(200).json(nativePlaces);
    console.log("getNativePlaces: Response sent with status 200");
  } catch (error) {
    console.error("❌ Error in getNativePlaces controller:", error);
    res.status(500).json({ error: "Failed to fetch Native Place list: " + error.message });
  }
};

module.exports = { getNativePlaces };