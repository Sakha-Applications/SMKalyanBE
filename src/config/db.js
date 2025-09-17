//db.js
const mysql = require('mysql2/promise'); // Ensure you're using the promise API
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,         // e.g., 'your-server.mysql.database.azure.com'
    user: process.env.DB_USER,         // e.g., 'admin@your-server'
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // default MySQL port
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: false,
    multipleStatements: true
    //     rejectUnauthorized: true         // Optional: depends on your Azure settings
    // }
});
console.log(" Host for DB is");
 console.log(process.env.DB_HOST);
console.log("DB Name is ");
console.log(process.env.DB_NAME);
console.log("✅ Database pool created");

module.exports = pool; // Export the pool directly
