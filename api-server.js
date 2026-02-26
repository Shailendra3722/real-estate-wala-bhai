// ==========================================
// REAL ESTATE API - EXPRESS SERVER
// ==========================================
// Complete API with map-based property queries

const express = require('express');
const cors = require('cors');
const db = require('./database-service');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// MAP API ENDPOINTS
// ==========================================

/**
 * GET /api/properties/nearby
 * Get properties within radius of coordinates
 * 
 * Query params:
 * - lat: User latitude (required)
 * - lng: User longitude (required)
 * - radius: Radius in km (default: 5)
 * - listingType: 'sell' or 'rent' (optional)
 * - minPrice, maxPrice: Price range (optional)
 * 
 * Example:
 * /api/properties/nearby?lat=26.8467&lng=80.9462&radius=5
 */
app.get('/api/properties/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5, listingType, minPrice, maxPrice } = req.query;

        // Validate coordinates
        if (!lat || !lng) {
            return res.status(400).json({
                error: 'Missing coordinates',
                message: 'lat and lng are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        // Validate ranges
        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({ error: 'Invalid latitude' });
        }
        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({ error: 'Invalid longitude' });
        }
        if (radiusKm <= 0 || radiusKm > 100) {
            return res.status(400).json({ error: 'Radius must be between 0 and 100 km' });
        }

        // Get nearby properties
        let properties = await db.findPropertiesNearby(latitude, longitude, radiusKm);

        // Apply additional filters
        if (listingType) {
            properties = properties.filter(p => p.listing_type === listingType);
        }

        if (minPrice) {
            properties = properties.filter(p => p.price >= parseInt(minPrice));
        }

        if (maxPrice) {
            properties = properties.filter(p => p.price <= parseInt(maxPrice));
        }

        res.json({
            success: true,
            count: properties.length,
            radius: radiusKm,
            center: { latitude, longitude },
            properties: properties.map(p => formatPropertyResponse(p))
        });

    } catch (error) {
        console.error('Error fetching nearby properties:', error);
        res.status(500).json({
            error: 'Failed to fetch properties',
            message: error.message
        });
    }
});

/**
 * GET /api/properties/:id
 * Get single property with full details
 */
app.get('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const property = await db.getPropertyById(id);

        if (!property) {
            return res.status(404).json({
                error: 'Property not found',
                propertyId: id
            });
        }

        // Increment view count
        await db.incrementViewCount(id);

        res.json({
            success: true,
            property: formatPropertyResponse(property)
        });

    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({
            error: 'Failed to fetch property',
            message: error.message
        });
    }
});

/**
 * POST /api/properties/search
 * Advanced search with filters
 * 
 * Body:
 * {
 *   city: 'Lucknow',
 *   listingType: 'sell',
 *   minPrice: 3000000,
 *   maxPrice: 10000000,
 *   bhk: '3 BHK',
 *   propertyType: 'flat',
 *   verifiedOnly: true
 * }
 */
app.post('/api/properties/search', async (req, res) => {
    try {
        const filters = req.body;

        const properties = await db.searchProperties(filters);

        res.json({
            success: true,
            count: properties.length,
            filters: filters,
            properties: properties.map(p => formatPropertyResponse(p))
        });

    } catch (error) {
        console.error('Error searching properties:', error);
        res.status(500).json({
            error: 'Failed to search properties',
            message: error.message
        });
    }
});

/**
 * GET /api/properties
 * Get all active properties (paginated)
 */
app.get('/api/properties', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const properties = await db.getAllProperties();

        // Simple pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedProperties = properties.slice(startIndex, endIndex);

        res.json({
            success: true,
            page: parseInt(page),
            limit: parseInt(limit),
            total: properties.length,
            count: paginatedProperties.length,
            properties: paginatedProperties.map(p => formatPropertyResponse(p))
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({
            error: 'Failed to fetch properties',
            message: error.message
        });
    }
});

/**
 * POST /api/contact
 * Submit contact/inquiry form for a property
 * 
 * Body:
 * {
 *   propertyId: 'prop_001',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+919876543210',
 *   message: 'Interested in viewing',
 *   contactMethod: 'whatsapp'
 * }
 */
app.post('/api/contact', async (req, res) => {
    try {
        const { propertyId, name, email, phone, message, contactMethod } = req.body;

        // Validate required fields
        if (!propertyId) {
            return res.status(400).json({
                error: 'Missing property ID',
                message: 'propertyId is required'
            });
        }

        if (!name || !phone) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'name and phone are required'
            });
        }

        // Validate contact method
        const validMethods = ['call', 'whatsapp', 'email'];
        if (contactMethod && !validMethods.includes(contactMethod)) {
            return res.status(400).json({
                error: 'Invalid contact method',
                message: `contactMethod must be one of: ${validMethods.join(', ')}`
            });
        }

        // Get property to verify it exists and get agent info
        const property = await db.getPropertyById(propertyId);

        if (!property) {
            return res.status(404).json({
                error: 'Property not found',
                propertyId: propertyId
            });
        }

        // Create inquiry
        const inquiryData = {
            propertyId: propertyId,
            buyerId: `guest_${Date.now()}`, // For now, use guest ID (in future, use authenticated user ID)
            agentId: property.owner_id,
            message: message || `Contact request from ${name}`,
            contactMethod: contactMethod || 'call'
        };

        const inquiry = await db.createInquiry(inquiryData);

        res.json({
            success: true,
            message: 'Contact request submitted successfully',
            inquiryId: inquiry.id,
            contactInfo: {
                name: name,
                phone: phone,
                email: email
            }
        });

    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({
            error: 'Failed to submit contact request',
            message: error.message
        });
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format property for API response
 */
function formatPropertyResponse(property) {
    return {
        id: property.id,
        title: property.title,
        description: property.description,

        // Type & Listing
        propertyType: property.property_type,
        listingType: property.listing_type,

        // Specs
        bhk: property.bhk,
        bathrooms: property.bathrooms,
        sqft: property.sqft,
        furnishing: property.furnishing,

        // Pricing
        price: property.price,
        priceFormatted: formatPrice(property.price, property.listing_type),

        // Location
        location: {
            latitude: parseFloat(property.latitude),
            longitude: parseFloat(property.longitude),
            address: property.address,
            city: property.city,
            area: property.area,
            pincode: property.pincode
        },

        // Distance (if available)
        ...(property.distance_km && {
            distanceKm: parseFloat(property.distance_km).toFixed(2),
            distanceFormatted: `${parseFloat(property.distance_km).toFixed(1)} km away`
        }),

        // Features
        amenities: property.amenities || [],
        yearBuilt: property.year_built,
        images: property.images || [],
        videoUrl: property.video_url,

        // Verification
        verificationStatus: property.verification_status,
        isVerified: property.verification_status === 'verified',

        // Owner info
        owner: {
            id: property.owner_id,
            name: property.owner_name,
            phone: property.owner_phone,
            email: property.owner_email,
            isVerified: property.owner_verified
        },

        // Stats
        viewCount: property.view_count || 0,
        contactCount: property.contact_count || 0,
        favoriteCount: property.favorite_count || 0,

        // Status
        status: property.status,
        isFeatured: property.is_featured,

        // Timestamps
        createdAt: property.created_at,
        updatedAt: property.updated_at
    };
}

/**
 * Format price for display
 */
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

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ API Server running on http://localhost:${PORT}`);
    console.log(`📍 Map API: http://localhost:${PORT}/api/properties/nearby?lat=26.8467&lng=80.9462&radius=5`);
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

module.exports = app;
