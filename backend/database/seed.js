/**
 * Database Seeding Script
 * 
 * Populates PostgreSQL database tables with sample properties and user accounts
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
        console.warn('⚠️  Database is in in-memory mode. Seeding SQL skipped.');
        return;
    }

    try {
        // Seed Users
        console.log('👥 Seeding users...');
        for (const user of SAMPLE_USERS) {
            const exists = await db.getOne('SELECT 1 FROM users WHERE email = $1', [user.email]);
            if (exists) {
                console.log(`  ⏭️  User ${user.email} already exists, skipping`);
                continue;
            }

            const passwordHash = await bcrypt.hash(user.password, 10);
            await db.query(
                `INSERT INTO users (id, name, email, phone, password_hash, role)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [user.id, user.name, user.email, user.phone, passwordHash, user.role]
            );
            console.log(`  ✅ Created user: ${user.name} (${user.email})`);
        }

        // Seed Properties
        console.log('\n🏠 Seeding properties...');
        for (const prop of SAMPLE_PROPERTIES) {
            const exists = await db.getOne('SELECT 1 FROM properties WHERE id = $1', [prop.id]);
            if (exists) {
                console.log(`  ⏭️  Property ${prop.id} already exists, skipping`);
                continue;
            }

            await db.query(
                `INSERT INTO properties (
                    id, owner_id, title, description, property_type, listing_type,
                    bhk, bathrooms, sqft, furnishing, price,
                    latitude, longitude, address, city, area, pincode,
                    amenities, images
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                [
                    prop.id, prop.ownerId, prop.title, prop.description, prop.propertyType, prop.listingType,
                    prop.bhk, prop.bathrooms, prop.sqft, prop.furnishing, prop.price,
                    prop.latitude, prop.longitude, prop.address, prop.city, prop.area, prop.pincode,
                    prop.amenities, prop.images
                ]
            );
            console.log(`  ✅ Created property: ${prop.title}`);
        }

        console.log('\n✨ Database seeding completed successfully.');
    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);
        throw error;
    } finally {
        if (db.pool) {
            await db.pool.end();
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
