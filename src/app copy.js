        const express = require("express");
        const cors = require("cors");
        const bodyParser = require("body-parser");
        const userRoutes = require("./routes/userRoutes");
        const profileRoutes = require("./routes/profileRoutes"); // Import profile routes
        const gotraRoutes = require("./routes/gotraRoutes");
        const rashiRoutes = require("./routes/rashiRoutes");
        const nakshatraRoutes = require("./routes/nakshatraRoutes");
        const profilesearchRoutes = require("./routes/profilesearchRoutes"); // Import profile search routes
        const uploadSearchRoutes = require("./routes/uploadSearchRoute");
        const testRoutes = require('./routes/test');
        const userLoginRoutes = require("./routes/userLoginRoutes"); // Import user login routes
        console.log('Loading auth routes...');
    
        const authRoutes = require('./routes/authRoutes');
        console.log('Auth routes loaded:', Object.keys(authRoutes));
// Import the new forgot password routes
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
console.log('Forgot Password routes loaded:', Object.keys(forgotPasswordRoutes));

const uploadPhotosRoutes = require("./routes/uploadPhotosRoutes");
// const photoRoutes = require('./routes/photoRoutes'); // Updated

const modifyProfileRoutes = require('./routes/modifyProfileRoutes'); //  <--  Correct path
console.log('Modify Profile routes loaded:', Object.keys(modifyProfileRoutes));






        require("dotenv").config();

        const app = express();

        // Middleware
        app.use(cors());
        app.use(bodyParser.json());

        // Routes
        app.use("/api", userRoutes);
        app.use("/api", userLoginRoutes); // Add user login routes

        app.use('/api', authRoutes);
        console.log('Auth routes registered!');
// Mount the new forgot password routes
app.use('/api', forgotPasswordRoutes);
console.log('Forgot Password routes registered!');

        app.use("/api", profileRoutes); // Add profile routes
        // Register Routes
        app.use("/api", gotraRoutes);
        app.use("/api", rashiRoutes);
        app.use("/api", nakshatraRoutes);
        app.use("/api", profilesearchRoutes); // Add profile search routes
        app.use("/api", uploadSearchRoutes);
        console.log("⚙️ Mounting uploadSearchRoutes under /api"); // Ensure this kind of log exists

        app.use("/api", uploadPhotosRoutes);
       //  app.use('/api', photoRoutes); // Updated
console.log("⚙️ Mounting uploadPhotosRoutes under /api");
        app.use('/test', testRoutes);

        app.use('/api', modifyProfileRoutes); //  <--  Mount it under /api or whatever base path you use
        console.log('Modify Profile routes mounted under /api');

        module.exports = app;   
