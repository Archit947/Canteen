const { Pool } = require('pg');

// Supabase/PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING,
  // Alternative: use individual connection parameters if DATABASE_URL is not provided
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  user: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Wrapper to convert MySQL-style callback queries to PostgreSQL
// Converts ? placeholders to $1, $2, $3, etc.
const db = {
  query: (sql, params, callback) => {
    if (!callback && typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    // Convert MySQL ? placeholders to PostgreSQL $1, $2, $3 format
    let paramIndex = 1;
    let convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    // For INSERT queries, add RETURNING id if not present
    const sqlUpper = sql.trim().toUpperCase();
    if (sqlUpper.startsWith('INSERT INTO') && !sqlUpper.includes('RETURNING')) {
      // Extract table name and add RETURNING id
      const tableMatch = sql.match(/INSERT INTO\s+(\w+)/i);
      if (tableMatch) {
        convertedSql = convertedSql + ' RETURNING id';
      }
    }
    
    pool.query(convertedSql, params || [], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      
      // For SELECT queries, return rows array (MySQL style)
      if (sqlUpper.startsWith('SELECT')) {
        return callback(null, result.rows);
      }
      
      // Convert PostgreSQL result format to MySQL-like format for compatibility
      const mysqlLikeResult = {
        insertId: result.rows[0]?.id || null,
        affectedRows: result.rowCount || 0,
        rows: result.rows,
        length: result.rows.length,
      };
      
      // Spread first row properties for backward compatibility
      if (result.rows[0]) {
        Object.assign(mysqlLikeResult, result.rows[0]);
      }
      
      callback(null, mysqlLikeResult);
    });
  },
  
  // Direct access to pool for advanced queries
  pool: pool
};

module.exports = db;
