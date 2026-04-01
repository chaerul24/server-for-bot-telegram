require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ MySQL connected');

    db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(100),
        os VARCHAR(200) UNIQUE,
        status ENUM('online', 'offline'),
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        disconnected_at TIMESTAMP NULL
      )
    `, (err) => {
      if (err) {
        console.log('❌ Error create table:', err);
      } else {
        console.log('✅ Table clients ready');
      }
    });
  }
});

module.exports = db;