/**
 * Property Controller
 * 
 * Intercepts HTTP requests for listings and coordinates with the Property Model.
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

// Helper: Standardize property schema for client compatibility
function formatPropertyResponse(prop, distance = null) {
    const lType = prop.listing_type || prop.listingType;
    const pType = prop.property_type || prop.propertyType;
    const vStatus = prop.verification_status || prop.verificationStatus || 'pending';
    const yrBuilt = prop.year_built || prop.yearBuilt;
    
    const formatted = {
        id: prop.id,
        title: prop.title,
        description: prop.description,
        propertyType: pType,
        listingType: lType,
        bhk: prop.bhk,
        bathrooms: prop.bathrooms,
        sqft: prop.sqft,
        furnishing: prop.furnishing,
        price: prop.price,
        priceFormatted: formatPrice(prop.price, lType),
        location: {
            latitude: parseFloat(prop.latitude),
            longitude: parseFloat(prop.longitude),
            address: prop.address,
            city: prop.city,
            area: prop.area,
            pincode: prop.pincode
        },
        amenities: prop.amenities || [],
        yearBuilt: yrBuilt,
        images: prop.images || [],
        verificationStatus: vStatus,
        isVerified: vStatus === 'verified',
        owner: prop.owner || {
            id: prop.owner_id,
            name: prop.owner_name || 'Agent',
            phone: prop.owner_phone || '',
            email: prop.owner_email || '',
            isVerified: prop.owner_verified || false
        },
        viewCount: prop.view_count || prop.viewCount || 0,
        contactCount: prop.contact_count || prop.contactCount || 0,
        status: prop.status || 'active',
        isFeatured: prop.is_featured || prop.isFeatured || false,
        createdAt: prop.created_at || prop.createdAt
    };

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
            const { page = 1, limit = 20 } = req.query;
            const properties = await Property.getAll();

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
                    error: 'Property not found',
                    propertyId: id
                });
            }

            // Increment views in background
            await Property.incrementView(id);

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
                    error: 'Missing coordinates',
                    message: 'lat and lng parameters are required'
                });
            }

            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const radiusKm = parseFloat(radius);

            if (isNaN(latitude) || latitude < -90 || latitude > 90) {
                return res.status(400).json({ error: 'Invalid latitude value' });
            }
            if (isNaN(longitude) || longitude < -180 || longitude > 180) {
                return res.status(400).json({ error: 'Invalid longitude value' });
            }
            if (isNaN(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
                return res.status(400).json({ error: 'Radius must be between 0 and 100 km' });
            }

            let properties = await Property.findNearby(latitude, longitude, radiusKm);

            // Post-filtering for custom specs
            if (listingType) {
                properties = properties.filter(p => (p.listing_type || p.listingType) === listingType);
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
            next(error);
        }
    },

    /**
     * POST /api/properties/search
     * Advanced property search filter
     */
    async search(req, res, next) {
        try {
            const filters = req.body;
            const properties = await Property.search(filters);

            res.json({
                success: true,
                count: properties.length,
                filters: filters,
                properties: properties.map(p => formatPropertyResponse(p))
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/properties
     * Creates a new property listing
     */
    async create(req, res, next) {
        try {
            const propertyData = req.body;
            const property = await Property.create(propertyData);

            res.status(201).json({
                success: true,
                message: 'Property listed successfully',
                property: formatPropertyResponse(property)
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = PropertyController;
