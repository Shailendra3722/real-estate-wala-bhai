/**
 * Authentication Middleware
 * 
 * Secures routes using JWT (JSON Web Tokens). Inspects the Authorization header,
 * decodes the token, and attaches the credential payload to the req.user object.
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_development_only';

function verifyToken(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Access Denied: No Authorization header provided.'
        });
    }

    // Expecting 'Bearer <token>' format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Access Denied: Token format must be Bearer <token>'
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Access Denied: Invalid or expired session token.'
        });
    }
}

module.exports = {
    verifyToken
};
