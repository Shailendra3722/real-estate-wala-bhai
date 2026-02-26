/**
 * ==========================================
 * AUTHENTICATION ROUTES
 * ==========================================
 * 
 * API endpoints for authentication
 * - Verify OTP and login
 * - Get current user
 * - Logout
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { validateIdToken } = require('../middleware/validation');
const { verifyAndGetUser, trackDevice, getUserDevices, removeDevice } = require('../services/authService');

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify Firebase ID token after OTP verification
 * @access  Public
 * 
 * Frontend flow:
 * 1. User enters phone number
 * 2. Firebase sends OTP (handled by Firebase SDK on frontend)
 * 3. User enters OTP code
 * 4. Frontend verifies OTP with Firebase
 * 5. Frontend receives ID token
 * 6. Frontend sends ID token to this endpoint
 */
router.post('/verify-otp', validateIdToken, async (req, res) => {
    try {
        const { idToken } = req.body;

        // Verify token and get/create user
        const user = await verifyAndGetUser(idToken);

        // Track device
        await trackDevice(user.uid, req);

        // Return user data
        res.json({
            success: true,
            message: 'Authentication successful',
            user: {
                uid: user.uid,
                phone: user.phone,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                lastLogin: user.lastLogin
            },
            // Frontend should store the original ID token for authenticated requests
            token: idToken
        });

    } catch (error) {
        console.error('Verify OTP error:', error);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please request a new OTP.'
            });
        }

        res.status(401).json({
            success: false,
            error: 'Invalid token. Please try again.'
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private (requires token)
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;

        // Get user from Firestore
        const userDoc = await require('../config/firebase').db
            .collection('users')
            .doc(uid)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();

        res.json({
            success: true,
            user: {
                uid: userData.uid,
                phone: userData.phone,
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user information'
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke token)
 * @access  Private
 */
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;

        // Revoke all refresh tokens for this user
        await require('../config/firebase').auth.revokeRefreshTokens(uid);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});

/**
 * @route   GET /api/auth/devices
 * @desc    Get list of devices for current user
 * @access  Private
 */
router.get('/devices', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const devices = await getUserDevices(uid);

        res.json({
            success: true,
            devices
        });

    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get devices'
        });
    }
});

/**
 * @route   DELETE /api/auth/devices/:deviceId
 * @desc    Remove a device from user's device list
 * @access  Private
 */
router.delete('/devices/:deviceId', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { deviceId } = req.params;

        await removeDevice(uid, deviceId);

        res.json({
            success: true,
            message: 'Device removed successfully'
        });

    } catch (error) {
        console.error('Remove device error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove device'
        });
    }
});

module.exports = router;
