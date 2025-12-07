const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool with better error handling for remote connections
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'promotheans_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Better handling for remote connections (valid mysql2 options only)
  connectTimeout: 60000,      // 60 seconds to establish connection
  // Handle connection errors and reconnection
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Handle pool errors and connection issues
pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    // Only log if it's not a common connection reset (these are handled automatically)
    if (err.code !== 'PROTOCOL_CONNECTION_LOST' && err.code !== 'ECONNRESET') {
      console.error('Database connection error:', err.code, err.message);
    }
    // Connection resets are normal for remote databases - pool handles them automatically
  });
});

// Test connection (delayed - will be tested after database creation)
// The connection test is handled in initDatabase.js after the database is created

module.exports = pool;

