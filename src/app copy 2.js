// backend/src/app.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const gotraRoutes = require("./routes/gotraRoutes");
const rashiRoutes = require("./routes/rashiRoutes");
const nakshatraRoutes = require("./routes/nakshatraRoutes");
const profilesearchRoutes = require("./routes/profilesearchRoutes");
const uploadSearchRoutes = require("./routes/uploadSearchRoute");
const testRoutes = require('./routes/test');
const userLoginRoutes = require("./routes/userLoginRoutes");
const authRoutes = require('./routes/authRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const uploadPhotosRoutes = require("./routes/uploadPhotosRoutes");
const modifyProfileRoutes = require('./routes/modifyProfileRoutes'); // Correct path

require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
app.use("/api", uploadPhotosRoutes);
app.use('/test', testRoutes);
app.use('/api', modifyProfileRoutes); // Mount modifyProfileRoutes
console.log('Modify Profile routes mounted under /api');



module.exports = app;