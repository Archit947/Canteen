const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',      // Replace with your MySQL username
  password: process.env.DB_PASSWORD || 'Archit947', // Replace with your MySQL password
  database: process.env.DB_NAME || 'canteen_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = db;