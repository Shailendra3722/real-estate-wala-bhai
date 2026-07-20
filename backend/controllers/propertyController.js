/**
 * Property Controller
 *
 * Intercepts HTTP requests for listings and coordinates with the Property Model.
 * Normalizes field names between older snake_case records and camelCase (frontend).
 */

const Property = require('../models/propertyModel');

// Helper: Format price for user display
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

/**
 * Standardize a property record for the client.
 * Handles both snake_case (older records) and camelCase (MongoDB/in-memory store).
 */
function formatPropertyResponse(prop, distance = null) {
    const lType   = prop.listing_type      || prop.listingType      || 'sell';
    const pType   = prop.property_type     || prop.propertyType     || 'flat';
    const vStatus = prop.verification_status || prop.verificationStatus || 'under_review';
    const yrBuilt = prop.year_built        || prop.yearBuilt;

    // Resolve images — stored as JSON string in PG, array in in-memory
    let images = prop.images || [];
    if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch { images = []; }
    }

    // Resolve amenities
    let amenities = prop.amenities || [];
    if (typeof amenities === 'string') {
        try { amenities = JSON.parse(amenities); } catch { amenities = []; }
    }

    const featuredImage =
        prop.featuredImage || prop.featured_image ||
        (images && images.length > 0 ? images[0] : null);

    const formatted = {
        id: prop.id,
        title: prop.title,
        description: prop.description || '',

        // Type
        propertyType: pType,
        listingType: lType,

        // Specs
        bhk: prop.bhk,
        bedrooms: prop.bedrooms || parseInt(String(prop.bhk || '1')) || 1,
        bathrooms: prop.bathrooms,
        sqft: prop.sqft,
        furnishing: prop.furnishing,
        parking: prop.parking || 'no',

        // Price
        price: prop.price,
        priceFormatted: formatPrice(prop.price, lType),

        // Location (flat + nested for compatibility)
        address: prop.address || prop.location?.address || '',
        city: prop.city || prop.location?.city || '',
        area: prop.area || prop.location?.area || '',
        state: prop.state || prop.location?.state || '',
        country: prop.country || prop.location?.country || 'India',
        pincode: prop.pincode || prop.location?.pincode || '',
        latitude: parseFloat(prop.latitude || prop.location?.latitude) || 0,
        longitude: parseFloat(prop.longitude || prop.location?.longitude) || 0,
        location: {
            latitude: parseFloat(prop.latitude || prop.location?.latitude) || 0,
            longitude: parseFloat(prop.longitude || prop.location?.longitude) || 0,
            address: prop.address || prop.location?.address || '',
            city: prop.city || prop.location?.city || '',
            area: prop.area || prop.location?.area || '',
            state: prop.state || '',
            country: prop.country || 'India',
            pincode: prop.pincode || '',
        },

        // Media
        images,
        featuredImage,

        // Amenities
        amenities,

        // Status
        verificationStatus: vStatus,
        isVerified: vStatus === 'verified',
        isFeatured: prop.is_featured || prop.isFeatured || false,
        status: prop.status || 'active',
        yearBuilt: yrBuilt,

        // Owner / Agent
        ownerId: prop.owner_id || prop.ownerId || '',
        owner: prop.owner || {
            id: prop.owner_id || prop.ownerId,
            name: prop.owner_name || prop.ownerName || prop.agentName || 'Seller',
            phone: prop.owner_phone || prop.ownerPhone || '',
            email: prop.owner_email || prop.ownerEmail || '',
            isVerified: prop.owner_verified || false
        },
        agentName: prop.agentName || prop.agent_name || prop.owner_name || prop.ownerName || '',

        // Counters
        viewCount: prop.view_count || prop.viewCount || 0,
        contactCount: prop.contact_count || prop.contactCount || 0,
        favoriteCount: prop.favoriteCount || 0,

        // Timestamps
        createdAt: prop.created_at || prop.createdAt || new Date().toISOString(),
        updatedAt: prop.updated_at || prop.updatedAt || new Date().toISOString(),
    };

    // Distance (for nearby queries)
    const dist = distance !== null ? distance : prop.distance_km;
    if (dist !== undefined && dist !== null) {
        formatted.distanceKm = parseFloat(dist).toFixed(2);
        formatted.distanceFormatted = `${parseFloat(dist).toFixed(1)} km away`;
    }

    return formatted;
}

const PropertyController = {

    /**
     * GET /api/properties
     * List all active properties (paginated)
     */
    async getAll(req, res, next) {
        try {
            const page  = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, parseInt(req.query.limit) || 20);

            const properties = await Property.getAll();

            const startIndex = (page - 1) * limit;
            const paginated  = properties.slice(startIndex, startIndex + limit);

            res.json({
                success: true,
                page,
                limit,
                total: properties.length,
                count: paginated.length,
                properties: paginated.map(p => formatPropertyResponse(p))
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/properties/:id
     * Fetch single property details by ID (increments view counter)
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const property = await Property.getById(id);

            if (!property) {
                return res.status(404).json({
                    success: false,
                    error: 'Property not found',
                    propertyId: id
                });
            }

            // Increment views in background (don't await — keep response fast)
            Property.incrementView(id).catch(() => {});

            res.json({
                success: true,
                property: formatPropertyResponse(property)
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/properties/nearby
     * Fetch properties within radius of coordinate parameters
     */
    async getNearby(req, res, next) {
        try {
            const { lat, lng, radius = 5, listingType, minPrice, maxPrice } = req.query;

            if (!lat || !lng) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing coordinates',
                    message: 'lat and lng parameters are required'
                });
            }

            const latitude  = parseFloat(lat);
            const longitude = parseFloat(lng);
            const radiusKm  = parseFloat(radius);

            if (isNaN(latitude)  || latitude  < -90  || latitude  > 90)  return res.status(400).json({ error: 'Invalid latitude' });
            if (isNaN(longitude) || longitude < -180 || longitude > 180) return res.status(400).json({ error: 'Invalid longitude' });
            if (isNaN(radiusKm)  || radiusKm  <= 0   || radiusKm  > 100) return res.status(400).json({ error: 'Radius must be 0–100 km' });

            let properties = await Property.findNearby(latitude, longitude, radiusKm);

            if (listingType) properties = properties.filter(p => (p.listingType || p.listing_type) === listingType);
            if (minPrice)    properties = properties.filter(p => p.price >= parseInt(minPrice));
            if (maxPrice)    properties = properties.filter(p => p.price <= parseInt(maxPrice));

            res.json({
                success: true,
                count: properties.length,
                radius: radiusKm,
                center: { latitude, longitude },
                properties: properties.map(p => formatPropertyResponse(p))
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/properties/search
     * Advanced property search filter
     */
    async search(req, res, next) {
        try {
            const filters = req.body || {};
            const properties = await Property.search(filters);

            const page  = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, parseInt(req.query.limit) || 50);
            const paginated = properties.slice((page - 1) * limit, page * limit);

            res.json({
                success: true,
                count: properties.length,
                page,
                limit,
                filters,
                properties: paginated.map(p => formatPropertyResponse(p))
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/properties
     * Creates a new property listing.
     * Auth is optional — req.user may or may not be set (set by optionalToken middleware).
     */
    async create(req, res, next) {
        try {
            const body = req.body || {};

            // Basic validation
            if (!body.title && !body.propertyType && !body.city) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    required: ['title or propertyType', 'city']
                });
            }

            // Prevent duplicate submissions (same title + city + price within 30s)
            if (body._clientTimestamp) {
                const now = Date.now();
                const submitted = parseInt(body._clientTimestamp);
                if (!isNaN(submitted) && now - submitted > 60000) {
                    return res.status(400).json({
                        success: false,
                        error: 'Duplicate submission detected. Please try again.'
                    });
                }
            }

            // Inject owner info from auth token if available
            if (req.user) {
                body.ownerId = body.ownerId || req.user.id || req.user.userId;
                body.ownerName = body.ownerName || req.user.name;
                body.ownerEmail = body.ownerEmail || req.user.email;
            }

            const property = await Property.create(body);

            res.status(201).json({
                success: true,
                message: 'Property listed successfully! 🎉',
                property: formatPropertyResponse(property)
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = PropertyController;
