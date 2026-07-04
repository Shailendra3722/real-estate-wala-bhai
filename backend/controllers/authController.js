/**
 * Authentication Controller
 * 
 * Intercepts HTTP auth requests, manages password hashing with bcrypt,
 * and signs JWT authorization tokens for user sessions.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_development_only';
const TOKEN_EXPIRY = process.env.SESSION_DURATION || '24h';

const AuthController = {
    /**
     * POST /api/auth/register
     * Register a new full-stack user
     */
    async register(req, res, next) {
        try {
            const { name, email, phone, password, role } = req.body;

            // Simple validation
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide all required fields (name, email, password)'
                });
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'A user with this email address already exists'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Generate user ID
            const id = `user_${Date.now()}`;

            // Create user
            const user = await User.create({
                id,
                name,
                email,
                phone: phone || '',
                passwordHash,
                role: role || 'buyer'
            });

            // Sign JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.is_verified || false
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/auth/login
     * Login existing user
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide both email and password'
                });
            }

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email credentials'
                });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password credentials'
                });
            }

            // Sign JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            res.json({
                success: true,
                message: 'Authentication successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.is_verified || false
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/auth/me
     * Fetch profile of the logged-in user
     */
    async getMe(req, res, next) {
        try {
            // req.user is set by authMiddleware
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found'
                });
            }

            res.json({
                success: true,
                user
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = AuthController;
