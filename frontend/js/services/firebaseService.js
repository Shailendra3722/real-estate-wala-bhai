/**
 * Firebase Service - Real Estate Wala Bhai
 * 
 * Unified wrapper for Firebase Auth + Firestore.
 * All pages import this one file to get permanent cloud storage.
 * 
 * Collections in Firestore:
 *   - users      → { uid, name, email, phone, role, createdAt }
 *   - properties → full property objects (same shape as existing static data)
 */

const FirebaseService = (function () {
    'use strict';

    let _app = null;
    let _auth = null;
    let _db = null;
    let _initialized = false;

    // ─────────────────────────────────────────────
    //  INIT
    // ─────────────────────────────────────────────

    function init() {
        if (_initialized) return Promise.resolve();

        return new Promise((resolve, reject) => {
            try {
                if (!window.FIREBASE_CONFIG) {
                    throw new Error('firebase-config.js not loaded before firebase-service.js');
                }

                // Initialize Firebase app (only once)
                if (!firebase.apps.length) {
                    _app = firebase.initializeApp(window.FIREBASE_CONFIG);
                } else {
                    _app = firebase.apps[0];
                }

                _auth = firebase.auth();
                _db = firebase.firestore();

                // Enable offline persistence (so app works even with bad connection)
                _db.enablePersistence({ synchronizeTabs: true }).catch(err => {
                    if (err.code === 'failed-precondition') {
                        // Multiple tabs open — persistence only in one tab
                        console.warn('Firestore persistence: multiple tabs open');
                    } else if (err.code === 'unimplemented') {
                        // Browser doesn't support persistence
                        console.warn('Firestore persistence not supported in this browser');
                    }
                });

                _initialized = true;
                console.log('🔥 Firebase initialized successfully');
                resolve();
            } catch (error) {
                console.error('❌ Firebase init failed:', error);
                reject(error);
            }
        });
    }

    // ─────────────────────────────────────────────
    //  AUTH — USER LOGIN / REGISTER
    // ─────────────────────────────────────────────

    /**
     * Register new user with email + password.
     * Also creates a Firestore user doc.
     */
    async function register(name, email, password, phone, role) {
        await init();
        const credential = await _auth.createUserWithEmailAndPassword(email, password);
        const uid = credential.user.uid;

        // Update display name in Firebase Auth
        await credential.user.updateProfile({ displayName: name });

        // Save to Firestore
        await _db.collection('users').doc(uid).set({
            uid,
            name,
            email,
            phone: phone || '',
            role: role || 'buyer',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { uid, name, email, phone, role };
    }

    /**
     * Sign in existing user with email + password.
     */
    async function login(email, password) {
        await init();
        const credential = await _auth.signInWithEmailAndPassword(email, password);
        const uid = credential.user.uid;

        // Fetch user profile from Firestore
        const doc = await _db.collection('users').doc(uid).get();
        if (doc.exists) {
            return { uid, ...doc.data() };
        }

        // Fallback if Firestore doc missing
        return { uid, name: credential.user.displayName, email };
    }

    /**
     * Sign out current user.
     */
    async function logout() {
        await init();
        await _auth.signOut();
    }

    /**
     * Get current signed-in user (null if not logged in).
     * Returns enriched user object from Firestore.
     */
    async function getCurrentUser() {
        await init();
        return new Promise((resolve) => {
            const unsubscribe = _auth.onAuthStateChanged(async (firebaseUser) => {
                unsubscribe();
                if (!firebaseUser) {
                    resolve(null);
                    return;
                }
                try {
                    const doc = await _db.collection('users').doc(firebaseUser.uid).get();
                    if (doc.exists) {
                        resolve({ uid: firebaseUser.uid, ...doc.data() });
                    } else {
                        resolve({
                            uid: firebaseUser.uid,
                            name: firebaseUser.displayName,
                            email: firebaseUser.email
                        });
                    }
                } catch (e) {
                    resolve({
                        uid: firebaseUser.uid,
                        name: firebaseUser.displayName,
                        email: firebaseUser.email
                    });
                }
            });
        });
    }

    /**
     * Listen for auth state changes.
     * callback(user) — user is null when logged out
     */
    function onAuthChange(callback) {
        init().then(() => {
            _auth.onAuthStateChanged(async (firebaseUser) => {
                if (!firebaseUser) {
                    callback(null);
                    return;
                }
                try {
                    const doc = await _db.collection('users').doc(firebaseUser.uid).get();
                    callback(doc.exists ? { uid: firebaseUser.uid, ...doc.data() } : { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName });
                } catch (e) {
                    callback({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName });
                }
            });
        });
    }

    /**
     * Update user profile (name, phone, role).
     */
    async function updateUserProfile(updates) {
        await init();
        const user = _auth.currentUser;
        if (!user) throw new Error('Not logged in');

        await _db.collection('users').doc(user.uid).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (updates.name) {
            await user.updateProfile({ displayName: updates.name });
        }
    }

    // ─────────────────────────────────────────────
    //  PROPERTIES — SAVE / LOAD
    // ─────────────────────────────────────────────

    /**
     * Save a new property to Firestore.
     * Returns the Firestore document ID.
     */
    async function addProperty(propertyData) {
        await init();
        const user = _auth.currentUser;

        const doc = await _db.collection('properties').add({
            ...propertyData,
            ownerId: user ? user.uid : 'anonymous',
            status: 'published',
            verificationStatus: 'under_review',
            featured: false,
            viewCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Property saved to Firestore:', doc.id);
        return doc.id;
    }

    /**
     * Get all published properties from Firestore.
     * Ordered by createdAt descending (newest first).
     */
    async function getAllProperties() {
        await init();
        try {
            const snapshot = await _db.collection('properties')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Normalize Firestore timestamp to ISO string
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                _source: 'firestore'
            }));
        } catch (error) {
            console.error('❌ Error fetching properties:', error);
            return [];
        }
    }

    /**
     * Get a single property from Firestore by document ID.
     */
    async function getPropertyById(propertyId) {
        await init();
        try {
            const doc = await _db.collection('properties').doc(propertyId).get();
            if (!doc.exists) return null;
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error fetching property:', error);
            return null;
        }
    }

    /**
     * Listen to properties in real-time.
     * callback([properties]) fires whenever data changes.
     * Returns unsubscribe function.
     */
    function onPropertiesChange(callback) {
        init().then(() => {
            _db.collection('properties')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .onSnapshot(snapshot => {
                    const properties = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        _source: 'firestore'
                    }));
                    callback(properties);
                }, error => {
                    console.error('❌ Firestore snapshot error:', error);
                    callback([]);
                });
        });
    }

    /**
     * Get properties belonging to a specific user.
     */
    async function getUserProperties(userId) {
        await init();
        try {
            const snapshot = await _db.collection('properties')
                .where('ownerId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            }));
        } catch (error) {
            console.error('❌ Error fetching user properties:', error);
            return [];
        }
    }

    /**
     * Increment property view count.
     */
    async function incrementViewCount(propertyId) {
        await init();
        try {
            await _db.collection('properties').doc(propertyId).update({
                viewCount: firebase.firestore.FieldValue.increment(1)
            });
        } catch (e) {
            // Non-critical, ignore
        }
    }

    // ─────────────────────────────────────────────
    //  FAVORITES
    // ─────────────────────────────────────────────

    async function addFavorite(propertyId) {
        await init();
        const user = _auth.currentUser;
        if (!user) throw new Error('Not logged in');
        await _db.collection('favorites').doc(`${user.uid}_${propertyId}`).set({
            userId: user.uid,
            propertyId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async function removeFavorite(propertyId) {
        await init();
        const user = _auth.currentUser;
        if (!user) throw new Error('Not logged in');
        await _db.collection('favorites').doc(`${user.uid}_${propertyId}`).delete();
    }

    async function getUserFavorites() {
        await init();
        const user = _auth.currentUser;
        if (!user) return [];
        const snapshot = await _db.collection('favorites')
            .where('userId', '==', user.uid)
            .get();
        return snapshot.docs.map(doc => doc.data().propertyId);
    }

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────

    return {
        init,

        // Auth
        register,
        login,
        logout,
        getCurrentUser,
        onAuthChange,
        updateUserProfile,

        // Properties
        addProperty,
        getAllProperties,
        getPropertyById,
        onPropertiesChange,
        getUserProperties,
        incrementViewCount,

        // Favorites
        addFavorite,
        removeFavorite,
        getUserFavorites
    };
})();

window.FirebaseService = FirebaseService;
console.log('🔥 FirebaseService loaded');
