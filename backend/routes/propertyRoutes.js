/**
 * Properties Route Definitions
 * 
 * Maps property retrieval, geospatial maps, search filters, and property listings
 * to the Property Controller.
 */

const express = require('express');
const router = express.Router();
const PropertyController = require('../controllers/propertyController');
const { verifyToken } = require('../middleware/auth');

// Public search and list queries
router.get('/', PropertyController.getAll);
router.get('/nearby', PropertyController.getNearby);
router.post('/search', PropertyController.search);
router.get('/:id', PropertyController.getById);

// Agent authenticated listings creation
router.post('/', verifyToken, PropertyController.create);

module.exports = router;
