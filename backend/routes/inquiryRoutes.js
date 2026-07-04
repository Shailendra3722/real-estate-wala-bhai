/**
 * Contact Inquiry Route Definitions
 * 
 * Maps property contact requests and agent inquiry listing actions.
 */

const express = require('express');
const router = express.Router();
const InquiryController = require('../controllers/inquiryController');
const { verifyToken } = require('../middleware/auth');

// Public contact submission
router.post('/contact', InquiryController.create);

// Private agent inquiry queries
router.get('/inquiries', verifyToken, InquiryController.getMyInquiries);

module.exports = router;
