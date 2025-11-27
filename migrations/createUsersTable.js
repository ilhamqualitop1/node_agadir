// createUsersTable.js
const pool = require("../config/db");

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      firstname VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      otp_code VARCHAR(6),
      otp_expires TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("Table 'users' created successfully!");
  } catch (err) {
    console.error("Error creating 'users' table:", err);
  }
};

createUsersTable();

// // Assure-toi d'exporter la fonction
// module.exports = { createUsersTable };
