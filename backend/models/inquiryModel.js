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
                const sql = `
                    INSERT INTO inquiries (property_id, buyer_id, agent_id, message, contact_method)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;

                // Increment property contact count
                await db.query('UPDATE properties SET contact_count = contact_count + 1 WHERE id = $1', [propertyId]);

                return await db.getOne(sql, [propertyId, buyerId, agentId, message, contactMethod]);
            } catch (err) {
                console.warn('🔄 PostgreSQL insert failed in create() inquiry. Retrying in in-memory mode.');
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
                return await db.getAll(sql, [agentId]);
            } catch (err) {
                console.warn('🔄 PostgreSQL query failed in getByAgent() inquiries. Retrying in in-memory mode.');
            }
        }

        return IN_MEMORY_INQUIRIES.filter(i => i.agentId === agentId);
    }
};

module.exports = InquiryModel;
