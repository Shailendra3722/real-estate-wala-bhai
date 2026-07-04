/**
 * Firebase Configuration - Real Estate Wala Bhai
 * Connected to: real-estate-wala-bhai (Firebase project)
 * Database: Firestore (asia-south1 / Mumbai)
 * Auth: Email/Password enabled
 */

// Firebase SDK imports (using CDN modules delivered inline via compat layer)
// We use the compat (v8-style) SDK so it works in plain HTML without a bundler

// Firebase App config
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBUtFArSsfELffE1sIyn1lcSjdsq_LF104",
    authDomain: "real-estate-wala-bhai.firebaseapp.com",
    projectId: "real-estate-wala-bhai",
    storageBucket: "real-estate-wala-bhai.firebasestorage.app",
    messagingSenderId: "28532654918",
    appId: "1:28532654918:web:e6376b9551169f6f019b47"
};

// Make available globally
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
