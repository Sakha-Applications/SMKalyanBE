const pool = require("../config/db");

const createUser = async (name, age, email, phone) => {
    return pool.query("INSERT INTO users (name, age, email, phone ) VALUES ($1, $2, $3, $4) RETURNING *", [name, age, email, phone]);
};

const getUsers = async () => {
    return pool.query("SELECT * FROM users");
};

module.exports = { createUser, getUsers };
