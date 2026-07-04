/**
 * Property Model
 * 
 * Manages properties data layer. Automatically selects PostgreSQL database queries
 * or switches to in-memory JSON fallback operations if database connection is unavailable.
 */

const db = require('../database/pool');
const { calculateDistance } = require('../services/distanceService');

// Load static/mock data for in-memory mode
// Relies on the structured listings data inside the frontend directory
let IN_MEMORY_PROPERTIES = [];
try {
    IN_MEMORY_PROPERTIES = require('../../frontend/js/api/realListingsData');
} catch (e) {
    console.warn('⚠️  Could not load static listings data in model. Initializing empty.');
}

const PropertyModel = {
    /**
     * Get all active properties.
     */
    async getAll() {
        if (!db.isInMemoryMode()) {
            try {
                const sql = `
                    SELECT * FROM properties 
                    WHERE status = 'active'
                    ORDER BY created_at DESC 
                    LIMIT 100
                `;
                return await db.getAll(sql);
            } catch (err) {
                console.warn('🔄 PostgreSQL query failed in getAll(). Retrying in in-memory mode.');
            }
        }
        return IN_MEMORY_PROPERTIES.filter(p => p.status === 'active');
    },

    /**
     * Get property by ID.
     */
    async getById(id) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = `
                    SELECT 
                        p.*,
                        u.name as owner_name,
                        u.phone as owner_phone,
                        u.email as owner_email,
                        u.is_verified as owner_verified
                    FROM properties p
                    JOIN users u ON p.owner_id = u.id
                    WHERE p.id = $1
                `;
                const prop = await db.getOne(sql, [id]);
                if (prop) return prop;
            } catch (err) {
                console.warn(`🔄 PostgreSQL query failed in getById(${id}). Retrying in in-memory mode.`);
            }
        }
        return IN_MEMORY_PROPERTIES.find(p => p.id === id) || null;
    },

    /**
     * Find properties within a given radius using coordinate distance.
     */
    async findNearby(lat, lng, radiusKm = 5) {
        if (!db.isInMemoryMode()) {
            try {
                const radiusMeters = radiusKm * 1000;
                const sql = `
                    SELECT 
                        *,
                        earth_distance(
                            ll_to_earth($1, $2),
                            ll_to_earth(latitude, longitude)
                        ) / 1000 AS distance_km
                    FROM properties
                    WHERE 
                        earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth(latitude, longitude)
                        AND status = 'active'
                    ORDER BY distance_km
                    LIMIT 50
                `;
                return await db.getAll(sql, [lat, lng, radiusMeters]);
            } catch (err) {
                console.warn('🔄 PostgreSQL query failed in findNearby(). Retrying in in-memory mode.');
            }
        }

        return IN_MEMORY_PROPERTIES
            .filter(p => p.status === 'active')
            .map(p => {
                const distance = calculateDistance(lat, lng, p.latitude, p.longitude);
                return { ...p, distance_km: distance };
            })
            .filter(p => p.distance_km <= radiusKm)
            .sort((a, b) => a.distance_km - b.distance_km);
    },

    /**
     * Search properties with dynamic filters.
     */
    async search(filters) {
        if (!db.isInMemoryMode()) {
            try {
                let sql = `SELECT * FROM properties WHERE status = 'active'`;
                const params = [];
                let paramIndex = 1;

                if (filters.city) {
                    sql += ` AND city = $${paramIndex}`;
                    params.push(filters.city);
                    paramIndex++;
                }
                if (filters.listingType) {
                    sql += ` AND listing_type = $${paramIndex}`;
                    params.push(filters.listingType);
                    paramIndex++;
                }
                if (filters.minPrice) {
                    sql += ` AND price >= $${paramIndex}`;
                    params.push(filters.minPrice);
                    paramIndex++;
                }
                if (filters.maxPrice) {
                    sql += ` AND price <= $${paramIndex}`;
                    params.push(filters.maxPrice);
                    paramIndex++;
                }
                if (filters.bhk) {
                    sql += ` AND bhk = $${paramIndex}`;
                    params.push(filters.bhk);
                    paramIndex++;
                }
                if (filters.propertyType) {
                    sql += ` AND property_type = $${paramIndex}`;
                    params.push(filters.propertyType);
                    paramIndex++;
                }
                if (filters.verifiedOnly) {
                    sql += ` AND verification_status = 'verified'`;
                }

                sql += ` ORDER BY created_at DESC LIMIT 100`;
                return await db.getAll(sql, params);
            } catch (err) {
                console.warn('🔄 PostgreSQL query failed in search(). Retrying in in-memory mode.');
            }
        }

        let results = IN_MEMORY_PROPERTIES.filter(p => p.status === 'active');

        if (filters.city) {
            results = results.filter(p => p.city.toLowerCase() === filters.city.toLowerCase());
        }
        if (filters.listingType) {
            results = results.filter(p => p.listingType === filters.listingType || p.listing_type === filters.listingType);
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
            results = results.filter(p => p.propertyType === filters.propertyType || p.property_type === filters.propertyType);
        }
        if (filters.verifiedOnly) {
            results = results.filter(p => p.verificationStatus === 'verified' || p.verification_status === 'verified');
        }

        return results;
    },

    /**
     * Create a new property listing.
     */
    async create(propertyData) {
        if (!db.isInMemoryMode()) {
            try {
                const {
                    id, ownerId, title, description, propertyType, listingType,
                    bhk, bathrooms, sqft, furnishing, price,
                    latitude, longitude, address, city, area, pincode,
                    amenities, images
                } = propertyData;

                const sql = `
                    INSERT INTO properties (
                        id, owner_id, title, description, property_type, listing_type,
                        bhk, bathrooms, sqft, furnishing, price,
                        latitude, longitude, address, city, area, pincode,
                        amenities, images
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                        $12, $13, $14, $15, $16, $17, $18, $19
                    )
                    RETURNING *
                `;

                return await db.getOne(sql, [
                    id, ownerId, title, description, propertyType, listingType,
                    bhk, bathrooms, sqft, furnishing, price,
                    latitude, longitude, address, city, area, pincode,
                    amenities, images
                ]);
            } catch (err) {
                console.warn('🔄 PostgreSQL insert failed in create(). Retrying in in-memory mode.');
            }
        }

        const newProperty = {
            id: propertyData.id || `prop_${Date.now()}`,
            ...propertyData,
            viewCount: 0,
            contactCount: 0,
            favoriteCount: 0,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        IN_MEMORY_PROPERTIES.push(newProperty);
        return newProperty;
    },

    /**
     * Increment view counter.
     */
    async incrementView(id) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = `UPDATE properties SET view_count = view_count + 1 WHERE id = $1`;
                await db.query(sql, [id]);
                return;
            } catch (err) {
                console.warn('🔄 PostgreSQL update failed in incrementView(). Retrying in in-memory mode.');
            }
        }

        const property = IN_MEMORY_PROPERTIES.find(p => p.id === id);
        if (property) {
            property.viewCount = (property.viewCount || 0) + 1;
        }
    }
};

module.exports = PropertyModel;
