/**
 * ==========================================
 * FIREBASE CONFIGURATION
 * ==========================================
 * 
 * Initializes Firebase Admin SDK for backend use
 * Provides Firestore and Auth instances
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK initialization
const initializeFirebase = () => {
    try {
        // Check if already initialized
        if (admin.apps.length > 0) {
            console.log('✅ Firebase already initialized');
            return;
        }

        // Initialize with service account credentials from environment
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        throw error;
    }
};

// Initialize Firebase
initializeFirebase();

// Export Firebase services
const db = admin.firestore();
const auth = admin.auth();

// Firestore settings for better performance
db.settings({
    ignoreUndefinedProperties: true
});

module.exports = {
    admin,
    db,
    auth
};
