// src/config.js

const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  photoBaseUrl: process.env.REACT_APP_PHOTO_BASE_URL || 'http://localhost:3001'
};

// Add some debugging to help diagnose API URL issues
console.log("Config loaded with:", {
  apiUrl: config.apiUrl,
  photoBaseUrl: config.photoBaseUrl,
  nodeEnv: process.env.NODE_ENV,
  rawApiUrl: process.env.REACT_APP_API_URL
});

module.exports = config;