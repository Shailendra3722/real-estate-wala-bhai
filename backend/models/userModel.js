/**
 * User & Favorites Model
 * 
 * Handles user authentication records, details, and personal favorites.
 * Automatically chooses database or switches to in-memory state.
 */

const db = require('../database/pool');

// Mock storage for user sessions and favorites in in-memory mode
const IN_MEMORY_USERS = [];
const IN_MEMORY_FAVORITES = []; // Format: { userId, propertyId, createdAt }

const UserModel = {
    /**
     * Create a new user account.
     */
    async create(userData) {
        if (!db.isInMemoryMode()) {
            try {
                const { id, name, email, phone, passwordHash, role } = userData;
                const sql = `
                    INSERT INTO users (id, name, email, phone, password_hash, role)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, name, email, phone, role, is_verified, created_at
                `;
                return await db.getOne(sql, [id, name, email, phone, passwordHash, role]);
            } catch (err) {
                console.warn('🔄 PostgreSQL user insert failed in create(). Retrying in in-memory mode.');
            }
        }

        const newUser = {
            id: userData.id || `user_${Date.now()}`,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password_hash: userData.passwordHash,
            role: userData.role || 'buyer',
            is_verified: false,
            is_active: true,
            created_at: new Date().toISOString()
        };
        IN_MEMORY_USERS.push(newUser);
        return newUser;
    },

    /**
     * Find a user record by email.
     */
    async findByEmail(email) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = 'SELECT * FROM users WHERE email = $1 AND is_active = TRUE';
                const user = await db.getOne(sql, [email]);
                if (user) return user;
            } catch (err) {
                console.warn(`🔄 PostgreSQL query failed in findByEmail(${email}). Retrying in in-memory mode.`);
            }
        }

        return IN_MEMORY_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.is_active !== false) || null;
    },

    /**
     * Find user profile details by ID.
     */
    async findById(id) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = 'SELECT id, name, email, phone, role, is_verified FROM users WHERE id = $1';
                const user = await db.getOne(sql, [id]);
                if (user) return user;
            } catch (err) {
                console.warn(`🔄 PostgreSQL query failed in findById(${id}). Retrying in in-memory mode.`);
            }
        }

        return IN_MEMORY_USERS.find(u => u.id === id) || null;
    },

    /**
     * Save property to favorites list.
     */
    async addFavorite(userId, propertyId) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = `
                    INSERT INTO favorites (user_id, property_id)
                    VALUES ($1, $2)
                    ON CONFLICT (user_id, property_id) DO NOTHING
                    RETURNING *
                `;
                return await db.getOne(sql, [userId, propertyId]);
            } catch (err) {
                console.warn('🔄 PostgreSQL insert failed in addFavorite(). Retrying in in-memory mode.');
            }
        }

        const exists = IN_MEMORY_FAVORITES.some(f => f.userId === userId && f.propertyId === propertyId);
        if (!exists) {
            IN_MEMORY_FAVORITES.push({ userId, propertyId, createdAt: new Date().toISOString() });
        }
        return { userId, propertyId };
    },

    /**
     * Remove property from favorites list.
     */
    async removeFavorite(userId, propertyId) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = 'DELETE FROM favorites WHERE user_id = $1 AND property_id = $2';
                await db.query(sql, [userId, propertyId]);
                return;
            } catch (err) {
                console.warn('🔄 PostgreSQL delete failed in removeFavorite(). Retrying in in-memory mode.');
            }
        }

        const index = IN_MEMORY_FAVORITES.findIndex(f => f.userId === userId && f.propertyId === propertyId);
        if (index !== -1) {
            IN_MEMORY_FAVORITES.splice(index, 1);
        }
    },

    /**
     * Check if a property is in user's favorites.
     */
    async isFavorited(userId, propertyId) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = `
                    SELECT EXISTS(
                        SELECT 1 FROM favorites
                        WHERE user_id = $1 AND property_id = $2
                    ) as is_favorited
                `;
                const result = await db.getOne(sql, [userId, propertyId]);
                return result ? result.is_favorited : false;
            } catch (err) {
                console.warn('🔄 PostgreSQL query failed in isFavorited(). Retrying in in-memory mode.');
            }
        }

        return IN_MEMORY_FAVORITES.some(f => f.userId === userId && f.propertyId === propertyId);
    },

    /**
     * Get user's favorited properties.
     */
    async getFavorites(userId) {
        if (!db.isInMemoryMode()) {
            try {
                const sql = `
                    SELECT 
                        p.*,
                        f.created_at as favorited_at
                    FROM favorites f
                    JOIN properties p ON f.property_id = p.id
                    WHERE f.user_id = $1
                    ORDER BY f.created_at DESC
                `;
                return await db.getAll(sql, [userId]);
            } catch (err) {
                console.warn('🔄 PostgreSQL query failed in getFavorites(). Retrying in in-memory mode.');
            }
        }

        const PropertyModel = require('./propertyModel');
        const favs = IN_MEMORY_FAVORITES.filter(f => f.userId === userId);
        const list = [];
        for (const f of favs) {
            const prop = await PropertyModel.getById(f.propertyId);
            if (prop) {
                list.push({ ...prop, favorited_at: f.createdAt });
            }
        }
        return list;
    }
};

module.exports = UserModel;
