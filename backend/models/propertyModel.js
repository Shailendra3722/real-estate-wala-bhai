/**
 * Property Model
 *
 * Manages properties data layer. Automatically selects PostgreSQL database queries
 * or switches to in-memory JSON fallback operations if database connection is unavailable.
 *
 * In-memory mode now persists user-submitted properties to a local JSON file so
 * listings survive server restarts without requiring a real PostgreSQL database.
 */

const db = require('../database/pool');
const { calculateDistance } = require('../services/distanceService');
const path = require('path');
const fs = require('fs');

// ── In-Memory Persistence ────────────────────────────────────────────────────

const USER_PROPERTIES_FILE = path.join(__dirname, '../data/user_properties.json');

/** Load the user-submitted properties that were saved to disk. */
function loadUserPropertiesFromDisk() {
    try {
        if (fs.existsSync(USER_PROPERTIES_FILE)) {
            const raw = fs.readFileSync(USER_PROPERTIES_FILE, 'utf8');
            return JSON.parse(raw) || [];
        }
    } catch (e) {
        console.warn('⚠️  Could not read user_properties.json:', e.message);
    }
    return [];
}

/** Persist user-submitted properties to disk. */
function saveUserPropertiesToDisk(list) {
    try {
        fs.mkdirSync(path.dirname(USER_PROPERTIES_FILE), { recursive: true });
        fs.writeFileSync(USER_PROPERTIES_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
        console.warn('⚠️  Could not write user_properties.json:', e.message);
    }
}

// Load static / mock listings from the frontend data file (read-only fallback).
let STATIC_PROPERTIES = [];
try {
    STATIC_PROPERTIES = require('../../frontend/js/api/realListingsData');
} catch (e) {
    console.warn('⚠️  Could not load static listings data. Initializing empty.');
}

// In-memory list of user-submitted properties (backed by the JSON file).
let USER_SUBMITTED = loadUserPropertiesFromDisk();

/** Merge static listings with user-submitted ones, de-duplicating by id. */
function getMergedInMemory() {
    const seen = new Set();
    const merged = [];
    // User-submitted listings come first (newest).
    for (const p of [...USER_SUBMITTED, ...STATIC_PROPERTIES]) {
        if (!seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
        }
    }
    return merged;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/** Normalize a raw property record into a consistent in-memory shape. */
function normalizeProperty(data, generatedId) {
    const id = data.id || generatedId || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
        id,
        title: data.title || `${data.bhk || ''} ${data.propertyType || 'Property'} in ${data.area || ''}`.trim(),
        description: data.description || '',
        price: parseFloat(data.price) || 0,
        propertyType: data.propertyType || data.property_type || 'flat',
        listingType: data.listingType || data.listing_type || 'sell',
        bhk: data.bhk || (data.bedrooms ? `${data.bedrooms} BHK` : '1 BHK'),
        bedrooms: parseInt(data.bedrooms) || parseInt((data.bhk || '1')) || 1,
        bathrooms: parseInt(data.bathrooms) || 1,
        sqft: parseFloat(data.sqft) || 0,
        furnishing: data.furnishing || data.furnished || 'unfurnished',
        parking: data.parking || 'no',

        // Location
        address: data.address || `${data.area || ''}, ${data.city || ''}`.trim(),
        city: data.city || '',
        area: data.area || '',
        state: data.state || '',
        country: data.country || 'India',
        pincode: data.pincode || '',
        latitude: parseFloat(data.latitude) || parseFloat(data.lat) || 0,
        longitude: parseFloat(data.longitude) || parseFloat(data.lng) || 0,

        // Media
        images: Array.isArray(data.images) ? data.images : (data.photos ? data.photos : []),
        featuredImage: data.featuredImage || (Array.isArray(data.images) && data.images[0]) || null,
        reels: Array.isArray(data.reels) ? data.reels : [],

        // Amenities
        amenities: Array.isArray(data.amenities) ? data.amenities : [],

        // Owner / Agent
        ownerId: data.ownerId || data.owner_id || 'anonymous',
        ownerName: data.ownerName || data.owner_name || data.name || 'Seller',
        ownerPhone: data.ownerPhone || data.owner_phone || data.contactNumber || data.phone || '',
        ownerEmail: data.ownerEmail || data.owner_email || data.email || '',
        agentName: data.agentName || data.ownerName || data.name || '',

        // Meta
        verificationStatus: data.verificationStatus || data.verification_status || 'under_review',
        isVerified: (data.verificationStatus || data.verification_status) === 'verified',
        isFeatured: data.isFeatured || data.featured || false,
        status: data.status || 'active',
        yearBuilt: data.yearBuilt || new Date().getFullYear(),
        viewCount: data.viewCount || data.view_count || 0,
        contactCount: data.contactCount || data.contact_count || 0,
        favoriteCount: data.favoriteCount || 0,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    };
}

// ── Property Model ─────────────────────────────────────────────────────────────

const PropertyModel = {

    /**
     * Get all active properties (merged static + user-submitted).
     */
    async getAll() {
        if (!db.isInMemoryMode()) {
            try {
                const sql = `
                    SELECT * FROM properties
                    WHERE status = 'active'
                    ORDER BY created_at DESC
                    LIMIT 200
                `;
                const rows = await db.getAll(sql);
                if (rows && rows.length > 0) return rows;
            } catch (err) {
                console.warn('🔄 PostgreSQL getAll() failed. Using in-memory mode.');
            }
        }
        return getMergedInMemory().filter(p => (p.status || 'active') === 'active');
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
                    LEFT JOIN users u ON p.owner_id = u.id
                    WHERE p.id = $1
                `;
                const prop = await db.getOne(sql, [id]);
                if (prop) return prop;
            } catch (err) {
                console.warn(`🔄 PostgreSQL getById(${id}) failed. Using in-memory mode.`);
            }
        }
        return getMergedInMemory().find(p => String(p.id) === String(id)) || null;
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
                console.warn('🔄 PostgreSQL findNearby() failed. Using in-memory mode.');
            }
        }

        return getMergedInMemory()
            .filter(p => (p.status || 'active') === 'active' && p.latitude && p.longitude)
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

                if (filters.query) {
                    sql += ` AND (title ILIKE $${paramIndex} OR city ILIKE $${paramIndex} OR area ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`;
                    params.push(`%${filters.query}%`);
                    paramIndex++;
                }
                if (filters.city) {
                    sql += ` AND city ILIKE $${paramIndex}`;
                    params.push(`%${filters.city}%`);
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
                if (filters.bedrooms) {
                    sql += ` AND bedrooms >= $${paramIndex}`;
                    params.push(parseInt(filters.bedrooms));
                    paramIndex++;
                }
                if (filters.bathrooms) {
                    sql += ` AND bathrooms >= $${paramIndex}`;
                    params.push(parseInt(filters.bathrooms));
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
                console.warn('🔄 PostgreSQL search() failed. Using in-memory mode.');
            }
        }

        let results = getMergedInMemory().filter(p => (p.status || 'active') === 'active');

        if (filters.query) {
            const q = filters.query.toLowerCase();
            results = results.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.city || '').toLowerCase().includes(q) ||
                (p.area || '').toLowerCase().includes(q) ||
                (p.address || '').toLowerCase().includes(q) ||
                (p.state || '').toLowerCase().includes(q)
            );
        }
        if (filters.city) {
            results = results.filter(p => (p.city || '').toLowerCase().includes(filters.city.toLowerCase()));
        }
        if (filters.listingType) {
            results = results.filter(p => (p.listingType || p.listing_type) === filters.listingType);
        }
        if (filters.minPrice) {
            results = results.filter(p => p.price >= Number(filters.minPrice));
        }
        if (filters.maxPrice) {
            results = results.filter(p => p.price <= Number(filters.maxPrice));
        }
        if (filters.bhk) {
            results = results.filter(p => p.bhk === filters.bhk);
        }
        if (filters.bedrooms) {
            results = results.filter(p => (p.bedrooms || 0) >= parseInt(filters.bedrooms));
        }
        if (filters.bathrooms) {
            results = results.filter(p => (p.bathrooms || 0) >= parseInt(filters.bathrooms));
        }
        if (filters.propertyType) {
            results = results.filter(p => (p.propertyType || p.property_type) === filters.propertyType);
        }
        if (filters.amenities && filters.amenities.length > 0) {
            results = results.filter(p =>
                filters.amenities.every(a => (p.amenities || []).includes(a))
            );
        }
        if (filters.verifiedOnly) {
            results = results.filter(p =>
                (p.verificationStatus || p.verification_status) === 'verified'
            );
        }

        return results;
    },

    /**
     * Create a new property listing.
     * Persists to the JSON file so it survives server restarts.
     */
    async create(propertyData) {
        if (!db.isInMemoryMode()) {
            try {
                const d = propertyData;
                const sql = `
                    INSERT INTO properties (
                        id, owner_id, title, description, property_type, listing_type,
                        bhk, bathrooms, sqft, furnishing, price,
                        latitude, longitude, address, city, area, state, country, pincode,
                        amenities, images, featured_image, is_featured,
                        verification_status, status, year_built,
                        owner_name, owner_phone, owner_email,
                        created_at, updated_at
                    ) VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                        $12,$13,$14,$15,$16,$17,$18,$19,
                        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
                    )
                    RETURNING *
                `;
                const normalized = normalizeProperty(d, d.id);
                const values = [
                    normalized.id,
                    normalized.ownerId,
                    normalized.title,
                    normalized.description,
                    normalized.propertyType,
                    normalized.listingType,
                    normalized.bhk,
                    normalized.bathrooms,
                    normalized.sqft,
                    normalized.furnishing,
                    normalized.price,
                    normalized.latitude,
                    normalized.longitude,
                    normalized.address,
                    normalized.city,
                    normalized.area,
                    normalized.state,
                    normalized.country,
                    normalized.pincode,
                    JSON.stringify(normalized.amenities),
                    JSON.stringify(normalized.images),
                    normalized.featuredImage,
                    normalized.isFeatured,
                    normalized.verificationStatus,
                    normalized.status,
                    normalized.yearBuilt,
                    normalized.ownerName,
                    normalized.ownerPhone,
                    normalized.ownerEmail,
                    normalized.createdAt,
                    normalized.updatedAt,
                ];
                const result = await db.getOne(sql, values);
                if (result) return result;
            } catch (err) {
                console.warn('🔄 PostgreSQL create() failed. Using in-memory mode. Error:', err.message);
            }
        }

        // In-memory + JSON file persistence
        const newProperty = normalizeProperty(propertyData);
        USER_SUBMITTED.unshift(newProperty); // newest first
        saveUserPropertiesToDisk(USER_SUBMITTED);
        console.log(`✅ Property saved to disk: ${newProperty.id} — ${newProperty.title}`);
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
                console.warn('🔄 PostgreSQL incrementView() failed. Using in-memory mode.');
            }
        }
        const merged = getMergedInMemory();
        const property = merged.find(p => String(p.id) === String(id));
        if (property) {
            property.viewCount = (property.viewCount || 0) + 1;
            // Only persist if it's a user-submitted property
            const userProp = USER_SUBMITTED.find(p => String(p.id) === String(id));
            if (userProp) {
                userProp.viewCount = property.viewCount;
                saveUserPropertiesToDisk(USER_SUBMITTED);
            }
        }
    },

    /**
     * Get total count of user-submitted properties (for debugging / stats).
     */
    getUserSubmittedCount() {
        return USER_SUBMITTED.length;
    }
};

module.exports = PropertyModel;
