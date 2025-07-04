const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const gotraRoutes = require("./routes/gotraRoutes");
const rashiRoutes = require("./routes/rashiRoutes");
const nakshatraRoutes = require("./routes/nakshatraRoutes");
const profilesearchRoutes = require("./routes/profilesearchRoutes");
const advancedSearchRoutes = require('./routes/advancedsearchRoutes');
const uploadSearchRoutes = require("./routes/uploadSearchRoute");
const contactDetailsRoutes = require("./routes/contactDetailsRoutes"); // Add this line
const testRoutes = require('./routes/test');
const userLoginRoutes = require("./routes/userLoginRoutes");
const authRoutes = require('./routes/authRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const uploadPhotosRoutes = require("./routes/uploadPhotosRoutes");
const modifyProfileRoutes = require('./routes/modifyProfileRoutes');
const motherTongueRoutes = require("./routes/motherTongueRoutes");
const nativePlaceRoutes = require("./routes/nativePlaceRoutes"); // Add this line
const path = require('path');
// Import the profession routes
const professionRoutes = require("./routes/professionRoutes");

const matchProfilesRoutes = require('./routes/matchProfilesRoutes'); 
// Add this to your app.js file
const offlinePaymentRoutes = require("./routes/offlinePaymentRoutes");

// In your main server file (e.g., server.js or index.js)
const designationRoutes = require("./routes/designationRoutes");

const educationRoutes = require('./routes/educationRoutes'); // Adjust the path if needed

const preferredProfileRoutes = require('./routes/preferredProfileRoutes');

const guruMathaRoutes = require("./routes/guruMathaRoutes");
// const paymentRoutes = require('./routes/paymentRoutes'); // Import payment routes

// NEW: Import InvitationRoutes
const invitationRoutes = require('./routes/InvitationRoutes'); // <--- ADD THIS LINE

require("dotenv").config();

// Import the new direct update routes
const directUpdateRoutes = require('./routes/directUpdateRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Define the absolute path to your static files directory
const photosDirectory = path.join('D:', '1. Data', '1. Personal DOcument', 'Self Study', 'NewGenApp', 'SMKalyanUI', 'ProfilePhotos');

// Serve static files from the specified directory at the '/ProfilePhotos' route
app.use('/ProfilePhotos', express.static(photosDirectory));
console.log('Static files served from:', photosDirectory, 'at route /ProfilePhotos');

// Routes
app.use("/api", userRoutes);
app.use("/api", userLoginRoutes);
app.use('/api', authRoutes);
app.use('/api', forgotPasswordRoutes);
app.use("/api", profileRoutes);
app.use("/api", gotraRoutes);
app.use("/api", rashiRoutes);
app.use("/api", nakshatraRoutes);
app.use("/api", profilesearchRoutes);
app.use("/api", uploadSearchRoutes);
app.use("/api", advancedSearchRoutes); // Use the new routes
app.use("/api", uploadPhotosRoutes);
app.use("/api", contactDetailsRoutes); // Add this line
app.use('/test', testRoutes);
app.use('/api', modifyProfileRoutes);
app.use("/api", nativePlaceRoutes); // Add this line
//app.use('/api', paymentRoutes); // Use the payment routes
app.use("/api", motherTongueRoutes);
// Add this line with your other app.use statements
app.use("/api", guruMathaRoutes);

// Use the profession routes
app.use("/api", professionRoutes);

app.use("/api", matchProfilesRoutes);

// Add this with your other app.use statements
app.use("/api", offlinePaymentRoutes);

// Add this with your other route usages
app.use("/api", designationRoutes);

// Add this line with your other route declarations
app.use('/api/preferred-profiles', preferredProfileRoutes);

app.use('/api', educationRoutes);

// NEW: Use the InvitationRoutes
app.use('/api', invitationRoutes); // <--- ADD THIS LINE

// Add this line with your other route middleware (after your existing routes)
app.use('/api/direct', directUpdateRoutes);

console.log('Contact Details routes mounted under /api'); // Add this log

module.exports = app;