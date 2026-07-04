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

const SAMPLE_PROPERTIES = [
    {
        id: 'prop_001',
        title: '3 BHK Flat in Gomti Nagar',
        description: 'Spacious 3 BHK apartment with modern amenities in prime location',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '3 BHK',
        bathrooms: 2,
        sqft: 1450,
        furnishing: 'semi-furnished',
        price: 8500000,
        latitude: 26.8467,
        longitude: 80.9462,
        address: 'Sector 12, Gomti Nagar Extension, Lucknow',
        city: 'Lucknow',
        area: 'Gomti Nagar',
        pincode: '226010',
        amenities: ['Parking', 'Lift', 'Security', 'Park', 'Gym'],
        images: ['/images/prop_001_1.jpg', '/images/prop_001_2.jpg', '/images/prop_001_3.jpg'],
        yearBuilt: 2020,
        ownerId: 'user_001'
    },
    {
        id: 'prop_002',
        title: '2 BHK Apartment in Alambagh',
        description: 'Affordable 2 BHK apartment near bus station',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '2 BHK',
        bathrooms: 2,
        sqft: 980,
        furnishing: 'unfurnished',
        price: 4500000,
        latitude: 26.8205,
        longitude: 80.8869,
        address: 'Kanpur Road, Alambagh, Lucknow',
        city: 'Lucknow',
        area: 'Alambagh',
        pincode: '226005',
        amenities: ['Parking', 'Lift', 'Security'],
        images: ['/images/prop_002_1.jpg', '/images/prop_002_2.jpg'],
        yearBuilt: 2018,
        ownerId: 'user_002'
    },
    {
        id: 'prop_003',
        title: 'Luxury 4 BHK Villa in Hazratganj',
        description: 'Premium villa with world-class amenities',
        propertyType: 'villa',
        listingType: 'sell',
        bhk: '4 BHK',
        bathrooms: 4,
        sqft: 3200,
        furnishing: 'fully-furnished',
        price: 25000000,
        latitude: 26.8547,
        longitude: 80.9470,
        address: 'MG Marg, Hazratganj, Lucknow',
        city: 'Lucknow',
        area: 'Hazratganj',
        pincode: '226001',
        amenities: ['Parking', 'Swimming Pool', 'Garden', 'Security', 'Gym', 'Home Theater'],
        images: ['/images/prop_003_1.jpg', '/images/prop_003_2.jpg', '/images/prop_003_3.jpg', '/images/prop_003_4.jpg'],
        yearBuilt: 2022,
        ownerId: 'user_001'
    }
];

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
