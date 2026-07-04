/**
 * Favorites Controller
 * 
 * Manages user favorite properties.
 */

const User = require('../models/userModel');
const Property = require('../models/propertyModel');

const FavoritesController = {
    /**
     * GET /api/favorites
     * Get all favorites for the current user
     */
    async getFavorites(req, res, next) {
        try {
            const userId = req.user.id;
            const favorites = await User.getFavorites(userId);
            
            res.json({
                success: true,
                favorites
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/favorites
     * Add a property to favorites
     */
    async addFavorite(req, res, next) {
        try {
            const userId = req.user.id;
            const { propertyId } = req.body;

            if (!propertyId) {
                return res.status(400).json({ success: false, message: 'Property ID is required' });
            }

            await User.addFavorite(userId, propertyId);
            
            res.json({
                success: true,
                message: 'Property added to favorites'
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /api/favorites/:id
     * Remove a property from favorites
     */
    async removeFavorite(req, res, next) {
        try {
            const userId = req.user.id;
            const propertyId = req.params.id;

            await User.removeFavorite(userId, propertyId);
            
            res.json({
                success: true,
                message: 'Property removed from favorites'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = FavoritesController;
