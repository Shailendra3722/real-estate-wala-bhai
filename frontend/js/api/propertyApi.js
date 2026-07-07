/**
 * Real Estate Wala Bhai - API Service Layer for Properties
 *
 * Provides centralized property data access through the backend API.
 * Features: Caching, error handling, fallback to static data, full CRUD.
 */

const PropertiesData = (function () {
    'use strict';

    // ── Constants ──────────────────────────────────────────────────────────────

    const VERIFICATION_STATUS = {
        PENDING: 'pending',
        VERIFIED: 'verified',
        REJECTED: 'rejected',
        IN_PROGRESS: 'in_progress',
        UNDER_REVIEW: 'under_review'
    };

    const PROPERTY_TYPES = {
        FLAT: 'flat', HOUSE: 'house', VILLA: 'villa', PLOT: 'plot', COMMERCIAL: 'commercial'
    };

    const LISTING_TYPES = { SELL: 'sell', RENT: 'rent' };

    // ── Cache ──────────────────────────────────────────────────────────────────

    const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes (shorter for live feel)
    let propertiesCache = { data: null, timestamp: null };

    function isCacheValid() {
        if (!propertiesCache.data || !propertiesCache.timestamp) return false;
        return (Date.now() - propertiesCache.timestamp) < CACHE_DURATION;
    }

    function setCache(data) {
        propertiesCache = { data, timestamp: Date.now() };
    }

    function clearCache() {
        propertiesCache = { data: null, timestamp: null };
        console.log('🗑️ Properties cache cleared');
    }

    // ── Transform ──────────────────────────────────────────────────────────────

    /**
     * Transform an API property response to the canonical frontend shape.
     * Handles both flat (from in-memory) and nested (from PostgreSQL) formats.
     */
    function transformApiProperty(p) {
        // Resolve images
        let images = p.images || [];
        if (typeof images === 'string') { try { images = JSON.parse(images); } catch { images = []; } }

        // Resolve amenities
        let amenities = p.amenities || [];
        if (typeof amenities === 'string') { try { amenities = JSON.parse(amenities); } catch { amenities = []; } }

        return {
            id: p.id,
            title: p.title || '',
            description: p.description || '',
            price: p.price || 0,
            priceFormatted: p.priceFormatted || formatPrice(p.price, p.listingType),
            bhk: p.bhk,
            bedrooms: p.bedrooms || parseInt(String(p.bhk || '1')) || 1,
            bathrooms: p.bathrooms || 0,
            sqft: p.sqft || 0,
            furnishing: p.furnishing || 'unfurnished',
            parking: p.parking || 'no',

            // Location (flat fields — most reliable for the home page)
            address: p.address || p.location?.address || '',
            city: p.city || p.location?.city || '',
            area: p.area || p.location?.area || '',
            state: p.state || p.location?.state || '',
            country: p.country || p.location?.country || 'India',
            pincode: p.pincode || p.location?.pincode || '',
            latitude: parseFloat(p.latitude || p.location?.latitude) || 0,
            longitude: parseFloat(p.longitude || p.location?.longitude) || 0,

            // Media
            images,
            featuredImage: p.featuredImage || (images.length > 0 ? images[0] : null),

            // Amenities
            amenities,

            // Owner / Agent
            ownerId: p.ownerId || p.owner?.id || '',
            ownerPhone: p.ownerPhone || p.owner?.phone || '',
            ownerEmail: p.ownerEmail || p.owner?.email || '',
            agentName: p.agentName || p.owner?.name || p.ownerName || 'Seller',
            owner: p.owner || { name: p.ownerName || p.agentName || 'Seller', phone: p.ownerPhone || '', email: p.ownerEmail || '' },

            // Status / Meta
            verificationStatus: p.verificationStatus || 'under_review',
            isVerified: p.isVerified || p.verificationStatus === 'verified',
            propertyType: p.propertyType || 'flat',
            listingType: p.listingType || 'sell',
            isFeatured: p.isFeatured || p.featured || false,
            status: p.status || 'active',
            yearBuilt: p.yearBuilt,
            featured: p.isFeatured || p.featured || false,
            viewCount: p.viewCount || 0,
            contactCount: p.contactCount || 0,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        };
    }

    // ── Fetch / GET methods ────────────────────────────────────────────────────

    /**
     * Fetch all properties from the API (with caching + static fallback).
     */
    async function fetchAllProperties() {
        if (isCacheValid()) {
            console.log('📦 Returning cached properties');
            return propertiesCache.data;
        }

        try {
            console.log('🌐 Fetching properties from API...');
            const response = await ApiConfig.get(ApiConfig.endpoints.getAllProperties, { limit: 100 });

            if (response.success && response.properties) {
                const properties = response.properties.map(transformApiProperty);
                setCache(properties);
                console.log(`✅ Loaded ${properties.length} properties from API`);
                return properties;
            }
            throw new Error('Invalid API response format');

        } catch (error) {
            console.error('❌ Failed to fetch from API:', error);

            // Fallback: static REAL_LISTINGS
            if (typeof window !== 'undefined' && window.REAL_LISTINGS && window.REAL_LISTINGS.length > 0) {
                console.warn('⚠️ Falling back to static REAL_LISTINGS data');
                const fallback = window.REAL_LISTINGS.map(transformApiProperty);
                setCache(fallback);
                return fallback;
            }

            // Fallback: previously cached data (stale but better than nothing)
            if (propertiesCache.data) {
                console.warn('⚠️ Using stale cache as fallback');
                return propertiesCache.data;
            }

            console.warn('⚠️ No fallback data available');
            return [];
        }
    }

    async function getAllProperties() {
        return await fetchAllProperties();
    }

    async function getPropertyById(propertyId) {
        // Try cache first
        if (isCacheValid() && propertiesCache.data) {
            const cached = propertiesCache.data.find(p => String(p.id) === String(propertyId));
            if (cached) return cached;
        }
        // Fetch directly from API
        try {
            const response = await ApiConfig.get(ApiConfig.endpoints.getPropertyById(propertyId));
            if (response.success && response.property) return transformApiProperty(response.property);
        } catch (e) {
            console.error(`❌ Failed to fetch property ${propertyId}:`, e);
        }
        return null;
    }

    async function getVerifiedProperties() {
        const all = await fetchAllProperties();
        return all.filter(p => p.verificationStatus === VERIFICATION_STATUS.VERIFIED);
    }

    /**
     * Get properties by listing type. Includes ALL active listings (not just verified)
     * so user-submitted properties appear immediately without requiring admin verification.
     */
    async function getPropertiesByType(listingType) {
        const all = await fetchAllProperties();
        return all.filter(p => p.listingType === listingType);
    }

    async function getPropertiesByCity(city) {
        const all = await fetchAllProperties();
        return all.filter(p => (p.city || '').toLowerCase() === city.toLowerCase());
    }

    async function getPropertiesByArea(area) {
        const all = await fetchAllProperties();
        return all.filter(p => (p.area || '').toLowerCase().includes(area.toLowerCase()));
    }

    // ── Search ─────────────────────────────────────────────────────────────────

    /**
     * Simple full-text client-side search (used by the home page search bar).
     */
    async function searchProperties(query) {
        const all = await fetchAllProperties();
        const q = query.toLowerCase();
        return all.filter(p =>
            (p.title || '').toLowerCase().includes(q) ||
            (p.address || '').toLowerCase().includes(q) ||
            (p.area || '').toLowerCase().includes(q) ||
            (p.city || '').toLowerCase().includes(q) ||
            (p.state || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        );
    }

    /**
     * Advanced server-side search with filters (used by filter panel).
     */
    async function searchPropertiesAdvanced(filters) {
        try {
            clearCache(); // Ensure fresh results after filter
            const response = await ApiConfig.post(ApiConfig.endpoints.searchProperties, filters);
            if (response.success && response.properties) {
                return response.properties.map(transformApiProperty);
            }
        } catch (e) {
            console.error('❌ Advanced search failed, falling back to client-side filter:', e);
        }
        // Client-side fallback
        const all = await fetchAllProperties();
        return applyFiltersClientSide(all, filters);
    }

    function applyFiltersClientSide(properties, filters) {
        let results = [...properties];
        if (filters.query) {
            const q = filters.query.toLowerCase();
            results = results.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.city || '').toLowerCase().includes(q) ||
                (p.area || '').toLowerCase().includes(q)
            );
        }
        if (filters.city && filters.city !== 'all') results = results.filter(p => p.city === filters.city);
        if (filters.listingType) results = results.filter(p => p.listingType === filters.listingType);
        if (filters.propertyType && filters.propertyType !== 'all') results = results.filter(p => p.propertyType === filters.propertyType);
        if (filters.minPrice) results = results.filter(p => p.price >= Number(filters.minPrice));
        if (filters.maxPrice) results = results.filter(p => p.price <= Number(filters.maxPrice));
        if (filters.bedrooms) results = results.filter(p => (p.bedrooms || 0) >= parseInt(filters.bedrooms));
        if (filters.bathrooms) results = results.filter(p => (p.bathrooms || 0) >= parseInt(filters.bathrooms));
        if (filters.amenities && filters.amenities.length > 0) {
            results = results.filter(p => filters.amenities.every(a => (p.amenities || []).includes(a)));
        }
        return results;
    }

    // ── CREATE ─────────────────────────────────────────────────────────────────

    /**
     * Submit a new property to the backend API.
     * Invalidates cache on success so the home page re-fetches immediately.
     * @param {Object} propertyData - Full property payload from the form
     * @returns {Promise<Object>} The created property from the server
     */
    async function createProperty(propertyData) {
        console.log('📤 Submitting property to API...', propertyData);
        const response = await ApiConfig.post(ApiConfig.endpoints.createProperty, {
            ...propertyData,
            _clientTimestamp: Date.now()
        });

        if (response.success && response.property) {
            const created = transformApiProperty(response.property);

            // Immediately inject into cache so the home page shows it without a re-fetch
            clearCache();

            console.log('✅ Property created:', created.id);
            return created;
        }
        throw new Error(response.error || response.message || 'Failed to create property');
    }

    // ── Utilities ──────────────────────────────────────────────────────────────

    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function toRad(degrees) { return degrees * (Math.PI / 180); }

    function formatPrice(price, listingType = 'sell') {
        if (!price) return '₹0';
        const suffix = listingType === 'rent' ? '/month' : '';
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr${suffix}`;
        if (price >= 100000)   return `₹${(price / 100000).toFixed(2)} Lakh${suffix}`;
        return `₹${price.toLocaleString('en-IN')}${suffix}`;
    }

    function getVerificationBadge(status) {
        const badges = {
            [VERIFICATION_STATUS.VERIFIED]:    { text: '✓ Verified',    color: '#22c55e' },
            [VERIFICATION_STATUS.PENDING]:     { text: '⏳ Pending',    color: '#fbbf24' },
            [VERIFICATION_STATUS.IN_PROGRESS]: { text: '🔄 In Progress',color: '#3b82f6' },
            [VERIFICATION_STATUS.UNDER_REVIEW]:{ text: '👁 Under Review',color: '#f59e0b' },
            [VERIFICATION_STATUS.REJECTED]:    { text: '✗ Rejected',    color: '#ef4444' }
        };
        return badges[status] || badges[VERIFICATION_STATUS.UNDER_REVIEW];
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    return {
        VERIFICATION_STATUS,
        PROPERTY_TYPES,
        LISTING_TYPES,

        // Getters
        getAllProperties,
        getPropertyById,
        getVerifiedProperties,
        getPropertiesByType,
        getPropertiesByCity,
        getPropertiesByArea,

        // Search
        searchProperties,
        searchPropertiesAdvanced,

        // Create
        createProperty,

        // Utilities
        calculateDistance,
        formatPrice,
        getVerificationBadge,
        clearCache,
        applyFiltersClientSide,
    };
})();

window.PropertiesData = PropertiesData;
console.log('✅ PropertiesData API Service initialized');
