const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test_sql',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let isConnected = false;

try {
  pool = mysql.createPool(dbConfig);
  // Test connection
  pool.getConnection()
    .then(conn => {
      console.log(`✅ Connected to MySQL Database "${dbConfig.database}" successfully!`);
      isConnected = true;
      conn.release();
    })
    .catch(err => {
      console.warn('⚠️ MySQL connection test failed (' + err.message + ').');
      isConnected = false;
    });
} catch (error) {
  isConnected = false;
  console.warn('⚠️ MySQL init error:', error.message);
}

module.exports = {
  pool,
  isDbConnected: () => isConnected
};
