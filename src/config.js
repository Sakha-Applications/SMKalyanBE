// src/config.js

const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://sakhasvc-agfcdyb7bjarbtdw.centralus-01.azurewebsites.net/api/',
  photoBaseUrl: process.env.REACT_APP_PHOTO_BASE_URL || 'https://sakhasvc-agfcdyb7bjarbtdw.centralus-01.azurewebsites.net'
};

// Add some debugging to help diagnose API URL issues
console.log("Config loaded with:", {
  apiUrl: config.apiUrl,
  photoBaseUrl: config.photoBaseUrl,
  nodeEnv: process.env.NODE_ENV,
  rawApiUrl: process.env.REACT_APP_API_URL
});

module.exports = config;