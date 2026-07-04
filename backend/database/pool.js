/**
 * Database Connection Pool Setup
 * 
 * Provides unified interface to PostgreSQL.
 * If credentials are not set or database is unreachable, 
 * falls back to in-memory/static data mode to keep application running.
 */

require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let isInMemoryMode = false;
let dbStartupError = null;

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'real_estate_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Check if credentials are set
if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
    console.warn('\n⚠️  Database environment variables missing. Falling back to IN-MEMORY MODE.');
    isInMemoryMode = true;
} else {
    try {
        pool = new Pool(dbConfig);

        pool.on('connect', () => {
            console.log('✅ Database connection established successfully.');
        });

        pool.on('error', (err) => {
            console.error('❌ Database connection pool error:', err);
        });
    } catch (e) {
        dbStartupError = e.message;
        isInMemoryMode = true;
        console.error('❌ Database pool initialization failed:', e);
    }
}

/**
 * Executes an SQL query against the active PostgreSQL pool.
 * @param {string} text - SQL Query String
 * @param {Array} params - Query Parameters
 */
async function query(text, params) {
    if (isInMemoryMode) {
        throw new Error('Database is in in-memory fallback mode. Direct queries not available.');
    }
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`Executed query in ${duration}ms (Rows: ${res.rowCount})`);
        return res;
    } catch (error) {
        // Check for common database connection failure codes
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message.includes('connect')) {
            console.warn('\n⚠️  Database connection failed. Dynamically switching to IN-MEMORY MODE.');
            isInMemoryMode = true;
        }
        console.error('Database query execution error:', error);
        throw error;
    }
}

/**
 * Fetches a single record from SQL query results.
 */
async function getOne(text, params) {
    const result = await query(text, params);
    return result.rows[0] || null;
}

/**
 * Fetches multiple records from SQL query results.
 */
async function getAll(text, params) {
    const result = await query(text, params);
    return result.rows;
}

module.exports = {
    pool,
    query,
    getOne,
    getAll,
    isInMemoryMode: () => isInMemoryMode,
    getStartupError: () => dbStartupError,
    setInMemoryMode: (val) => { isInMemoryMode = val; }
};
