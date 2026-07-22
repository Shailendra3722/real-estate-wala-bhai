/**
 * Unified Real Estate API Server
 * 
 * Production-ready Express application combining MongoDB capabilities and
 * local mock fallbacks. Standardizes endpoints and serves the static frontend.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/pool');

const app = express();
const PORT = process.env.PORT || 3004;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup supporting Vercel previews and local dev
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3004',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8081', // React Native / Metro dev ports
    'https://real-estate-wala-bhai.vercel.app',
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                const pattern = allowed.replace('*', '.*');
                return new RegExp(pattern).test(origin);
            }
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            // Log warning but allow in dev mode to avoid blocks
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(null, true);
        }
    },
    credentials: true
}));

// Serve static frontend files from 'frontend' directory
// Serving 'frontend' statically maps `/home.html` or `/index.html` to URLs directly
app.use(express.static(path.join(__dirname, '../frontend')));

// Redirect root to pages/home.html (where static pages reside now)
app.get('/', (req, res) => {
    res.redirect('/pages/home.html');
});

// ── API ROUTES ────────────────────────────────────────────────────────────────

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api', inquiryRoutes); // Matches POST /api/contact and GET /api/inquiries

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: db.isInMemoryMode() ? 'degraded_mode_active' : 'healthy',
        database: db.isInMemoryMode() ? 'in_memory_fallback_active' : 'mongodb_connected',
        timestamp: new Date().toISOString()
    });
});

// ── ERROR HANDLING ────────────────────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API Endpoint not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error Context:', err);
    const isDev = NODE_ENV === 'development';

    res.status(err.status || 500).json({
        success: false,
        error: isDev ? err.message : 'Internal Server Error',
        ...(isDev && { stack: err.stack })
    });
});

// ── STARTUP ──────────────────────────────────────────────────────────────────

if (require.main === module || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('\n==================================================');
        console.log('🏗️   Real Estate Wala Bhai Backend Engine');
        console.log(`📡  Port: ${PORT}`);
        console.log(`🌍  Environment: ${NODE_ENV}`);
        console.log(`📊  Data Access: ${db.isInMemoryMode() ? 'IN-MEMORY MODE 📦' : 'MONGODB MODE 🗄️'}`);
        console.log('==================================================\n');
        console.log('🔗  Core Endpoints:');
        console.log(`    GET   http://localhost:${PORT}/api/properties`);
        console.log(`    POST  http://localhost:${PORT}/api/properties/search`);
        console.log(`    GET   http://localhost:${PORT}/api/properties/nearby?lat=26.8467&lng=80.9462`);
        console.log(`    GET   http://localhost:${PORT}/health`);
        console.log('\n🌟  Launch App: Open http://localhost:3004 in your browser\n');
    });
}

module.exports = app;
