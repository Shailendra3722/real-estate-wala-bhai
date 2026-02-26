/**
 * Real Estate Wala Bhai - API Service Layer for Properties
 * 
 * This module provides centralized property data access through backend API.
 * Features: Caching, error handling, fallback to static data, utility functions.
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

    // Cache configuration
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    let propertiesCache = {
        data: null,
        timestamp: null
    };

    // ==================== API METHODS ====================

    /**
     * Check if cache is still valid
     */
    function isCacheValid() {
        if (!propertiesCache.data || !propertiesCache.timestamp) {
            return false;
        }
        const now = Date.now();
        return (now - propertiesCache.timestamp) < CACHE_DURATION;
    }

    /**
     * Fetch all properties from API
     * @returns {Promise<Array>} Properties array
     */
    async function fetchAllProperties() {
        // Return cached data if valid
        if (isCacheValid()) {
            console.log('📦 Returning cached properties');
            return propertiesCache.data;
        }

        try {
            console.log('🌐 Fetching properties from API...');
            const response = await ApiConfig.get(ApiConfig.endpoints.getAllProperties);

            if (response.success && response.properties) {
                // Transform API response to match frontend format
                const properties = response.properties.map(transformApiProperty);

                // Update cache
                propertiesCache = {
                    data: properties,
                    timestamp: Date.now()
                };

                console.log(`✅ Loaded ${properties.length} properties from API`);
                return properties;
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            console.error('❌ Failed to fetch properties from API:', error);

            // Fallback to static data from REAL_LISTINGS (loaded via real-listings-data.js)
            if (typeof window !== 'undefined' && window.REAL_LISTINGS && window.REAL_LISTINGS.length > 0) {
                console.warn('⚠️ Using fallback: static REAL_LISTINGS data');
                const fallbackData = window.REAL_LISTINGS.map(p => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    price: p.price,
                    bhk: p.bhk,
                    sqft: p.sqft,
                    address: p.address,
                    city: p.city,
                    area: p.area,
                    pincode: p.pincode,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    ownerId: p.owner?.id,
                    ownerPhone: p.owner?.phone,
                    agentName: p.owner?.name,
                    verificationStatus: p.verificationStatus,
                    propertyType: p.propertyType,
                    listingType: p.listingType,
                    furnishing: p.furnishing,
                    bathrooms: p.bathrooms,
                    images: p.images || [],
                    amenities: p.amenities || [],
                    yearBuilt: p.yearBuilt,
                    featured: p.isFeatured || false,
                    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                    viewCount: p.viewCount || 0,
                    contactCount: p.contactCount || 0
                }));
                propertiesCache = { data: fallbackData, timestamp: Date.now() };
                console.log(`✅ Loaded ${fallbackData.length} properties from static fallback`);
                return fallbackData;
            }

            console.warn('⚠️ No fallback data available, returning empty array');
            return [];
        }
    }

    /**
     * Transform API property to frontend format
     */
    function transformApiProperty(apiProp) {
        return {
            id: apiProp.id,
            title: apiProp.title,
            description: apiProp.description,
            price: apiProp.price,
            bhk: apiProp.bhk,
            sqft: apiProp.sqft,
            address: apiProp.location?.address || apiProp.address,
            city: apiProp.location?.city || apiProp.city,
            area: apiProp.location?.area || apiProp.area,
            pincode: apiProp.location?.pincode,
            latitude: apiProp.location?.latitude || apiProp.latitude,
            longitude: apiProp.location?.longitude || apiProp.longitude,
            ownerId: apiProp.owner?.id,
            ownerPhone: apiProp.owner?.phone,
            agentName: apiProp.owner?.name,
            verificationStatus: apiProp.verificationStatus,
            propertyType: apiProp.propertyType,
            listingType: apiProp.listingType,
            furnishing: apiProp.furnishing,
            bathrooms: apiProp.bathrooms,
            images: apiProp.images || [],
            amenities: apiProp.amenities || [],
            yearBuilt: apiProp.yearBuilt,
            featured: apiProp.isFeatured || apiProp.featured || false,
            createdAt: apiProp.createdAt ? new Date(apiProp.createdAt) : new Date(),
            viewCount: apiProp.viewCount || 0,
            contactCount: apiProp.contactCount || 0
        };
    }

    /**
     * Fetch property by ID from API
     * @param {string} propertyId - Property ID
     * @returns {Promise<Object|null>} Property object or null
     */
    async function fetchPropertyById(propertyId) {
        try {
            console.log(`🔍 Fetching property ${propertyId} from API...`);
            const response = await ApiConfig.get(ApiConfig.endpoints.getPropertyById(propertyId));

            if (response.success && response.property) {
                return transformApiProperty(response.property);
            } else {
                throw new Error('Property not found');
            }
        } catch (error) {
            console.error(`❌ Failed to fetch property ${propertyId}:`, error);
            return null;
        }
    }

    /**
     * Search properties via API
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching properties
     */
    async function fetchSearchResults(query) {
        try {
            // For now, fetch all and filter client-side
            // Can be optimized to use backend search endpoint later
            const allProperties = await fetchAllProperties();
            const lowerQuery = query.toLowerCase();

            return allProperties.filter(prop =>
                prop.title.toLowerCase().includes(lowerQuery) ||
                prop.address.toLowerCase().includes(lowerQuery) ||
                prop.area.toLowerCase().includes(lowerQuery) ||
                prop.city.toLowerCase().includes(lowerQuery)
            );
        } catch (error) {
            console.error('❌ Search failed:', error);
            return [];
        }
    }

    // ==================== GETTER METHODS ====================

    /**
     * Get all properties
     * @returns {Promise<Array>} All properties
     */
    async function getAllProperties() {
        return await fetchAllProperties();
    }

    /**
     * Get property by ID
     * @param {string} propertyId - Property ID
     * @returns {Promise<Object|null>} Property object or null if not found
     */
    async function getPropertyById(propertyId) {
        // Try to get from cache first
        if (isCacheValid() && propertiesCache.data) {
            const cached = propertiesCache.data.find(p => p.id === propertyId);
            if (cached) {
                console.log('📦 Returning cached property:', propertyId);
                return cached;
            }
        }

        // Fetch from API
        return await fetchPropertyById(propertyId);
    }

    /**
     * Get verified properties only
     * @returns {Promise<Array>} Verified properties
     */
    async function getVerifiedProperties() {
        const allProperties = await fetchAllProperties();
        return allProperties.filter(prop => prop.verificationStatus === VERIFICATION_STATUS.VERIFIED);
    }

    /**
     * Get properties by listing type (sell/rent)
     * @param {string} listingType - Listing type
     * @returns {Promise<Array>} Properties matching listing type
     */
    async function getPropertiesByType(listingType) {
        const allProperties = await fetchAllProperties();
        return allProperties.filter(prop =>
            prop.listingType === listingType &&
            prop.verificationStatus === VERIFICATION_STATUS.VERIFIED
        );
    }

    /**
     * Search properties by query
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching properties
     */
    async function searchProperties(query) {
        return await fetchSearchResults(query);
    }

    /**
     * Get properties by city
     * @param {string} city - City name
     * @returns {Promise<Array>} Properties in the city
     */
    async function getPropertiesByCity(city) {
        const allProperties = await fetchAllProperties();
        return allProperties.filter(prop =>
            prop.city.toLowerCase() === city.toLowerCase()
        );
    }

    /**
     * Get properties by area
     * @param {string} area - Area/locality name
     * @returns {Promise<Array>} Properties in the area
     */
    async function getPropertiesByArea(area) {
        const allProperties = await fetchAllProperties();
        return allProperties.filter(prop =>
            prop.area.toLowerCase().includes(area.toLowerCase())
        );
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Calculate distance between two coordinates (Haversine formula)
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
     * Clear cache (useful for refresh)
     */
    function clearCache() {
        propertiesCache = {
            data: null,
            timestamp: null
        };
        console.log('🗑️ Properties cache cleared');
    }

    // Public API
    return {
        // Constants
        VERIFICATION_STATUS,
        PROPERTY_TYPES,
        LISTING_TYPES,

        // Async Getters (all return Promises)
        getAllProperties,
        getPropertyById,
        getVerifiedProperties,
        getPropertiesByType,
        getPropertiesByCity,
        getPropertiesByArea,

        // Search
        searchProperties,

        // Utilities
        calculateDistance,
        formatPrice,
        getVerificationBadge,
        clearCache
    };
})();

// Make it available globally
window.PropertiesData = PropertiesData;

console.log('✅ PropertiesData API Service initialized');
