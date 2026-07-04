/**
 * Favorites Route Definitions
 * 
 * Maps favorite retrieval and modifications.
 */

const express = require('express');
const router = express.Router();
const FavoritesController = require('../controllers/favoritesController');
const { verifyToken } = require('../middleware/auth');

// All favorites routes require authentication
router.use(verifyToken);

router.get('/', FavoritesController.getFavorites);
router.post('/', FavoritesController.addFavorite);
router.delete('/:id', FavoritesController.removeFavorite);

module.exports = router;
