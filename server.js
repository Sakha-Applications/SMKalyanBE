console.log(__filename);
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = require("./src/app");

const PORT = process.env.PORT || 3001;

// Define consistent upload directory path
const UPLOAD_DIR = path.join(__dirname, '../SMKalyanUI/profilePhotos');
console.log('Static files directory for photos:', UPLOAD_DIR);

// Create directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created uploads directory at: ${UPLOAD_DIR}`);
}

// Configure static file serving for the upload directory
app.use('/profilePhotos', express.static(UPLOAD_DIR));
console.log('Static route configured: /profilePhotos -> ', UPLOAD_DIR);

// Optional test route to verify file access
app.get('/test-photo-access', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to read photos directory',
                details: err.message,
                path: UPLOAD_DIR
            });
        }

        res.json({
            message: 'Photos directory access successful',
            path: UPLOAD_DIR,
            photoCount: files.length,
            sampleFiles: files.slice(0, 10)
        });
    });
});

// Allow CORS for development (adjust for production)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Access photos at: http://localhost:${PORT}/profilePhotos/[filename]`);
});