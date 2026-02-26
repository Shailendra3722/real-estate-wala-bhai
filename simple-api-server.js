/**
 * ==========================================
 * SIMPLE REAL ESTATE API SERVER
 * ==========================================
 * 
 * A lightweight backend API that runs without PostgreSQL
 * Uses in-memory data storage for properties and inquiries
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());

// Serve frontend static files from root directory
const path = require('path');
app.use(express.static(path.join(__dirname)));

// Redirect root to home page
app.get('/', (req, res) => {
    res.redirect('/home.html');
});

// CORS Configuration - Allow both local and production origins
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'https://real-estate-wala-bhai.vercel.app', // Add your Vercel domain here
    'https://*.vercel.app' // Allow all Vercel preview deployments
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list or matches pattern
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
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, true); // Allow anyway for now (can restrict later)
        }
    },
    credentials: true
}));
// Load property data from shared data file
const REAL_LISTINGS = require('./real-listings-data.js');
const PROPERTIES = REAL_LISTINGS;

// In-memory inquiries storage
const inquiries = [];

// Helper: Calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Helper: Format price
function formatPrice(price, listingType) {
    const suffix = listingType === 'rent' ? '/month' : '';
    if (price >= 10000000) {
        return `₹${(price / 10000000).toFixed(2)} Cr${suffix}`;
    } else if (price >= 100000) {
        return `₹${(price / 100000).toFixed(2)} Lakh${suffix}`;
    } else {
        return `₹${price.toLocaleString('en-IN')}${suffix}`;
    }
}

// Helper: Format property response
function formatProperty(prop, distance = null) {
    const formatted = {
        id: prop.id,
        title: prop.title,
        description: prop.description,
        propertyType: prop.propertyType,
        listingType: prop.listingType,
        bhk: prop.bhk,
        bathrooms: prop.bathrooms,
        sqft: prop.sqft,
        furnishing: prop.furnishing,
        price: prop.price,
        priceFormatted: formatPrice(prop.price, prop.listingType),
        location: {
            latitude: prop.latitude,
            longitude: prop.longitude,
            address: prop.address,
            city: prop.city,
            area: prop.area,
            pincode: prop.pincode
        },
        amenities: prop.amenities,
        yearBuilt: prop.yearBuilt,
        images: prop.images,
        verificationStatus: prop.verificationStatus,
        isVerified: prop.verificationStatus === 'verified',
        owner: prop.owner,
        viewCount: prop.viewCount,
        contactCount: prop.contactCount,
        status: prop.status,
        isFeatured: prop.isFeatured,
        createdAt: prop.createdAt
    };

    if (distance !== null) {
        formatted.distanceKm = distance.toFixed(2);
        formatted.distanceFormatted = `${distance.toFixed(1)} km away`;
    }

    return formatted;
}

// ==================== API ENDPOINTS ====================

// Get all properties
app.get('/api/properties', (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const activeProperties = PROPERTIES.filter(p => p.status === 'active');

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProperties = activeProperties.slice(startIndex, endIndex);

    res.json({
        success: true,
        page: parseInt(page),
        limit: parseInt(limit),
        total: activeProperties.length,
        count: paginatedProperties.length,
        properties: paginatedProperties.map(p => formatProperty(p))
    });
});

// Get property by ID
app.get('/api/properties/:id', (req, res) => {
    const { id } = req.params;
    const property = PROPERTIES.find(p => p.id === id);

    if (!property) {
        return res.status(404).json({
            error: 'Property not found',
            propertyId: id
        });
    }

    // Increment view count
    property.viewCount++;

    res.json({
        success: true,
        property: formatProperty(property)
    });
});

// Get nearby properties
app.get('/api/properties/nearby', (req, res) => {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({
            error: 'Missing coordinates',
            message: 'lat and lng are required'
        });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Find properties within radius
    const nearbyProperties = PROPERTIES
        .filter(p => p.status === 'active')
        .map(p => {
            const distance = calculateDistance(latitude, longitude, p.latitude, p.longitude);
            return { property: p, distance };
        })
        .filter(({ distance }) => distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .map(({ property, distance }) => formatProperty(property, distance));

    res.json({
        success: true,
        count: nearbyProperties.length,
        radius: radiusKm,
        center: { latitude, longitude },
        properties: nearbyProperties
    });
});

// Search properties
app.post('/api/properties/search', (req, res) => {
    const filters = req.body;
    let results = PROPERTIES.filter(p => p.status === 'active');

    if (filters.city) {
        results = results.filter(p => p.city.toLowerCase() === filters.city.toLowerCase());
    }

    if (filters.listingType) {
        results = results.filter(p => p.listingType === filters.listingType);
    }

    if (filters.minPrice) {
        results = results.filter(p => p.price >= filters.minPrice);
    }

    if (filters.maxPrice) {
        results = results.filter(p => p.price <= filters.maxPrice);
    }

    if (filters.bhk) {
        results = results.filter(p => p.bhk === filters.bhk);
    }

    if (filters.propertyType) {
        results = results.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters.verifiedOnly) {
        results = results.filter(p => p.verificationStatus === 'verified');
    }

    res.json({
        success: true,
        count: results.length,
        filters: filters,
        properties: results.map(p => formatProperty(p))
    });
});

// Submit contact form
app.post('/api/contact', (req, res) => {
    const { propertyId, name, email, phone, message, contactMethod } = req.body;

    // Validate
    if (!propertyId || !name || !phone) {
        return res.status(400).json({
            error: 'Missing required fields',
            message: 'propertyId, name, and phone are required'
        });
    }

    // Find property
    const property = PROPERTIES.find(p => p.id === propertyId);
    if (!property) {
        return res.status(404).json({
            error: 'Property not found',
            propertyId: propertyId
        });
    }

    // Create inquiry
    const inquiry = {
        id: inquiries.length + 1,
        propertyId,
        propertyTitle: property.title,
        buyer: { name, email, phone },
        agent: property.owner,
        message: message || `Contact request from ${name}`,
        contactMethod: contactMethod || 'call',
        status: 'new',
        createdAt: new Date().toISOString()
    };

    inquiries.push(inquiry);
    property.contactCount++;

    res.json({
        success: true,
        message: 'Contact request submitted successfully',
        inquiryId: inquiry.id,
        contactInfo: { name, phone, email }
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`\n✅ Real Estate API Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📊 Loaded ${PROPERTIES.length} properties`);
    console.log(`\n🔗 API Endpoints:`);
    console.log(`   GET  /api/properties`);
    console.log(`   GET  /api/properties/:id`);
    console.log(`   GET  /api/properties/nearby?lat=26.8467&lng=80.9462&radius=5`);
    console.log(`   POST /api/properties/search`);
    console.log(`   POST /api/contact`);
    console.log(`\n💡 Test: curl http://localhost:${PORT}/api/properties\n`);
});

module.exports = app;
