/**
 * ==========================================
 * AUTHENTICATION SERVICE
 * ==========================================
 * 
 * Business logic for authentication operations
 * Device tracking and user management
 */

const { db, auth } = require('../config/firebase');
const UAParser = require('ua-parser-js');

/**
 * Get or create user in Firestore
 * Called after successful OTP verification
 */
const getOrCreateUser = async (firebaseUser) => {
    try {
        const userRef = db.collection('users').doc(firebaseUser.uid);
        const userDoc = await userRef.get();

        const now = new Date();

        if (!userDoc.exists) {
            // Create new user
            const newUser = {
                uid: firebaseUser.uid,
                phone: firebaseUser.phoneNumber || null,
                email: firebaseUser.email || null,
                displayName: firebaseUser.displayName || null,
                role: 'user',
                isActive: true,
                createdAt: now,
                lastLogin: now
            };

            await userRef.set(newUser);
            console.log(`✅ New user created: ${firebaseUser.uid}`);
            return newUser;
        } else {
            // Update last login
            await userRef.update({
                lastLogin: now
            });

            const userData = userDoc.data();
            console.log(`✅ Existing user logged in: ${firebaseUser.uid}`);
            return { uid: firebaseUser.uid, ...userData };
        }
    } catch (error) {
        console.error('Error in getOrCreateUser:', error);
        throw error;
    }
};

/**
 * Track device information
 * Saves device details to user's devices subcollection
 */
const trackDevice = async (uid, req) => {
    try {
        const parser = new UAParser(req.headers['user-agent']);
        const result = parser.getResult();

        const deviceInfo = {
            browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
            os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
            device: result.device.type || 'desktop',
            ip: req.ip || req.connection.remoteAddress,
            lastUsed: new Date()
        };

        // Create device ID from browser + OS
        const deviceId = Buffer.from(`${deviceInfo.browser}-${deviceInfo.os}`).toString('base64');

        const deviceRef = db.collection('users').doc(uid).collection('devices').doc(deviceId);
        const deviceDoc = await deviceRef.get();

        if (!deviceDoc.exists) {
            // New device
            await deviceRef.set({
                ...deviceInfo,
                firstUsed: new Date()
            });
            console.log(`📱 New device tracked for user ${uid}`);
        } else {
            // Update existing device
            await deviceRef.update({
                lastUsed: new Date()
            });
        }

        return deviceInfo;
    } catch (error) {
        console.error('Error tracking device:', error);
        // Don't throw - device tracking is non-critical
        return null;
    }
};

/**
 * Verify Firebase ID token and get user
 */
const verifyAndGetUser = async (idToken) => {
    try {
        // Verify the ID token
        const decodedToken = await auth.verifyIdToken(idToken);

        // Get user from Firebase Auth
        const firebaseUser = await auth.getUser(decodedToken.uid);

        // Get or create user in Firestore
        const user = await getOrCreateUser(firebaseUser);

        return user;
    } catch (error) {
        console.error('Error verifying token:', error);
        throw error;
    }
};

/**
 * Get user devices
 */
const getUserDevices = async (uid) => {
    try {
        const devicesSnapshot = await db
            .collection('users')
            .doc(uid)
            .collection('devices')
            .orderBy('lastUsed', 'desc')
            .get();

        const devices = [];
        devicesSnapshot.forEach(doc => {
            devices.push({
                id: doc.id,
                ...doc.data(),
                firstUsed: doc.data().firstUsed?.toDate(),
                lastUsed: doc.data().lastUsed?.toDate()
            });
        });

        return devices;
    } catch (error) {
        console.error('Error getting devices:', error);
        throw error;
    }
};

/**
 * Remove device from user's device list
 */
const removeDevice = async (uid, deviceId) => {
    try {
        await db
            .collection('users')
            .doc(uid)
            .collection('devices')
            .doc(deviceId)
            .delete();

        console.log(`🗑️ Device ${deviceId} removed for user ${uid}`);
        return true;
    } catch (error) {
        console.error('Error removing device:', error);
        throw error;
    }
};

module.exports = {
    getOrCreateUser,
    trackDevice,
    verifyAndGetUser,
    getUserDevices,
    removeDevice
};
