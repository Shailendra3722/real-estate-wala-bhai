/**
 * Database Seeding Script
 * 
 * Populates MongoDB collections with sample properties and user accounts
 * for testing and demonstration.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./pool');

const SAMPLE_USERS = [
    {
        id: 'user_001',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+919876543210',
        password: 'password123',
        role: 'agent'
    },
    {
        id: 'user_002',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+919845612378',
        password: 'password123',
        role: 'agent'
    },
    {
        id: 'user_003',
        name: 'Sanjay Gupta',
        email: 'sanjay.gupta@example.com',
        phone: '+919988776655',
        password: 'password123',
        role: 'agent'
    }
];

let SAMPLE_PROPERTIES = [];
try {
    const rawProperties = require('../../frontend/js/api/realListingsData');
    const userIds = SAMPLE_USERS.map(u => u.id);
    SAMPLE_PROPERTIES = rawProperties.map((prop, idx) => ({
        ...prop,
        bhk: `${prop.bhk} BHK`,
        ownerId: userIds[idx % userIds.length] // Assign owner to existing seeded user
    }));
    console.log(`Loaded ${SAMPLE_PROPERTIES.length} properties for database seeding.`);
} catch (e) {
    console.error('⚠️ Could not load realListingsData for seeding:', e);
}

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    if (db.isInMemoryMode()) {
        console.warn('Database is in in-memory mode. MongoDB seeding skipped.');
        return;
    }

    try {
        const users = await db.getCollection('users');
        const properties = await db.getCollection('properties');
        const PropertyModel = require('../models/propertyModel');

        // Seed Users
        console.log('👥 Seeding users...');
        for (const user of SAMPLE_USERS) {
            const exists = await users.findOne({ email: user.email });
            if (exists) {
                console.log(`  ⏭️  User ${user.email} already exists, skipping`);
                continue;
            }

            const passwordHash = await bcrypt.hash(user.password, 10);
            const createdAt = new Date().toISOString();
            await users.insertOne({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                password_hash: passwordHash,
                role: user.role,
                is_verified: false,
                is_active: true,
                created_at: createdAt,
                createdAt,
            });
            console.log(`  ✅ Created user: ${user.name} (${user.email})`);
        }

        // Seed Properties
        console.log('\n🏠 Seeding properties...');
        for (const prop of SAMPLE_PROPERTIES) {
            const exists = await properties.findOne({ id: prop.id });
            if (exists) {
                console.log(`  ⏭️  Property ${prop.id} already exists, skipping`);
                continue;
            }

            await PropertyModel.create(prop);
            console.log(`  ✅ Created property: ${prop.title}`);
        }

        console.log('\n✨ Database seeding completed successfully.');
    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);
        throw error;
    } finally {
        if (db.close) {
            await db.close();
            console.log('👋 Database connection closed');
        }
    }
}

if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
