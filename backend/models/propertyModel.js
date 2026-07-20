/**
 * Property Model
 *
 * Manages properties data layer. Automatically selects MongoDB queries
 * or switches to in-memory JSON fallback operations if database connection is unavailable.
 *
 * In-memory mode now persists user-submitted properties to a local JSON file so
 * listings survive server restarts without requiring a real MongoDB database.
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

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    const latitude = parseFloat(data.latitude) || parseFloat(data.lat) || parseFloat(data.location?.latitude) || 0;
    const longitude = parseFloat(data.longitude) || parseFloat(data.lng) || parseFloat(data.location?.longitude) || 0;
    const property = {
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
        latitude,
        longitude,

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

    if (latitude && longitude) {
        property.locationPoint = {
            type: 'Point',
            coordinates: [longitude, latitude],
        };
    }

    return property;
}

function newestFirstSort(a, b) {
    return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0);
}

function buildSearchQuery(filters) {
    const clauses = [{ status: 'active' }];

    if (filters.query) {
        const pattern = new RegExp(escapeRegExp(filters.query), 'i');
        clauses.push({
            $or: [
                { title: pattern },
                { city: pattern },
                { area: pattern },
                { address: pattern },
                { state: pattern },
            ],
        });
    }

    if (filters.city) {
        clauses.push({ city: new RegExp(escapeRegExp(filters.city), 'i') });
    }
    if (filters.listingType) {
        clauses.push({ $or: [{ listingType: filters.listingType }, { listing_type: filters.listingType }] });
    }
    if (filters.minPrice) {
        clauses.push({ price: { $gte: Number(filters.minPrice) } });
    }
    if (filters.maxPrice) {
        clauses.push({ price: { $lte: Number(filters.maxPrice) } });
    }
    if (filters.minPrice && filters.maxPrice) {
        clauses.pop();
        clauses.pop();
        clauses.push({ price: { $gte: Number(filters.minPrice), $lte: Number(filters.maxPrice) } });
    }
    if (filters.bhk) {
        clauses.push({ bhk: filters.bhk });
    }
    if (filters.bedrooms) {
        clauses.push({ bedrooms: { $gte: parseInt(filters.bedrooms) } });
    }
    if (filters.bathrooms) {
        clauses.push({ bathrooms: { $gte: parseInt(filters.bathrooms) } });
    }
    if (filters.propertyType) {
        clauses.push({ $or: [{ propertyType: filters.propertyType }, { property_type: filters.propertyType }] });
    }
    if (filters.amenities && filters.amenities.length > 0) {
        clauses.push({ amenities: { $all: filters.amenities } });
    }
    if (filters.verifiedOnly) {
        clauses.push({
            $or: [
                { verificationStatus: 'verified' },
                { verification_status: 'verified' },
            ],
        });
    }

    return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

// ── Property Model ─────────────────────────────────────────────────────────────

const PropertyModel = {

    /**
     * Get all active properties (merged static + user-submitted).
     */
    async getAll() {
        if (!db.isInMemoryMode()) {
            try {
                const collection = await db.getCollection('properties');
                const rows = await collection
                    .find({ status: 'active' })
                    .sort({ createdAt: -1, created_at: -1 })
                    .limit(200)
                    .toArray();
                if (rows && rows.length > 0) return rows;
            } catch (err) {
                console.warn('MongoDB getAll() failed. Using in-memory mode.');
            }
        }
        return getMergedInMemory()
            .filter(p => (p.status || 'active') === 'active')
            .sort(newestFirstSort);
    },

    /**
     * Get property by ID.
     */
    async getById(id) {
        if (!db.isInMemoryMode()) {
            try {
                const collection = await db.getCollection('properties');
                const prop = await collection.findOne({ id: String(id) });
                if (prop) return prop;
            } catch (err) {
                console.warn(`MongoDB getById(${id}) failed. Using in-memory mode.`);
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
                const collection = await db.getCollection('properties');
                const candidates = await collection
                    .find({
                        status: 'active',
                        latitude: { $type: 'number' },
                        longitude: { $type: 'number' },
                    })
                    .limit(500)
                    .toArray();

                return candidates
                    .map(p => ({ ...p, distance_km: calculateDistance(lat, lng, p.latitude, p.longitude) }))
                    .filter(p => p.distance_km <= radiusKm)
                    .sort((a, b) => a.distance_km - b.distance_km)
                    .slice(0, 50);
            } catch (err) {
                console.warn('MongoDB findNearby() failed. Using in-memory mode.');
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
                const collection = await db.getCollection('properties');
                return await collection
                    .find(buildSearchQuery(filters))
                    .sort({ createdAt: -1, created_at: -1 })
                    .limit(100)
                    .toArray();
            } catch (err) {
                console.warn('MongoDB search() failed. Using in-memory mode.');
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
                const collection = await db.getCollection('properties');
                const normalized = normalizeProperty(propertyData, propertyData.id);
                await collection.insertOne(normalized);
                return normalized;
            } catch (err) {
                console.warn('MongoDB create() failed. Using in-memory mode. Error:', err.message);
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
                const collection = await db.getCollection('properties');
                const result = await collection.updateOne(
                    { id: String(id) },
                    {
                        $inc: { viewCount: 1 },
                        $set: { updatedAt: new Date().toISOString() },
                    }
                );
                if (result.matchedCount > 0) return;
            } catch (err) {
                console.warn('MongoDB incrementView() failed. Using in-memory mode.');
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
