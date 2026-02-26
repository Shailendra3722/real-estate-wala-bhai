/**
 * Database Seeding Script
 * Populates the database with sample data from properties-data.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./database-service');

// Sample data from properties-data.js
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
        ownerId: 'user_001',
        verificationStatus: 'verified',
        isFeatured: true
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
        ownerId: 'user_002',
        verificationStatus: 'verified',
        isFeatured: false
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
        ownerId: 'user_001',
        verificationStatus: 'verified',
        isFeatured: true
    },
    {
        id: 'prop_004',
        title: '2 BHK Flat for Rent in Indira Nagar',
        description: 'Well-maintained flat for rent near shopping mall',
        propertyType: 'flat',
        listingType: 'rent',
        bhk: '2 BHK',
        bathrooms: 2,
        sqft: 1100,
        furnishing: 'semi-furnished',
        price: 18000,
        latitude: 26.8780,
        longitude: 80.9920,
        address: 'Sector 15, Indira Nagar, Lucknow',
        city: 'Lucknow',
        area: 'Indira Nagar',
        pincode: '226016',
        amenities: ['Parking', 'Lift', 'Security', 'Power Backup'],
        images: ['/images/prop_004_1.jpg', '/images/prop_004_2.jpg'],
        yearBuilt: 2019,
        ownerId: 'user_003',
        verificationStatus: 'verified',
        isFeatured: false
    },
    {
        id: 'prop_005',
        title: 'Modern 3 BHK Apartment in Mahanagar',
        description: 'Contemporary design with all modern amenities',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '3 BHK',
        bathrooms: 2,
        sqft: 1350,
        furnishing: 'semi-furnished',
        price: 7500000,
        latitude: 26.8850,
        longitude: 81.0050,
        address: 'Sector A, Mahanagar Extension, Lucknow',
        city: 'Lucknow',
        area: 'Mahanagar',
        pincode: '226006',
        amenities: ['Parking', 'Lift', 'Security', 'Park', 'Club House'],
        images: ['/images/prop_005_1.jpg', '/images/prop_005_2.jpg', '/images/prop_005_3.jpg'],
        yearBuilt: 2021,
        ownerId: 'user_002',
        verificationStatus: 'in_progress',
        isFeatured: true
    },
    {
        id: 'prop_006',
        title: 'Spacious 1 BHK in Aliganj',
        description: 'Compact and well-designed 1 BHK apartment',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '1 BHK',
        bathrooms: 1,
        sqft: 650,
        furnishing: 'unfurnished',
        price: 3200000,
        latitude: 26.8900,
        longitude: 80.9150,
        address: 'Near Aliganj Railway Station, Lucknow',
        city: 'Lucknow',
        area: 'Aliganj',
        pincode: '226024',
        amenities: ['Parking', 'Security'],
        images: ['/images/prop_006_1.jpg'],
        yearBuilt: 2017,
        ownerId: 'user_003',
        verificationStatus: 'verified',
        isFeatured: false
    },
    {
        id: 'prop_007',
        title: 'Premium 4 BHK Penthouse in Sushant Golf City',
        description: 'Ultra-luxury penthouse with golf course view',
        propertyType: 'flat',
        listingType: 'sell',
        bhk: '4 BHK',
        bathrooms: 4,
        sqft: 4000,
        furnishing: 'fully-furnished',
        price: 35000000,
        latitude: 26.7920,
        longitude: 81.0340,
        address: 'Sushant Golf City, Amar Shaheed Path, Lucknow',
        city: 'Lucknow',
        area: 'Sushant Golf City',
        pincode: '226030',
        amenities: ['Parking', 'Lift', 'Swimming Pool', 'Gym', 'Security', 'Golf Course View', 'Terrace Garden'],
        images: ['/images/prop_007_1.jpg', '/images/prop_007_2.jpg', '/images/prop_007_3.jpg', '/images/prop_007_4.jpg', '/images/prop_007_5.jpg'],
        yearBuilt: 2023,
        ownerId: 'user_001',
        verificationStatus: 'verified',
        isFeatured: true
    },
    {
        id: 'prop_008',
        title: '3 BHK House in Jankipuram',
        description: 'Independent house with garden',
        propertyType: 'house',
        listingType: 'sell',
        bhk: '3 BHK',
        bathrooms: 3,
        sqft: 2000,
        furnishing: 'semi-furnished',
        price: 12000000,
        latitude: 26.8650,
        longitude: 80.8850,
        address: 'Sector C, Jankipuram Extension, Lucknow',
        city: 'Lucknow',
        area: 'Jankipuram',
        pincode: '226021',
        amenities: ['Parking', 'Garden', 'Security'],
        images: ['/images/prop_008_1.jpg', '/images/prop_008_2.jpg'],
        yearBuilt: 2020,
        ownerId: 'user_002',
        verificationStatus: 'pending',
        isFeatured: false
    }
];

// Sample users
const SAMPLE_USERS = [
    {
        id: 'user_001',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+919876543210',
        password: 'password123',
        role: 'agent',
        isVerified: true
    },
    {
        id: 'user_002',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+919845612378',
        password: 'password123',
        role: 'agent',
        isVerified: true
    },
    {
        id: 'user_003',
        name: 'Sanjay Gupta',
        email: 'sanjay.gupta@example.com',
        phone: '+919988776655',
        password: 'password123',
        role: 'agent',
        isVerified: true
    }
];

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // 1. Seed Users
        console.log('👥 Seeding users...');
        for (const user of SAMPLE_USERS) {
            try {
                // Check if user already exists
                const existing = await db.findUserByEmail(user.email);
                if (existing) {
                    console.log(`  ⏭️  User ${user.email} already exists, skipping`);
                    continue;
                }

                // Hash password
                const passwordHash = await bcrypt.hash(user.password, 10);

                await db.createUser({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    passwordHash: passwordHash,
                    role: user.role
                });

                console.log(`  ✅ Created user: ${user.name} (${user.email})`);
            } catch (error) {
                console.error(`  ❌ Error creating user ${user.email}:`, error.message);
            }
        }

        console.log('');

        // 2. Seed Properties
        console.log('🏠 Seeding properties...');
        for (const property of SAMPLE_PROPERTIES) {
            try {
                // Check if property already exists
                const existing = await db.getPropertyById(property.id);
                if (existing) {
                    console.log(`  ⏭️  Property ${property.id} already exists, skipping`);
                    continue;
                }

                await db.createProperty({
                    id: property.id,
                    ownerId: property.ownerId,
                    title: property.title,
                    description: property.description,
                    propertyType: property.propertyType,
                    listingType: property.listingType,
                    bhk: property.bhk,
                    bathrooms: property.bathrooms,
                    sqft: property.sqft,
                    furnishing: property.furnishing,
                    price: property.price,
                    latitude: property.latitude,
                    longitude: property.longitude,
                    address: property.address,
                    city: property.city,
                    area: property.area,
                    pincode: property.pincode,
                    amenities: property.amenities,
                    images: property.images
                });

                console.log(`  ✅ Created property: ${property.title}`);
            } catch (error) {
                console.error(`  ❌ Error creating property ${property.id}:`, error.message);
            }
        }

        console.log('\n✨ Database seeding completed!');
        console.log(`   Users: ${SAMPLE_USERS.length}`);
        console.log(`   Properties: ${SAMPLE_PROPERTIES.length}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        // Close database connection
        await db.pool.end();
        console.log('\n👋 Database connection closed');
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('🎉 Seeding script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding script failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
