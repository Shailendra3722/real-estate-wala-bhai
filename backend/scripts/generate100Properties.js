const fs = require('fs');
const path = require('path');

const CITIES = [
    { name: 'Mumbai', latMin: 18.90, latMax: 19.20, lngMin: 72.80, lngMax: 73.00, areas: ['Bandra', 'Andheri', 'Juhu', 'Colaba', 'Powai'] },
    { name: 'Delhi', latMin: 28.50, latMax: 28.70, lngMin: 77.10, lngMax: 77.30, areas: ['Connaught Place', 'Vasant Kunj', 'Saket', 'Dwarka', 'Rohini'] },
    { name: 'Bangalore', latMin: 12.90, latMax: 13.10, lngMin: 77.50, lngMax: 77.70, areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'] },
    { name: 'Hyderabad', latMin: 17.30, latMax: 17.50, lngMin: 78.30, lngMax: 78.50, areas: ['Banjara Hills', 'Jubilee Hills', 'HITEC City', 'Gachibowli', 'Madhapur'] },
    { name: 'Pune', latMin: 18.50, latMax: 18.70, lngMin: 73.80, lngMax: 74.00, areas: ['Koregaon Park', 'Kalyani Nagar', 'Viman Nagar', 'Hinjewadi', 'Baner'] },
    { name: 'Jaipur', latMin: 26.80, latMax: 27.00, lngMin: 75.70, lngMax: 75.90, areas: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C-Scheme', 'Bani Park'] }
];

const PROPERTY_TYPES = ['flat', 'house', 'villa', 'commercial'];
const LISTING_TYPES = ['sell', 'rent'];
const AMENITIES = ['Gym', 'Swimming Pool', 'Security', 'Parking', 'Club House', 'Park', 'Power Backup', 'Lift', 'Vastu Compliant'];
const IMAGES = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09c26471?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1c24240f38?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1920&q=80'
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function generateAmenities() {
    const count = Math.floor(getRandomNumber(3, 8));
    const shuffled = [...AMENITIES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateProperties(count) {
    const properties = [];
    
    for (let i = 1; i <= count; i++) {
        const city = getRandomItem(CITIES);
        const area = getRandomItem(city.areas);
        const type = getRandomItem(PROPERTY_TYPES);
        const listingType = getRandomItem(LISTING_TYPES);
        const bhk = Math.floor(getRandomNumber(1, 6));
        const bathrooms = Math.max(1, bhk - Math.floor(Math.random() * 2));
        const sqft = Math.floor(getRandomNumber(500, 4000));
        
        let price;
        if (listingType === 'rent') {
            price = Math.floor(getRandomNumber(10, 100)) * 1000;
        } else {
            price = Math.floor(getRandomNumber(20, 500)) * 100000;
        }

        const property = {
            id: `PROP${String(i).padStart(4, '0')}`,
            title: `Premium ${bhk} BHK ${type.charAt(0).toUpperCase() + type.slice(1)} in ${area}, ${city.name}`,
            description: `Experience luxury living with this stunning ${bhk} BHK ${type} located in the heart of ${area}, ${city.name}. Featuring modern amenities, spacious rooms, and excellent connectivity.`,
            price: price,
            bhk: bhk,
            bathrooms: bathrooms,
            sqft: sqft,
            propertyType: type,
            listingType: listingType,
            address: `Sector ${Math.floor(getRandomNumber(1, 50))}, ${area}`,
            city: city.name,
            area: area,
            state: 'State',
            country: 'India',
            pincode: `1${Math.floor(getRandomNumber(10000, 99999))}`,
            latitude: getRandomNumber(city.latMin, city.latMax),
            longitude: getRandomNumber(city.lngMin, city.lngMax),
            images: [
                getRandomItem(IMAGES),
                getRandomItem(IMAGES),
                getRandomItem(IMAGES)
            ],
            amenities: generateAmenities(),
            verificationStatus: Math.random() > 0.2 ? 'verified' : 'pending',
            isFeatured: Math.random() > 0.8,
            ownerId: `USER${String(Math.floor(getRandomNumber(1, 10))).padStart(4, '0')}`,
            ownerName: 'Real Estate Agent',
            ownerPhone: '+91 9876543210',
            status: 'active',
            createdAt: new Date(Date.now() - getRandomNumber(0, 30 * 24 * 60 * 60 * 1000)).toISOString(),
            viewCount: Math.floor(getRandomNumber(10, 500)),
            contactCount: Math.floor(getRandomNumber(1, 50))
        };
        
        properties.push(property);
    }
    
    return properties;
}

const properties = generateProperties(100);

const fileContent = `/**
 * Generated Realistic Properties for Real Estate Wala Bhai
 * (Contains 100 realistic properties across India)
 */
const propertiesData = ${JSON.stringify(properties, null, 4)};

if (typeof window !== 'undefined') {
    window.REAL_LISTINGS = propertiesData;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = propertiesData;
}
`;

const outputPath = path.join(__dirname, '../../frontend/js/api/realListingsData.js');
fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Successfully generated 100 properties and saved to ${outputPath}`);
