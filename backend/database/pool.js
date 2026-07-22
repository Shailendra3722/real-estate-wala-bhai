/**
 * MongoDB Connection Setup
 *
 * Provides a small shared MongoDB client for the app models.
 * If MongoDB credentials are not set or Atlas is unreachable, the app keeps
 * running with the existing in-memory/static fallback data.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const dns = require('dns');

// Force Google DNS to bypass local ISP / firewall SRV resolution failures (ECONNREFUSED)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'real_estate_wala_bhai';

let client = null;
let database = null;
let isInMemoryMode = false;
let dbStartupError = null;
let connectionPromise = null;

async function ensureIndexes(db) {
    await Promise.all([
        db.collection('properties').createIndex({ id: 1 }, { unique: true }),
        db.collection('properties').createIndex({ status: 1, createdAt: -1 }),
        db.collection('properties').createIndex({ city: 1, area: 1 }),
        db.collection('properties').createIndex({ locationPoint: '2dsphere' }, { sparse: true }),
        db.collection('users').createIndex({ id: 1 }, { unique: true }),
        db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
        db.collection('favorites').createIndex({ userId: 1, propertyId: 1 }, { unique: true }),
        db.collection('inquiries').createIndex({ agentId: 1, createdAt: -1 }),
    ]);
}

if (!mongoUri) {
    console.warn('\nMongoDB environment variable MONGODB_URI is missing. Falling back to IN-MEMORY MODE.');
    isInMemoryMode = true;
} else {
    client = new MongoClient(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
    });

    connectionPromise = client.connect()
        .then(async () => {
            database = client.db(dbName);
            await ensureIndexes(database);
            console.log(`MongoDB connected successfully (${dbName}).`);
            return database;
        })
        .catch((error) => {
            dbStartupError = error.message;
            isInMemoryMode = true;
            console.error('MongoDB connection failed. Using in-memory fallback mode:', error.message);
            return null;
        });
}

async function connect() {
    if (isInMemoryMode) {
        throw new Error('Database is in in-memory fallback mode. Direct MongoDB access is not available.');
    }

    if (!database) {
        await connectionPromise;
    }

    if (!database || isInMemoryMode) {
        throw new Error(dbStartupError || 'MongoDB connection is not available.');
    }

    return database;
}

async function getCollection(name) {
    const db = await connect();
    return db.collection(name);
}

async function close() {
    if (client) {
        await client.close();
        client = null;
        database = null;
    }
}

module.exports = {
    client,
    connect,
    getCollection,
    close,
    isInMemoryMode: () => isInMemoryMode,
    getStartupError: () => dbStartupError,
    setInMemoryMode: (val) => { isInMemoryMode = val; },
};
