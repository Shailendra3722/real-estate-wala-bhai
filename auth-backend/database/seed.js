/**
 * Seed Script - Migrate Initial Properties to MongoDB
 * Run this once to populate the database with initial 8 properties
 */

require('dotenv').config();
const db = require('./db');

const INITIAL_PROPERTIES = [
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
        images: ['/images/prop_001_1.jpg', '/images/prop_001_2.jpg'],
        yearBuilt: 2020,
        verificationStatus: 'verified',
        isFeatured: true,
        ownerName: 'Rajesh Kumar',
        ownerPhone: '+919876543210',
        ownerEmail: 'rajesh@example.com'
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
        images: ['/images/prop_002_1.jpg'],
        yearBuilt: 2018,
        verificationStatus: 'verified',
        isFeatured: false,
        ownerName: 'Priya Sharma',
        ownerPhone: '+919845612378',
        ownerEmail: 'priya@example.com'
    },
    // Add remaining 6 properties...
];

async function seed() {
    console.log('🌱 Starting database seed...\n');

    try {
        for (const prop of INITIAL_PROPERTIES) {
            console.log(`Inserting: ${prop.title}...`);

            const properties = await db.getCollection('properties');
            await properties.updateOne(
                { id: prop.id },
                {
                    $setOnInsert: {
                        ...prop,
                        locationPoint: {
                            type: 'Point',
                            coordinates: [prop.longitude, prop.latitude],
                        },
                        status: 'active',
                        ownerVerified: true,
                        viewCount: 0,
                        contactCount: 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                },
                { upsert: true }
            );
        }

        console.log('\n✅ Seed completed successfully!');
        console.log(`📊 Inserted ${INITIAL_PROPERTIES.length} properties`);

        // Verify
        const properties = await db.getCollection('properties');
        const count = await properties.countDocuments();
        console.log(`🔍 Total properties in database: ${count}`);

        await db.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();
