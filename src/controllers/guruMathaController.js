const { getGuruMathaList, searchGuruMatha } = require("../models/guruMathaModel");

// Controller to handle get request for guru matha options
const getGuruMatha = async (req, res) => {
  console.log("getGuruMatha: Request received at /api/guru-matha"); // Debug: Request received
  
  try {
    // Check if search term is provided
    const searchTerm = req.query.search;
    let guruMathaOptions;
    
    if (searchTerm) {
      console.log(`getGuruMatha: Searching for options with term: '${searchTerm}'`);
      guruMathaOptions = await searchGuruMatha(searchTerm);
    } else {
      guruMathaOptions = await getGuruMathaList();
    }
    
    console.log("getGuruMatha: Data retrieved:", guruMathaOptions); // Debug: Data before response
    
    if (!guruMathaOptions) {
      console.warn("getGuruMatha: Query returned null or undefined");
      return res.status(500).json({ error: "Failed to retrieve GuruMatha options from database" });
    }
    
    if (!Array.isArray(guruMathaOptions)) {
      console.warn("getGuruMatha: Query did not return an array. Check the model.");
      return res.status(500).json({error: "Data is not an array"});
    }
    
    res.status(200).json(guruMathaOptions);
    console.log("getGuruMatha: Response sent with status 200");
  } catch (error) {
    console.error("❌ Error in getGuruMatha controller:", error);
    res.status(500).json({ error: "Failed to fetch GuruMatha list: " + error.message });
  }
};

module.exports = { getGuruMatha };