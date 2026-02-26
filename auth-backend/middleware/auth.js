/**
 * ==========================================
 * AUTHENTICATION MIDDLEWARE
 * ==========================================
 * 
 * Middleware for verifying Firebase ID tokens
 * and protecting routes with authentication
 */

const { auth } = require('../config/firebase');

/**
 * Verify Firebase ID Token
 * Extracts token from Authorization header and validates it
 */
const verifyToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided. Please include Authorization header with Bearer token.'
            });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the token with Firebase Admin SDK
        const decodedToken = await auth.verifyIdToken(idToken);

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            phone: decodedToken.phone_number,
            emailVerified: decodedToken.email_verified
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error.message);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please login again.'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Invalid token. Authentication failed.'
        });
    }
};

/**
 * Require Admin Role
 * Checks if user has admin role in their custom claims
 */
const requireAdmin = async (req, res, next) => {
    try {
        const { uid } = req.user;

        // Get user record from Firebase Auth
        const userRecord = await auth.getUser(uid);

        // Check custom claims for admin role
        if (userRecord.customClaims && userRecord.customClaims.admin === true) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                error: 'Admin access required. You do not have permission to access this resource.'
            });
        }
    } catch (error) {
        console.error('Admin verification error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error verifying admin status'
        });
    }
};

/**
 * Optional Auth
 * Tries to verify token but doesn't fail if missing
 * Useful for endpoints that can work with or without auth
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without user
            req.user = null;
            return next();
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            phone: decodedToken.phone_number
        };

        next();
    } catch (error) {
        // Token invalid, but continue anyway
        req.user = null;
        next();
    }
};

module.exports = {
    verifyToken,
    requireAdmin,
    optionalAuth
};
