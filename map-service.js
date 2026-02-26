// ==========================================
// MAP SERVICE - Real API Integration
// ==========================================
// Connects map to backend API for dynamic property loading

const MapService = (function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:3000/api';
    const DEFAULT_RADIUS_KM = 5;
    const MAX_RADIUS_KM = 50;

    /**
     * Fetch properties near a location
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} radiusKm - Search radius in km
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Properties array
     */
    async function fetchNearbyProperties(lat, lng, radiusKm = DEFAULT_RADIUS_KM, filters = {}) {
        try {
            console.log(`🗺️ Fetching properties within ${radiusKm}km of (${lat}, ${lng})`);

            // Build query string
            const params = new URLSearchParams({
                lat: lat.toString(),
                lng: lng.toString(),
                radius: radiusKm.toString()
            });

            // Add optional filters
            if (filters.listingType) params.append('listingType', filters.listingType);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

            const url = `${API_BASE_URL}/properties/nearby?${params.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            console.log(`✅ Loaded ${data.count} properties`);

            return data.properties || [];

        } catch (error) {
            console.error('❌ Error fetching nearby properties:', error);

            // Fallback to local data if API fails
            console.warn('⚠️ Falling back to local data');
            return getFallbackProperties(lat, lng, radiusKm);
        }
    }

    /**
     * Fetch single property by ID
     * @param {string} propertyId
     * @returns {Promise<Object>}
     */
    async function fetchPropertyById(propertyId) {
        try {
            const url = `${API_BASE_URL}/properties/${propertyId}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Property not found: ${propertyId}`);
            }

            const data = await response.json();
            return data.property;

        } catch (error) {
            console.error('❌ Error fetching property:', error);
            // Fallback to PropertiesData
            return PropertiesData.getPropertyById(propertyId);
        }
    }

    /**
     * Search properties with advanced filters
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    async function searchProperties(filters) {
        try {
            const url = `${API_BASE_URL}/properties/search`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            return data.properties || [];

        } catch (error) {
            console.error('❌ Error searching properties:', error);
            // Fallback to local search
            return PropertiesData.filterProperties(filters);
        }
    }

    /**
     * Fallback properties when API is unavailable
     * Uses PropertiesData and calculates distance manually
     */
    function getFallbackProperties(lat, lng, radiusKm) {
        console.log('📦 Using local fallback data');

        const allProperties = PropertiesData.getVerifiedProperties();

        // Calculate distance and filter
        const nearbyProperties = allProperties
            .map(property => {
                const distance = calculateDistance(
                    lat, lng,
                    property.latitude, property.longitude
                );

                return {
                    ...property,
                    distanceKm: distance.toFixed(2),
                    distanceFormatted: `${distance.toFixed(1)} km away`
                };
            })
            .filter(property => property.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        return formatPropertiesForMap(nearbyProperties);
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * @returns {number} Distance in kilometers
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Format properties to match expected map structure
     */
    function formatPropertiesForMap(properties) {
        return properties.map(p => ({
            id: p.id,
            title: p.title,
            price: p.price || p.priceFormatted,
            bhk: p.bhk,
            sqft: p.sqft,
            propertyType: p.propertyType || p.property_type,
            listingType: p.listingType || p.listing_type,
            latitude: parseFloat(p.location?.latitude || p.latitude),
            longitude: parseFloat(p.location?.longitude || p.longitude),
            city: p.location?.city || p.city,
            area: p.location?.area || p.area,
            address: p.location?.address || p.address,
            verificationStatus: p.verificationStatus || p.verification_status,
            images: p.images || [],
            distanceKm: p.distanceKm,
            distanceFormatted: p.distanceFormatted,
            owner: p.owner || {
                name: p.ownerName,
                phone: p.ownerPhone
            }
        }));
    }

    /**
     * Get user's current location
     * @returns {Promise<Object>} { latitude, longitude }
     */
    function getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            console.log('📍 Getting user location...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };

                    console.log('✅ Location found:', location);
                    resolve(location);
                },
                (error) => {
                    console.warn('⚠️ Location error:', error.message);

                    // Fallback to Lucknow, India
                    const fallback = {
                        latitude: 26.8467,
                        longitude: 80.9462,
                        isFallback: true
                    };

                    console.log('📍 Using fallback location: Lucknow');
                    resolve(fallback);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    // Public API
    return {
        fetchNearbyProperties,
        fetchPropertyById,
        searchProperties,
        getUserLocation,
        calculateDistance,
        DEFAULT_RADIUS_KM,
        MAX_RADIUS_KM
    };
})();
