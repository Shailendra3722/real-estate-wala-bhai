// ==========================================
// DATABASE CONNECTION SETUP
// ==========================================
// Simple PostgreSQL connection example
// Install: npm install pg dotenv

require('dotenv').config();
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'real_estate_db',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Database connected');
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>}
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

/**
 * Get a single row
 */
async function getOne(text, params) {
    const result = await query(text, params);
    return result.rows[0] || null;
}

/**
 * Get multiple rows
 */
async function getAll(text, params) {
    const result = await query(text, params);
    return result.rows;
}

// ==========================================
// USER QUERIES
// ==========================================

/**
 * Create a new user (registration)
 */
async function createUser(userData) {
    const { id, name, email, phone, passwordHash, role } = userData;

    const sql = `
        INSERT INTO users (id, name, email, phone, password_hash, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    return await getOne(sql, [id, name, email, phone, passwordHash, role]);
}

/**
 * Find user by email (for login)
 */
async function findUserByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1 AND is_active = TRUE';
    return await getOne(sql, [email]);
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
    const sql = 'SELECT id, name, email, phone, role, is_verified FROM users WHERE id = $1';
    return await getOne(sql, [userId]);
}

// ==========================================
// PROPERTY QUERIES
// ==========================================

/**
 * Get all active properties
 */
async function getAllProperties() {
    const sql = `
        SELECT * FROM v_active_properties
        ORDER BY created_at DESC
        LIMIT 100
    `;
    return await getAll(sql);
}

/**
 * Get property by ID with owner details
 */
async function getPropertyById(propertyId) {
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
    return await getOne(sql, [propertyId]);
}

/**
 * CRITICAL: Find properties near a location (map query)
 * Uses PostgreSQL earthdistance extension
 * 
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @param {number} radiusKm - Search radius in kilometers (default 5km)
 * @returns {Array} Properties within radius
 */
async function findPropertiesNearby(lat, lng, radiusKm = 5) {
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

    return await getAll(sql, [lat, lng, radiusMeters]);
}

/**
 * Search properties with filters
 */
async function searchProperties(filters) {
    let sql = `
        SELECT * FROM properties
        WHERE status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    // City filter
    if (filters.city) {
        sql += ` AND city = $${paramIndex}`;
        params.push(filters.city);
        paramIndex++;
    }

    // Listing type (sell/rent)
    if (filters.listingType) {
        sql += ` AND listing_type = $${paramIndex}`;
        params.push(filters.listingType);
        paramIndex++;
    }

    // Price range
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

    // BHK
    if (filters.bhk) {
        sql += ` AND bhk = $${paramIndex}`;
        params.push(filters.bhk);
        paramIndex++;
    }

    // Property type
    if (filters.propertyType) {
        sql += ` AND property_type = $${paramIndex}`;
        params.push(filters.propertyType);
        paramIndex++;
    }

    // Only verified
    if (filters.verifiedOnly) {
        sql += ` AND verification_status = 'verified'`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    return await getAll(sql, params);
}

/**
 * Create a new property listing
 */
async function createProperty(propertyData) {
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

    return await getOne(sql, [
        id, ownerId, title, description, propertyType, listingType,
        bhk, bathrooms, sqft, furnishing, price,
        latitude, longitude, address, city, area, pincode,
        amenities, images
    ]);
}

/**
 * Update property view count
 */
async function incrementViewCount(propertyId) {
    const sql = `
        UPDATE properties 
        SET view_count = view_count + 1
        WHERE id = $1
    `;
    await query(sql, [propertyId]);
}

// ==========================================
// FAVORITES QUERIES
// ==========================================

/**
 * Add property to favorites
 */
async function addToFavorites(userId, propertyId) {
    const sql = `
        INSERT INTO favorites (user_id, property_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, property_id) DO NOTHING
        RETURNING *
    `;
    return await getOne(sql, [userId, propertyId]);
}

/**
 * Remove from favorites
 */
async function removeFromFavorites(userId, propertyId) {
    const sql = `
        DELETE FROM favorites
        WHERE user_id = $1 AND property_id = $2
    `;
    await query(sql, [userId, propertyId]);
}

/**
 * Get user's favorite properties
 */
async function getUserFavorites(userId) {
    const sql = `
        SELECT 
            p.*,
            f.created_at as favorited_at
        FROM favorites f
        JOIN properties p ON f.property_id = p.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
    `;
    return await getAll(sql, [userId]);
}

/**
 * Check if property is favorited by user
 */
async function isFavorited(userId, propertyId) {
    const sql = `
        SELECT EXISTS(
            SELECT 1 FROM favorites
            WHERE user_id = $1 AND property_id = $2
        ) as is_favorited
    `;
    const result = await getOne(sql, [userId, propertyId]);
    return result.is_favorited;
}

// ==========================================
// INQUIRIES QUERIES
// ==========================================

/**
 * Create a contact inquiry
 */
async function createInquiry(inquiryData) {
    const { propertyId, buyerId, agentId, message, contactMethod } = inquiryData;

    const sql = `
        INSERT INTO inquiries (property_id, buyer_id, agent_id, message, contact_method)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;

    // Also increment property contact count
    await query('UPDATE properties SET contact_count = contact_count + 1 WHERE id = $1', [propertyId]);

    return await getOne(sql, [propertyId, buyerId, agentId, message, contactMethod]);
}

/**
 * Get agent's inquiries
 */
async function getAgentInquiries(agentId) {
    const sql = `
        SELECT 
            i.*,
            p.title as property_title,
            p.price,
            u.name as buyer_name,
            u.phone as buyer_phone,
            u.email as buyer_email
        FROM inquiries i
        JOIN properties p ON i.property_id = p.id
        JOIN users u ON i.buyer_id = u.id
        WHERE i.agent_id = $1
        ORDER BY i.created_at DESC
    `;
    return await getAll(sql, [agentId]);
}

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================

module.exports = {
    pool,
    query,

    // User functions
    createUser,
    findUserByEmail,
    getUserById,

    // Property functions
    getAllProperties,
    getPropertyById,
    findPropertiesNearby,
    searchProperties,
    createProperty,
    incrementViewCount,

    // Favorites functions
    addToFavorites,
    removeFromFavorites,
    getUserFavorites,
    isFavorited,

    // Inquiry functions
    createInquiry,
    getAgentInquiries,
};

// ==========================================
// USAGE EXAMPLES
// ==========================================

/*
// Example 1: Find properties near user
const nearbyProperties = await findPropertiesNearby(26.8467, 80.9462, 5);
console.log('Found', nearbyProperties.length, 'properties within 5km');

// Example 2: Search with filters
const filteredProperties = await searchProperties({
    city: 'Lucknow',
    listingType: 'sell',
    minPrice: 3000000,
    maxPrice: 10000000,
    bhk: '3 BHK',
    verifiedOnly: true
});

// Example 3: Add to favorites
await addToFavorites('user_123', 'prop_001');

// Example 4: Get property with owner
const property = await getPropertyById('prop_001');
console.log(`Property: ${property.title}`);
console.log(`Owner: ${property.owner_name} (${property.owner_phone})`);

// Example 5: Create inquiry
await createInquiry({
    propertyId: 'prop_001',
    buyerId: 'user_456',
    agentId: 'user_123',
    message: 'Interested in viewing this property',
    contactMethod: 'whatsapp'
});
*/
