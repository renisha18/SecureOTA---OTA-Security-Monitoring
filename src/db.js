require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Klrahulreni@1801',
  database: process.env.DB_NAME || 'ota_log_analyzer',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
