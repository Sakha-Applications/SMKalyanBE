// src/config.js or config.js (depending on your backend structure)

const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3001/api',
  photoBaseUrl: process.env.PHOTO_BASE_URL || 'http://localhost:3001',
  // Add any other backend-specific configuration here
};

module.exports = config;