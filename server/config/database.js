// server/database.js

import sql from 'mssql';
import config from './config.js'; // Correct path to your config

// Configuration for the mssql package
const dbConfig = {
  user: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  server: config.DB_SERVER,
  database: config.DB_DATABASE,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 60000
  },
  options: {
    encrypt: true, // Use this for Azure or if you're on a secure connection
    trustServerCertificate: config.DB_TRUST_CERT.toLowerCase() === 'yes'
  },
  requestTimeout: 60000 // 60 seconds
};

// Create a single, shared connection pool
const pool = new sql.ConnectionPool(dbConfig);
let poolConnection = null; // This will hold the connection promise

/**
 * Connects to the database.
 * This should be called once when the server starts.
 */
export const connectToDb = async () => {
  if (poolConnection) {
    return poolConnection; // If already connecting/connected, return the promise
  }

  try {
    console.log('Attempting to connect to MSSQL...');
    poolConnection = pool.connect(); // Start connecting
    await poolConnection; // Wait for the connection to be established
    console.log('Successfully connected to MSSQL database!');
    return poolConnection;
  } catch (err) {
    console.error('Database connection failed:', err);
    poolConnection = null; // Reset on failure
    process.exit(1); // Exit the application if the DB connection fails on start
  }
};

/**
 * Test connection to the database
 */
export const testConnection = async () => {
  try {
    const request = pool.request();
    const result = await request.query('SELECT 1 AS test');
    if (result.recordset[0].test === 1) {
      console.log('Database test query successful!');
      return true;
    }
  } catch (err) {
    console.error('Error testing database connection:', err);
    return false;
  }
};

// Export the pool and the sql object for use in routes
export { sql, pool };