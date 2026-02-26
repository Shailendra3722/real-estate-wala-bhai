/**
 * ==========================================
 * INPUT VALIDATION MIDDLEWARE
 * ==========================================
 * 
 * Validation rules for request inputs
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

/**
 * Phone number validation (E.164 format)
 */
const validatePhoneNumber = [
    body('phoneNumber')
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Phone number must be in E.164 format (e.g., +919876543210)'),
    validate
];

/**
 * Email validation
 */
const validateEmail = [
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    validate
];

/**
 * ID Token validation
 */
const validateIdToken = [
    body('idToken')
        .notEmpty()
        .withMessage('ID token is required')
        .isString()
        .withMessage('ID token must be a string'),
    validate
];

/**
 * User ID validation
 */
const validateUserId = [
    param('id')
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string'),
    validate
];

/**
 * User creation validation
 */
const validateUserCreate = [
    body('displayName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Display name must be 2-50 characters'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email'),
    validate
];

module.exports = {
    validate,
    validatePhoneNumber,
    validateEmail,
    validateIdToken,
    validateUserId,
    validateUserCreate
};
