/**
 * Real Estate Wala Bhai - Central Properties Data Collection
 * 
 * This module provides centralized property data storage and access methods.
 * All pages (Home, Map, Property Detail) should use this as the single source of truth.
 */

const PropertiesData = (function () {
    'use strict';

    // Verification status constants
    const VERIFICATION_STATUS = {
        PENDING: 'pending',
        VERIFIED: 'verified',
        REJECTED: 'rejected',
        IN_PROGRESS: 'in_progress',
        UNDER_REVIEW: 'under_review'
    };

    // Property types
    const PROPERTY_TYPES = {
        FLAT: 'flat',
        HOUSE: 'house',
        VILLA: 'villa',
        PLOT: 'plot',
        COMMERCIAL: 'commercial'
    };

    // Listing types
    const LISTING_TYPES = {
        SELL: 'sell',
        RENT: 'rent'
    };

    /**
     * Central properties database
     * Each property has:
     * - id: Unique identifier
     * - title: Property title
     * - price: Price in rupees
     * - bhk: Number of bedrooms (e.g., "2 BHK", "3 BHK")
     * - sqft: Area in square feet
     * - address: Full address
     * - city: City name
     * - area: Locality/Area name
     * - latitude: GPS latitude
     * - longitude: GPS longitude
     * - ownerId: User ID of the property owner
     * - verificationStatus: One of VERIFICATION_STATUS values
     * - propertyType: Type of property (flat, house, villa, etc.)
     * - listingType: sell or rent
     * - furnishing: Furnishing status (optional)
     * - bathrooms: Number of bathrooms
     * - images: Array of image URLs
     * - amenities: Array of amenities
     * - yearBuilt: Year of construction
     * - featured: Boolean indicating if property is featured
     * - createdAt: Date created
     */
    const properties = [
        {
            id: 'prop_001',
            title: '3 BHK Flat in Gomti Nagar',
            price: 8500000,
            bhk: '3 BHK',
            sqft: 1450,
            address: 'Sector 12, Gomti Nagar Extension, Lucknow',
            city: 'Lucknow',
            area: 'Gomti Nagar',
            street: 'Sector 12, Gomti Nagar Extension',
            landmark: 'Near Phoenix United Mall',
            latitude: 26.8467,
            longitude: 80.9462,
            ownerId: 'user_1234567890',
            ownerPhone: '9876543210',
            agentName: 'Rajesh Kumar',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
            propertyType: PROPERTY_TYPES.FLAT,
            listingType: LISTING_TYPES.SELL,
            furnishing: 'Semi Furnished',
            bathrooms: 2,
            images: [
                '/images/prop_001_1.jpg',
                '/images/prop_001_2.jpg',
                '/images/prop_001_3.jpg'
            ],
            amenities: ['Parking', 'Lift', 'Security', 'Park', 'Gym'],
            yearBuilt: 2020,
            featured: true,
            createdAt: new Date('2026-01-15')
        },
        {
            id: 'prop_002',
            title: '2 BHK Apartment in Alambagh',
            price: 4500000,
            bhk: '2 BHK',
            sqft: 980,
            address: 'Kanpur Road, Alambagh, Lucknow',
            city: 'Lucknow',
            area: 'Alambagh',
            street: 'Kanpur Road',
            landmark: 'Near Alambagh Bus Station',
            latitude: 26.8205,
            longitude: 80.8869,
            ownerId: 'user_9876543210',
            ownerPhone: '9845612378',
            agentName: 'Priya Sharma',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
            propertyType: PROPERTY_TYPES.FLAT,
            listingType: LISTING_TYPES.SELL,
            furnishing: 'Unfurnished',
            bathrooms: 2,
            images: [
                '/images/prop_002_1.jpg',
                '/images/prop_002_2.jpg'
            ],
            amenities: ['Parking', 'Lift', 'Security'],
            yearBuilt: 2018,
            featured: false,
            createdAt: new Date('2026-01-20')
        },
        {
            id: 'prop_003',
            title: 'Luxury 4 BHK Villa in Hazratganj',
            price: 25000000,
            bhk: '4 BHK',
            sqft: 3200,
            address: 'MG Marg, Hazratganj, Lucknow',
            city: 'Lucknow',
            area: 'Hazratganj',
            street: 'MG Marg',
            landmark: 'Near Hazratganj Market',
            latitude: 26.8547,
            longitude: 80.9470,
            ownerId: 'user_1122334455',
            ownerPhone: '9123456789',
            agentName: 'Amit Verma',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
            propertyType: PROPERTY_TYPES.VILLA,
            listingType: LISTING_TYPES.SELL,
            furnishing: 'Fully Furnished',
            bathrooms: 4,
            images: [
                '/images/prop_003_1.jpg',
                '/images/prop_003_2.jpg',
                '/images/prop_003_3.jpg',
                '/images/prop_003_4.jpg'
            ],
            amenities: ['Parking', 'Swimming Pool', 'Garden', 'Security', 'Gym', 'Home Theater'],
            yearBuilt: 2022,
            featured: true,
            createdAt: new Date('2026-01-10')
        },
        {
            id: 'prop_004',
            title: '2 BHK Flat for Rent in Indira Nagar',
            price: 18000,
            bhk: '2 BHK',
            sqft: 1100,
            address: 'Sector 15, Indira Nagar, Lucknow',
            city: 'Lucknow',
            area: 'Indira Nagar',
            street: 'Sector 15',
            landmark: 'Near Saharaganj Mall',
            latitude: 26.8780,
            longitude: 80.9920,
            ownerId: 'user_5566778899',
            ownerPhone: '9988776655',
            agentName: 'Sanjay Gupta',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
            propertyType: PROPERTY_TYPES.FLAT,
            listingType: LISTING_TYPES.RENT,
            furnishing: 'Semi Furnished',
            bathrooms: 2,
            images: [
                '/images/prop_004_1.jpg',
                '/images/prop_004_2.jpg'
            ],
            amenities: ['Parking', 'Lift', 'Security', 'Power Backup'],
            yearBuilt: 2019,
            featured: false,
            createdAt: new Date('2026-01-25')
        },
        {
            id: 'prop_005',
            title: 'Modern 3 BHK Apartment in Mahanagar',
            price: 7500000,
            bhk: '3 BHK',
            sqft: 1350,
            address: 'Sector A, Mahanagar Extension, Lucknow',
            city: 'Lucknow',
            area: 'Mahanagar',
            street: 'Sector A, Mahanagar Extension',
            landmark: 'Near KD Singh Stadium',
            latitude: 26.8850,
            longitude: 81.0050,
            ownerId: 'user_2233445566',
            ownerPhone: '9654321087',
            agentName: 'Neha Singh',
            verificationStatus: VERIFICATION_STATUS.IN_PROGRESS,
            propertyType: PROPERTY_TYPES.FLAT,
            listingType: LISTING_TYPES.SELL,
            furnishing: 'Semi Furnished',
            bathrooms: 2,
            images: [
                '/images/prop_005_1.jpg',
                '/images/prop_005_2.jpg',
                '/images/prop_005_3.jpg'
            ],
            amenities: ['Parking', 'Lift', 'Security', 'Park', 'Club House'],
            yearBuilt: 2021,
            featured: true,
            createdAt: new Date('2026-01-28')
        },
        {
            id: 'prop_006',
            title: 'Spacious 1 BHK in Aliganj',
            price: 3200000,
            bhk: '1 BHK',
            sqft: 650,
            address: 'Near Aliganj Railway Station, Lucknow',
            city: 'Lucknow',
            area: 'Aliganj',
            street: 'Railway Colony Road',
            landmark: 'Near Aliganj Railway Station',
            latitude: 26.8900,
            longitude: 80.9150,
            ownerId: 'user_7788990011',
            ownerPhone: '9765432109',
            agentName: 'Vikram Yadav',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
            propertyType: PROPERTY_TYPES.FLAT,
            listingType: LISTING_TYPES.SELL,
            furnishing: 'Unfurnished',
            bathrooms: 1,
            images: [
                '/images/prop_006_1.jpg'
            ],
            amenities: ['Parking', 'Security'],
            yearBuilt: 2017,
            featured: false,
            createdAt: new Date('2026-01-22')
        },
        {
            id: 'prop_007',
            title: 'Premium 4 BHK Penthouse in Sushant Golf City',
            price: 35000000,
            bhk: '4 BHK',
            sqft: 4000,
            address: 'Sushant Golf City, Amar Shaheed Path, Lucknow',
            city: 'Lucknow',
            area: 'Sushant Golf City',
            street: 'Amar Shaheed Path',
            landmark: 'Near Sushant Golf Course',
            latitude: 26.7920,
            longitude: 81.0340,
            ownerId: 'user_3344556677',
            ownerPhone: '9912345678',
            agentName: 'Kavita Mehta',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
            propertyType: PROPERTY_TYPES.FLAT,
            listingType: LISTING_TYPES.SELL,
            furnishing: 'Fully Furnished',
            bathrooms: 4,
            images: [
                '/images/prop_007_1.jpg',
                '/images/prop_007_2.jpg',
                '/images/prop_007_3.jpg',
                '/images/prop_007_4.jpg',
                '/images/prop_007_5.jpg'
            ],
            amenities: ['Parking', 'Lift', 'Swimming Pool', 'Gym', 'Security', 'Golf Course View', 'Terrace Garden'],
            yearBuilt: 2023,
            featured: true,
            createdAt: new Date('2026-01-05')
        },
        {
            id: 'prop_008',
            title: '3 BHK House in Jankipuram',
            price: 12000000,
            bhk: '3 BHK',
            sqft: 2000,
            address: 'Sector C, Jankipuram Extension, Lucknow',
            city: 'Lucknow',
            area: 'Jankipuram',
            street: 'Sector C, Jankipuram Extension',
            landmark: 'Near Fun Republic Mall',
            latitude: 26.8650,
            longitude: 80.8850,
            ownerId: 'user_4455667788',
            ownerPhone: '9834567890',
            agentName: 'Rahul Tripathi',
            verificationStatus: VERIFICATION_STATUS.PENDING,
            propertyType: PROPERTY_TYPES.HOUSE,
            listingType: LISTING_TYPES.SELL,
            furnishing: 'Semi Furnished',
            bathrooms: 3,
            images: [
                '/images/prop_008_1.jpg',
                '/images/prop_008_2.jpg'
            ],
            amenities: ['Parking', 'Garden', 'Security'],
            yearBuilt: 2020,
            featured: false,
            createdAt: new Date('2026-01-30')
        }
    ];

    // ==================== GETTER METHODS ====================

    /**
     * Get all properties
     * @returns {Array} All properties
     */
    function getAllProperties() {
        return [...properties]; // Return a copy to prevent mutation
    }

    /**
     * Get property by ID
     * @param {string} propertyId - Property ID
     * @returns {Object|null} Property object or null if not found
     */
    function getPropertyById(propertyId) {
        return properties.find(prop => prop.id === propertyId) || null;
    }

    /**
     * Get featured properties
     * @returns {Array} Featured properties
     */
    function getFeaturedProperties() {
        return properties.filter(prop => prop.featured);
    }

    /**
     * Get verified properties only
     * @returns {Array} Verified properties
     */
    function getVerifiedProperties() {
        return properties.filter(prop => prop.verificationStatus === VERIFICATION_STATUS.VERIFIED);
    }

    /**
     * Get properties by owner ID
     * @param {string} ownerId - Owner user ID
     * @returns {Array} Properties owned by the user
     */
    function getPropertiesByOwner(ownerId) {
        return properties.filter(prop => prop.ownerId === ownerId);
    }

    /**
     * Get properties by city
     * @param {string} city - City name
     * @returns {Array} Properties in the city
     */
    function getPropertiesByCity(city) {
        return properties.filter(prop =>
            prop.city.toLowerCase() === city.toLowerCase()
        );
    }

    /**
     * Get properties by area
     * @param {string} area - Area/locality name
     * @returns {Array} Properties in the area
     */
    function getPropertiesByArea(area) {
        return properties.filter(prop =>
            prop.area.toLowerCase().includes(area.toLowerCase())
        );
    }

    /**
     * Get properties by listing type (sell/rent)
     * @param {string} listingType - Listing type
     * @returns {Array} Properties matching listing type
     */
    function getPropertiesByListingType(listingType) {
        return properties.filter(prop => prop.listingType === listingType);
    }

    /**
     * Get properties within a price range
     * @param {number} minPrice - Minimum price
     * @param {number} maxPrice - Maximum price
     * @returns {Array} Properties within price range
     */
    function getPropertiesByPriceRange(minPrice, maxPrice) {
        return properties.filter(prop =>
            prop.price >= minPrice && prop.price <= maxPrice
        );
    }

    /**
     * Get properties within a geographic radius
     * @param {number} lat - Center latitude
     * @param {number} lng - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @returns {Array} Properties within radius
     */
    function getPropertiesNearby(lat, lng, radiusKm = 5) {
        return properties.filter(prop => {
            const distance = calculateDistance(lat, lng, prop.latitude, prop.longitude);
            return distance <= radiusKm;
        });
    }

    /**
     * Search properties by query (title, address, area)
     * @param {string} query - Search query
     * @returns {Array} Matching properties
     */
    function searchProperties(query) {
        const lowerQuery = query.toLowerCase();
        return properties.filter(prop =>
            prop.title.toLowerCase().includes(lowerQuery) ||
            prop.address.toLowerCase().includes(lowerQuery) ||
            prop.area.toLowerCase().includes(lowerQuery) ||
            prop.city.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Advanced filter properties
     * @param {Object} filters - Filter options
     * @param {string} filters.bhk - BHK requirement
     * @param {number} filters.minPrice - Minimum price
     * @param {number} filters.maxPrice - Maximum price
     * @param {string} filters.city - City
     * @param {string} filters.propertyType - Property type
     * @param {string} filters.listingType - Listing type (sell/rent)
     * @param {string} filters.verificationStatus - Verification status
     * @returns {Array} Filtered properties
     */
    function filterProperties(filters = {}) {
        let results = [...properties];

        if (filters.bhk) {
            results = results.filter(prop => prop.bhk === filters.bhk);
        }

        if (filters.minPrice !== undefined) {
            results = results.filter(prop => prop.price >= filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
            results = results.filter(prop => prop.price <= filters.maxPrice);
        }

        if (filters.city) {
            results = results.filter(prop =>
                prop.city.toLowerCase() === filters.city.toLowerCase()
            );
        }

        if (filters.propertyType) {
            results = results.filter(prop => prop.propertyType === filters.propertyType);
        }

        if (filters.listingType) {
            results = results.filter(prop => prop.listingType === filters.listingType);
        }

        if (filters.verificationStatus) {
            results = results.filter(prop => prop.verificationStatus === filters.verificationStatus);
        }

        return results;
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * @param {number} lat1 - Latitude 1
     * @param {number} lng1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lng2 - Longitude 2
     * @returns {number} Distance in kilometers
     */
    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Format price for display
     * @param {number} price - Price in rupees
     * @param {string} listingType - sell or rent
     * @returns {string} Formatted price string
     */
    function formatPrice(price, listingType = 'sell') {
        if (listingType === 'rent') {
            return `₹${price.toLocaleString('en-IN')}/month`;
        }

        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} Lakh`;
        } else {
            return `₹${price.toLocaleString('en-IN')}`;
        }
    }

    /**
     * Get verification status badge info
     * @param {string} status - Verification status
     * @returns {Object} Badge info with text and color
     */
    function getVerificationBadge(status) {
        const badges = {
            [VERIFICATION_STATUS.VERIFIED]: { text: '✓ Verified', color: '#22c55e' },
            [VERIFICATION_STATUS.PENDING]: { text: '⏳ Pending', color: '#fbbf24' },
            [VERIFICATION_STATUS.IN_PROGRESS]: { text: '🔄 In Progress', color: '#3b82f6' },
            [VERIFICATION_STATUS.REJECTED]: { text: '✗ Rejected', color: '#ef4444' }
        };
        return badges[status] || badges[VERIFICATION_STATUS.PENDING];
    }

    /**
     * Add a new property (for use when user posts a property)
     * @param {Object} propertyData - Property data
     * @returns {boolean} True if property was added successfully
     */
    function addProperty(propertyData) {
        try {
            const newProperty = {
                id: propertyData.id || 'prop_' + Date.now(),
                ...propertyData,
                verificationStatus: propertyData.verificationStatus || VERIFICATION_STATUS.UNDER_REVIEW,
                featured: propertyData.featured || false,
                createdAt: propertyData.createdAt || new Date()
            };
            properties.push(newProperty);
            console.log('✅ Property added successfully:', newProperty.id);
            return true;
        } catch (error) {
            console.error('❌ Error adding property:', error);
            return false;
        }
    }

    // Public API
    return {
        // Constants
        VERIFICATION_STATUS,
        PROPERTY_TYPES,
        LISTING_TYPES,

        // Getters
        getAllProperties,
        getPropertyById,
        getFeaturedProperties,
        getVerifiedProperties,
        getPropertiesByOwner,
        getPropertiesByCity,
        getPropertiesByArea,
        getPropertiesByListingType,
        getPropertiesByPriceRange,
        getPropertiesNearby,

        // Search & Filter
        searchProperties,
        filterProperties,

        // Utilities
        calculateDistance,
        formatPrice,
        getVerificationBadge,

        // Mutations
        addProperty
    };
})();

// Make it available globally
window.PropertiesData = PropertiesData;

console.log('✅ PropertiesData initialized with', PropertiesData.getAllProperties().length, 'properties');
