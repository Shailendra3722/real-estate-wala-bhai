/**
 * ==========================================
 * REAL ESTATE API SERVER WITH MONGODB
 * ==========================================
 * 
 * Production-ready backend with MongoDB Atlas
 * Permanent data storage with auto-scaling database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3004;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());

// CORS Configuration - Allow both local and production origins
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3004',
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
const PROPERTIES = [
    {
        id: 'prop_001',
        title: '3 BHK Flat in Gomti Nagar',
        description: 'Spacious 3 BHK apartment with modern amenities in prime location',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '3 BHK',
        bathrooms: 2,
        sqft: 1450,
        furnishing: 'semi-furnished',
        price: 8500000,
        latitude: 26.8467,
        longitude: 80.9462,
        address: 'Sector 12, Gomti Nagar Extension, Lucknow',
        city: 'Lucknow',
        area: 'Gomti Nagar',
        pincode: '226010',
        amenities: ['Parking', 'Lift', 'Security', 'Park', 'Gym'],
        images: ['/images/prop_001_1.jpg', '/images/prop_001_2.jpg', '/images/prop_001_3.jpg'],
        yearBuilt: 2020,
        verificationStatus: 'verified',
        isFeatured: true,
        status: 'active',
        owner: {
            id: 'user_001',
            name: 'Rajesh Kumar',
            phone: '+919876543210',
            email: 'rajesh@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-15').toISOString()
    },
    {
        id: 'prop_002',
        title: '2 BHK Apartment in Alambagh',
        description: 'Affordable 2 BHK apartment near bus station',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '2 BHK',
        bathrooms: 2,
        sqft: 980,
        furnishing: 'unfurnished',
        price: 4500000,
        latitude: 26.8205,
        longitude: 80.8869,
        address: 'Kanpur Road, Alambagh, Lucknow',
        city: 'Lucknow',
        area: 'Alambagh',
        pincode: '226005',
        amenities: ['Parking', 'Lift', 'Security'],
        images: ['/images/prop_002_1.jpg', '/images/prop_002_2.jpg'],
        yearBuilt: 2018,
        verificationStatus: 'verified',
        isFeatured: false,
        status: 'active',
        owner: {
            id: 'user_002',
            name: 'Priya Sharma',
            phone: '+919845612378',
            email: 'priya@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-20').toISOString()
    },
    {
        id: 'prop_003',
        title: 'Luxury 4 BHK Villa in Hazratganj',
        description: 'Premium villa with world-class amenities',
        propertyType: 'villa',
        listingType: 'sell',
        bhk: '4 BHK',
        bathrooms: 4,
        sqft: 3200,
        furnishing: 'fully-furnished',
        price: 25000000,
        latitude: 26.8547,
        longitude: 80.9470,
        address: 'MG Marg, Hazratganj, Lucknow',
        city: 'Lucknow',
        area: 'Hazratganj',
        pincode: '226001',
        amenities: ['Parking', 'Swimming Pool', 'Garden', 'Security', 'Gym', 'Home Theater'],
        images: ['/images/prop_003_1.jpg', '/images/prop_003_2.jpg', '/images/prop_003_3.jpg'],
        yearBuilt: 2022,
        verificationStatus: 'verified',
        isFeatured: true,
        status: 'active',
        owner: {
            id: 'user_001',
            name: 'Rajesh Kumar',
            phone: '+919876543210',
            email: 'rajesh@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-10').toISOString()
    },
    {
        id: 'prop_004',
        title: '2 BHK Flat for Rent in Indira Nagar',
        description: 'Well-maintained flat for rent near shopping mall',
        propertyType: 'flat',
        listingType: 'rent',
        bhk: '2 BHK',
        bathrooms: 2,
        sqft: 1100,
        furnishing: 'semi-furnished',
        price: 18000,
        latitude: 26.8780,
        longitude: 80.9920,
        address: 'Sector 15, Indira Nagar, Lucknow',
        city: 'Lucknow',
        area: 'Indira Nagar',
        pincode: '226016',
        amenities: ['Parking', 'Lift', 'Security', 'Power Backup'],
        images: ['/images/prop_004_1.jpg', '/images/prop_004_2.jpg'],
        yearBuilt: 2019,
        verificationStatus: 'verified',
        isFeatured: false,
        status: 'active',
        owner: {
            id: 'user_003',
            name: 'Sanjay Gupta',
            phone: '+919988776655',
            email: 'sanjay@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-25').toISOString()
    },
    {
        id: 'prop_005',
        title: 'Modern 3 BHK Apartment in Mahanagar',
        description: 'Contemporary design with all modern amenities',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '3 BHK',
        bathrooms: 2,
        sqft: 1350,
        furnishing: 'semi-furnished',
        price: 7500000,
        latitude: 26.8850,
        longitude: 81.0050,
        address: 'Sector A, Mahanagar Extension, Lucknow',
        city: 'Lucknow',
        area: 'Mahanagar',
        pincode: '226006',
        amenities: ['Parking', 'Lift', 'Security', 'Park', 'Club House'],
        images: ['/images/prop_005_1.jpg', '/images/prop_005_2.jpg'],
        yearBuilt: 2021,
        verificationStatus: 'verified',
        isFeatured: true,
        status: 'active',
        owner: {
            id: 'user_002',
            name: 'Priya Sharma',
            phone: '+919845612378',
            email: 'priya@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-28').toISOString()
    },
    {
        id: 'prop_006',
        title: 'Spacious 1 BHK in Aliganj',
        description: 'Compact and well-designed 1 BHK apartment',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '1 BHK',
        bathrooms: 1,
        sqft: 650,
        furnishing: 'unfurnished',
        price: 3200000,
        latitude: 26.8900,
        longitude: 80.9150,
        address: 'Near Aliganj Railway Station, Lucknow',
        city: 'Lucknow',
        area: 'Aliganj',
        pincode: '226024',
        amenities: ['Parking', 'Security'],
        images: ['/images/prop_006_1.jpg'],
        yearBuilt: 2017,
        verificationStatus: 'verified',
        isFeatured: false,
        status: 'active',
        owner: {
            id: 'user_003',
            name: 'Sanjay Gupta',
            phone: '+919988776655',
            email: 'sanjay@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-22').toISOString()
    },
    {
        id: 'prop_007',
        title: 'Premium 4 BHK Penthouse in Sushant Golf City',
        description: 'Ultra-luxury penthouse with golf course view',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '4 BHK',
        bathrooms: 4,
        sqft: 4000,
        furnishing: 'fully-furnished',
        price: 35000000,
        latitude: 26.7920,
        longitude: 81.0340,
        address: 'Sushant Golf City, Amar Shaheed Path, Lucknow',
        city: 'Lucknow',
        area: 'Sushant Golf City',
        pincode: '226030',
        amenities: ['Parking', 'Lift', 'Swimming Pool', 'Gym', 'Security', 'Golf Course View', 'Terrace Garden'],
        images: ['/images/prop_007_1.jpg', '/images/prop_007_2.jpg'],
        yearBuilt: 2023,
        verificationStatus: 'verified',
        isFeatured: true,
        status: 'active',
        owner: {
            id: 'user_001',
            name: 'Rajesh Kumar',
            phone: '+919876543210',
            email: 'rajesh@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-05').toISOString()
    },
    {
        id: 'prop_008',
        title: '3 BHK House in Jankipuram',
        description: 'Independent house with garden',
        propertyType: 'house',
        listingType: 'sell',
        bhk: '3 BHK',
        bathrooms: 3,
        sqft: 2000,
        furnishing: 'semi-furnished',
        price: 12000000,
        latitude: 26.8650,
        longitude: 80.8850,
        address: 'Sector C, Jankipuram Extension, Lucknow',
        city: 'Lucknow',
        area: 'Jankipuram',
        pincode: '226021',
        amenities: ['Parking', 'Garden', 'Security'],
        images: ['/images/prop_008_1.jpg', '/images/prop_008_2.jpg'],
        yearBuilt: 2020,
        verificationStatus: 'pending',
        isFeatured: false,
        status: 'active',
        owner: {
            id: 'user_002',
            name: 'Priya Sharma',
            phone: '+919845612378',
            email: 'priya@example.com',
            isVerified: true
        },
        viewCount: 0,
        contactCount: 0,
        createdAt: new Date('2026-01-30').toISOString()
    }
];

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

// Helper: Format property from database row/document (snake_case to camelCase)
function formatPropertyFromDB(row, distance = null) {
    const propertyType = row.propertyType || row.property_type;
    const listingType = row.listingType || row.listing_type;
    const verificationStatus = row.verificationStatus || row.verification_status;
    const latitude = row.latitude || row.location?.latitude;
    const longitude = row.longitude || row.location?.longitude;
    const price = parseInt(row.price) || 0;

    const prop = {
        id: row.id,
        title: row.title,
        description: row.description,
        propertyType,
        listingType,
        bhk: row.bhk,
        bathrooms: row.bathrooms,
        sqft: row.sqft,
        furnishing: row.furnishing,
        price,
        priceFormatted: formatPrice(price, listingType),
        location: {
            latitude: parseFloat(latitude) || 0,
            longitude: parseFloat(longitude) || 0,
            address: row.address,
            city: row.city,
            area: row.area,
            pincode: row.pincode
        },
        amenities: row.amenities || [],
        yearBuilt: row.yearBuilt || row.year_built,
        images: row.images || [],
        verificationStatus,
        isVerified: verificationStatus === 'verified',
        owner: {
            id: row.ownerId || row.owner_id || row.owner?.id,
            name: row.ownerName || row.owner_name || row.owner?.name,
            phone: row.ownerPhone || row.owner_phone || row.owner?.phone,
            email: row.ownerEmail || row.owner_email || row.owner?.email,
            isVerified: row.ownerVerified || row.owner_verified || row.owner?.isVerified
        },
        viewCount: row.viewCount || row.view_count || 0,
        contactCount: row.contactCount || row.contact_count || 0,
        status: row.status,
        isFeatured: row.isFeatured || row.is_featured,
        createdAt: row.createdAt || row.created_at
    };

    if (distance !== null) {
        prop.distanceKm = distance.toFixed(2);
        prop.distanceFormatted = `${distance.toFixed(1)} km away`;
    }

    return prop;
}

// ==================== API ENDPOINTS ====================

// Get all properties
app.get('/api/properties', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber;

        const propertiesCollection = await db.getCollection('properties');
        const [properties, total] = await Promise.all([
            propertiesCollection
                .find({ status: 'active' })
                .sort({ createdAt: -1, created_at: -1 })
                .skip(offset)
                .limit(limitNumber)
                .toArray(),
            propertiesCollection.countDocuments({ status: 'active' }),
        ]);

        res.json({
            success: true,
            page: pageNumber,
            limit: limitNumber,
            total,
            count: properties.length,
            properties: properties.map(p => formatPropertyFromDB(p))
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// Get property by ID
app.get('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const propertiesCollection = await db.getCollection('properties');

        // Increment view count and get property
        await propertiesCollection.updateOne(
            { id },
            { $inc: { viewCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
        );

        const property = await propertiesCollection.findOne({ id });

        if (!property) {
            return res.status(404).json({
                error: 'Property not found',
                propertyId: id
            });
        }

        res.json({
            success: true,
            property: formatPropertyFromDB(property)
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch property' });
    }
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

// Add new property
app.post('/api/properties', async (req, res) => {
    try {
        const data = req.body;

        console.log('📥 Received property submission:', data);

        // Validate required fields
        if (!data.listingType || !data.propertyType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['listingType', 'propertyType', 'bedrooms', 'price', 'city', 'area']
            });
        }

        const id = `prop_${Date.now()}`;
        const title = data.title || `${data.bedrooms} BHK ${data.propertyType} in ${data.area}`;

        const latitude = parseFloat(data.latitude) || 26.8467;
        const longitude = parseFloat(data.longitude) || 80.9462;
        const now = new Date().toISOString();
        const property = {
            id,
            title,
            description: data.description || '',
            propertyType: data.propertyType,
            listingType: data.listingType,
            bhk: `${data.bedrooms} BHK`,
            bedrooms: parseInt(data.bedrooms) || 1,
            bathrooms: parseInt(data.bathrooms) || 1,
            sqft: parseInt(data.sqft) || 0,
            furnishing: data.furnished || 'unfurnished',
            price: parseInt(data.price),
            latitude,
            longitude,
            locationPoint: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
            address: data.address || `${data.area}, ${data.city}`,
            city: data.city || 'Lucknow',
            area: data.area,
            pincode: data.pincode || '',
            amenities: data.amenities || [],
            images: data.photos || [],
            yearBuilt: parseInt(data.yearBuilt) || new Date().getFullYear(),
            verificationStatus: 'verified',
            isFeatured: false,
            status: 'active',
            ownerName: data.name,
            ownerPhone: data.phone,
            ownerEmail: data.email || '',
            ownerVerified: true,
            viewCount: 0,
            contactCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const propertiesCollection = await db.getCollection('properties');
        await propertiesCollection.insertOne(property);

        console.log(`✅ Property created in database: ${id} - ${title}`);

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            propertyId: id
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to create property' });
    }
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
