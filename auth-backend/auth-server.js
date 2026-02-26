/**
 * ==========================================
 * FIREBASE AUTHENTICATION SERVER
 * ==========================================
 * 
 * Production-ready Express server with Firebase OTP authentication
 * Features:
 * - Phone & Email OTP login
 * - Device tracking
 * - Secure token validation
 * - User management
 * - Rate limiting
 * - CORS protection
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

// Security headers
app.use(helmet());

// CORS - Allow frontend to access API
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Prevent brute force attacks
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Trust proxy for rate limiting with reverse proxy
app.set('trust proxy', 1);

// ==========================================
// ROUTES
// ==========================================

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Real Estate Auth API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: {
                verifyOtp: 'POST /api/auth/verify-otp',
                me: 'GET /api/auth/me',
                logout: 'POST /api/auth/logout',
                devices: 'GET /api/auth/devices'
            },
            user: {
                get: 'GET /api/user/:id',
                update: 'PATCH /api/user/:id',
                list: 'GET /api/user (admin only)'
            }
        }
    });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        success: false,
        error: isDev ? err.message : 'Internal server error',
        ...(isDev && { stack: err.stack })
    });
});

// ==========================================
// START SERVER
// ==========================================

// Initialize Firebase before starting server
const startServer = async () => {
    try {
        // Import Firebase to trigger initialization
        require('./config/firebase');

        // Start listening
        app.listen(PORT, () => {
            console.log('');
            console.log('🔥 ========================================');
            console.log(`🚀 Firebase Auth Server Running`);
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('🔥 ========================================');
            console.log('');
            console.log('📋 Available endpoints:');
            console.log(`   Health: http://localhost:${PORT}/health`);
            console.log(`   Auth:   http://localhost:${PORT}/api/auth/*`);
            console.log(`   User:   http://localhost:${PORT}/api/user/*`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
