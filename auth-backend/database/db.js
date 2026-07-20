/**
 * MongoDB connection helper for the legacy auth/simple API backend.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'real_estate_wala_bhai';

if (!mongoUri) {
    throw new Error('MONGODB_URI is required for the auth backend database connection.');
}

const client = new MongoClient(mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
});

let databasePromise = null;

async function connect() {
    if (!databasePromise) {
        databasePromise = client.connect()
            .then(async () => {
                const database = client.db(dbName);
                await Promise.all([
                    database.collection('properties').createIndex({ id: 1 }, { unique: true }),
                    database.collection('properties').createIndex({ status: 1, createdAt: -1 }),
                    database.collection('properties').createIndex({ locationPoint: '2dsphere' }, { sparse: true }),
                ]);
                console.log(`Connected to MongoDB database: ${dbName}`);
                return database;
            });
    }

    return databasePromise;
}

async function getCollection(name) {
    const database = await connect();
    return database.collection(name);
}

async function close() {
    await client.close();
    databasePromise = null;
}

module.exports = {
    connect,
    getCollection,
    collection: getCollection,
    close,
};
