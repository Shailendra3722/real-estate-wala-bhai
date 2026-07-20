/**
 * Inquiry Model
 * 
 * Handles contact form submissions and buyer requests to agents.
 */

const db = require('../database/pool');

const IN_MEMORY_INQUIRIES = [];

const InquiryModel = {
    /**
     * Create a new contact inquiry.
     */
    async create(inquiryData) {
        const { propertyId, buyerId, agentId, message, contactMethod } = inquiryData;

        if (!db.isInMemoryMode()) {
            try {
                const createdAt = new Date().toISOString();
                const inquiry = {
                    id: `inquiry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    propertyId,
                    property_id: propertyId,
                    buyerId,
                    buyer_id: buyerId,
                    agentId,
                    agent_id: agentId,
                    message: message || 'Interested in viewing this property.',
                    contactMethod: contactMethod || 'call',
                    contact_method: contactMethod || 'call',
                    status: 'new',
                    createdAt,
                    created_at: createdAt,
                };

                const properties = await db.getCollection('properties');
                await properties.updateOne(
                    { id: String(propertyId) },
                    {
                        $inc: { contactCount: 1 },
                        $set: { updatedAt: new Date().toISOString() },
                    }
                );

                const inquiries = await db.getCollection('inquiries');
                await inquiries.insertOne(inquiry);
                return inquiry;
            } catch (err) {
                console.warn('MongoDB insert failed in create() inquiry. Retrying in in-memory mode.');
            }
        }

        const newInquiry = {
            id: IN_MEMORY_INQUIRIES.length + 1,
            propertyId,
            buyerId,
            agentId,
            message: message || 'Interested in viewing this property.',
            contactMethod: contactMethod || 'call',
            createdAt: new Date().toISOString()
        };
        IN_MEMORY_INQUIRIES.push(newInquiry);
        return newInquiry;
    },

    /**
     * Retrieve inquiries addressed to a specific agent.
     */
    async getByAgent(agentId) {
        if (!db.isInMemoryMode()) {
            try {
                const inquiries = await db.getCollection('inquiries');
                const rows = await inquiries
                    .find({ $or: [{ agentId }, { agent_id: agentId }] })
                    .sort({ createdAt: -1, created_at: -1 })
                    .toArray();

                const PropertyModel = require('./propertyModel');
                const UserModel = require('./userModel');
                const hydrated = [];

                for (const inquiry of rows) {
                    const property = await PropertyModel.getById(inquiry.propertyId || inquiry.property_id);
                    const buyer = await UserModel.findById(inquiry.buyerId || inquiry.buyer_id);
                    hydrated.push({
                        ...inquiry,
                        property_title: property?.title,
                        price: property?.price,
                        buyer_name: buyer?.name,
                        buyer_phone: buyer?.phone,
                        buyer_email: buyer?.email,
                    });
                }

                return hydrated;
            } catch (err) {
                console.warn('MongoDB query failed in getByAgent() inquiries. Retrying in in-memory mode.');
            }
        }

        return IN_MEMORY_INQUIRIES.filter(i => i.agentId === agentId);
    }
};

module.exports = InquiryModel;
