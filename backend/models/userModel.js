/**
 * User & Favorites Model
 * 
 * Handles user authentication records, details, and personal favorites.
 * Automatically chooses MongoDB or switches to in-memory state.
 */

const db = require('../database/pool');

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
                const collection = await db.getCollection('users');
                const newUser = {
                    id,
                    name,
                    email,
                    phone,
                    password_hash: passwordHash,
                    role,
                    is_verified: false,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                };
                await collection.insertOne(newUser);
                return newUser;
            } catch (err) {
                console.warn('MongoDB user insert failed in create(). Retrying in in-memory mode.');
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
                const collection = await db.getCollection('users');
                const user = await collection.findOne({
                    email: new RegExp(`^${escapeRegExp(email)}$`, 'i'),
                    is_active: { $ne: false },
                });
                if (user) return user;
            } catch (err) {
                console.warn(`MongoDB query failed in findByEmail(${email}). Retrying in in-memory mode.`);
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
                const collection = await db.getCollection('users');
                const user = await collection.findOne(
                    { id },
                    { projection: { _id: 0, id: 1, name: 1, email: 1, phone: 1, role: 1, is_verified: 1 } }
                );
                if (user) return user;
            } catch (err) {
                console.warn(`MongoDB query failed in findById(${id}). Retrying in in-memory mode.`);
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
                const collection = await db.getCollection('favorites');
                const createdAt = new Date().toISOString();
                await collection.updateOne(
                    { userId, propertyId },
                    { $setOnInsert: { userId, propertyId, createdAt, created_at: createdAt } },
                    { upsert: true }
                );
                return { userId, propertyId, createdAt };
            } catch (err) {
                console.warn('MongoDB insert failed in addFavorite(). Retrying in in-memory mode.');
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
                const collection = await db.getCollection('favorites');
                await collection.deleteOne({ userId, propertyId });
                return;
            } catch (err) {
                console.warn('MongoDB delete failed in removeFavorite(). Retrying in in-memory mode.');
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
                const collection = await db.getCollection('favorites');
                return await collection.countDocuments({ userId, propertyId }, { limit: 1 }) > 0;
            } catch (err) {
                console.warn('MongoDB query failed in isFavorited(). Retrying in in-memory mode.');
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
                const collection = await db.getCollection('favorites');
                const favorites = await collection
                    .find({ userId })
                    .sort({ createdAt: -1, created_at: -1 })
                    .toArray();

                const PropertyModel = require('./propertyModel');
                const list = [];
                for (const favorite of favorites) {
                    const prop = await PropertyModel.getById(favorite.propertyId);
                    if (prop) {
                        list.push({ ...prop, favorited_at: favorite.createdAt || favorite.created_at });
                    }
                }
                return list;
            } catch (err) {
                console.warn('MongoDB query failed in getFavorites(). Retrying in in-memory mode.');
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
