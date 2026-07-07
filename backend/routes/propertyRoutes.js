/**
 * Properties Route Definitions
 *
 * Maps property retrieval, geospatial maps, search filters, and property listings
 * to the Property Controller.
 *
 * Auth notes:
 *  - GET endpoints are public.
 *  - POST /api/properties uses `optionalToken`: logged-in users get their identity
 *    attached; unauthenticated requests are still accepted (the controller assigns
 *    an anonymous owner). This keeps the upload flow working even if the client
 *    token has expired, while still enriching listings with owner info when available.
 */

const express = require('express');
const router = express.Router();
const PropertyController = require('../controllers/propertyController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_development_only';

/**
 * Optional auth middleware — attaches req.user if a valid Bearer token is present,
 * but does NOT block the request if there's no token or if the token is invalid.
 */
function optionalToken(req, res, next) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (_) {
            // Token invalid or expired — continue without user
        }
    }
    next();
}

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/',         PropertyController.getAll);
router.get('/nearby',   PropertyController.getNearby);
router.post('/search',  PropertyController.search);
router.get('/:id',      PropertyController.getById);

// ── Property creation (optional auth — keeps upload working for all logged-in users) ──
router.post('/', optionalToken, PropertyController.create);

module.exports = router;
