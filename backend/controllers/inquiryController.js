/**
 * Inquiry Controller
 * 
 * Handles contact requests from prospective buyers to listing agents.
 */

const Inquiry = require('../models/inquiryModel');
const Property = require('../models/propertyModel');

const InquiryController = {
    /**
     * POST /api/contact
     * Submit contact request for a property listing
     */
    async create(req, res, next) {
        try {
            const { propertyId, name, email, phone, message, contactMethod } = req.body;

            // Basic validation
            if (!propertyId) {
                return res.status(400).json({
                    error: 'Missing property ID',
                    message: 'propertyId parameter is required'
                });
            }

            if (!name || !phone) {
                return res.status(400).json({
                    error: 'Missing buyer details',
                    message: 'name and phone parameters are required'
                });
            }

            // Verify property existence and locate the listing owner
            const property = await Property.getById(propertyId);
            if (!property) {
                return res.status(404).json({
                    error: 'Property not found',
                    propertyId
                });
            }

            // Save inquiry
            const inquiry = await Inquiry.create({
                propertyId,
                buyerId: `guest_${Date.now()}`, // Temporary fallback until token-based profiles are enabled
                agentId: property.owner_id || (property.owner ? property.owner.id : 'agent_default'),
                message: message || `Contact request from ${name}.`,
                contactMethod: contactMethod || 'call'
            });

            res.json({
                success: true,
                message: 'Contact request submitted successfully',
                inquiryId: inquiry.id,
                contactInfo: { name, phone, email }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/inquiries
     * Retrieve inquiries for listing owner (requires auth)
     */
    async getMyInquiries(req, res, next) {
        try {
            const agentId = req.user.id;
            const inquiries = await Inquiry.getByAgent(agentId);

            res.json({
                success: true,
                count: inquiries.length,
                inquiries
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = InquiryController;
