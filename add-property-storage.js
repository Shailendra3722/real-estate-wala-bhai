/**
 * Add Property Form - Temporary Storage Module
 * Manages temporary storage of form data across multiple steps
 */

const AddPropertyStorage = (function () {
    'use strict';

    // Storage key for form data
    const STORAGE_KEY = 'addPropertyFormData';

    /**
     * Save Step 1 data (Basic Information)
     */
    function saveStep1(data) {
        const formData = getFormData() || {};
        formData.step1 = {
            title: data.title,
            propertyType: data.propertyType,
            listingType: data.listingType,
            price: parseFloat(data.price),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        return true;
    }

    /**
     * Save Step 2 data (Property Details)
     */
    function saveStep2(data) {
        const formData = getFormData() || {};
        formData.step2 = {
            bhk: parseInt(data.bhk),
            sqft: parseFloat(data.sqft),
            furnishing: data.furnishing || 'unfurnished',
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        return true;
    }

    /**
     * Save Step 3 data (Location)
     */
    function saveStep3(data) {
        const formData = getFormData() || {};
        formData.step3 = {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            address: data.address || 'Address not available',
            city: data.city || 'Lucknow',
            area: data.area || 'Unknown Area',
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        return true;
    }

    /**
     * Save Step 4 data (Photos & Contact)
     */
    function saveStep4(data) {
        const formData = getFormData() || {};
        formData.step4 = {
            images: data.images || [],
            reels: data.reels || [],
            contactNumber: data.contactNumber,
            whatsappEnabled: data.whatsappEnabled !== false,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        return true;
    }

    /**
     * Get all stored form data
     */
    function getFormData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading form data:', error);
            return null;
        }
    }

    /**
     * Get specific step data
     */
    function getStepData(stepNumber) {
        const formData = getFormData();
        return formData ? formData[`step${stepNumber}`] : null;
    }

    /**
     * Clear all form data from storage
     */
    function clearFormData() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Check if a step has been completed
     */
    function isStepCompleted(stepNumber) {
        const stepData = getStepData(stepNumber);
        return stepData !== null && stepData !== undefined;
    }

    /**
     * Derive city and area from coordinates (simplified simulation)
     * In production, this would use a reverse geocoding API
     */
    function deriveLocationFromCoords(lat, lng) {
        // Simplified location derivation based on Lucknow coordinates
        const locations = [
            { lat: 26.8467, lng: 80.9462, city: 'Lucknow', area: 'Gomti Nagar', address: 'Gomti Nagar, Lucknow' },
            { lat: 26.8389, lng: 80.9234, city: 'Lucknow', area: 'Hazratganj', address: 'Hazratganj, Lucknow' },
            { lat: 26.8700, lng: 80.9900, city: 'Lucknow', area: 'Indira Nagar', address: 'Indira Nagar, Lucknow' },
            { lat: 26.8300, lng: 80.9100, city: 'Lucknow', area: 'Aliganj', address: 'Aliganj, Lucknow' }
        ];

        // Find closest location
        let closest = locations[0];
        let minDistance = calculateDistance(lat, lng, closest.lat, closest.lng);

        for (let i = 1; i < locations.length; i++) {
            const distance = calculateDistance(lat, lng, locations[i].lat, locations[i].lng);
            if (distance < minDistance) {
                minDistance = distance;
                closest = locations[i];
            }
        }

        return {
            city: closest.city,
            area: closest.area,
            address: closest.address
        };
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
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
     * Build complete property object from all steps
     */
    function buildPropertyObject() {
        const formData = getFormData();

        if (!formData || !formData.step1 || !formData.step2 || !formData.step3 || !formData.step4) {
            throw new Error('Incomplete form data. Please complete all steps.');
        }

        // Get current user from AppState
        const user = window.AppState ? window.AppState.getUser() : null;
        if (!user) {
            throw new Error('User not logged in. Please login to add property.');
        }

        const { step1, step2, step3, step4 } = formData;

        // Generate unique property ID
        const propertyId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Calculate estimated bathrooms based on BHK
        const bathrooms = Math.max(1, Math.floor(step2.bhk * 0.75));

        // Build complete property object
        const property = {
            id: propertyId,
            title: step1.title,
            price: step1.price,
            bhk: `${step2.bhk} BHK`, // Format as "X BHK" to match existing data
            sqft: step2.sqft,
            address: step3.address,
            city: step3.city,
            area: step3.area,
            latitude: step3.latitude,
            longitude: step3.longitude,
            ownerId: user.id,
            verificationStatus: window.PropertiesData ?
                window.PropertiesData.VERIFICATION_STATUS.UNDER_REVIEW :
                'under_review',
            propertyType: step1.propertyType,
            listingType: step1.listingType,
            furnishing: step2.furnishing,
            bathrooms: bathrooms,
            images: step4.images.length > 0 ? step4.images : [
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
            ],
            reels: step4.reels || [],
            amenities: ['Parking', 'Security'], // Default amenities
            yearBuilt: new Date().getFullYear(),
            featured: false,
            createdAt: new Date().toISOString(),
            contactNumber: step4.contactNumber,
            whatsappEnabled: step4.whatsappEnabled
        };

        return property;
    }

    /**
     * Validate step data
     */
    function validateStep(stepNumber, data) {
        switch (stepNumber) {
            case 1:
                return data.title && data.propertyType && data.listingType && data.price > 0;
            case 2:
                return data.bhk > 0 && data.sqft > 0;
            case 3:
                return data.latitude && data.longitude;
            case 4:
                return data.contactNumber && data.contactNumber.length >= 10;
            default:
                return false;
        }
    }

    /**
     * Get form completion percentage
     */
    function getCompletionPercentage() {
        let completed = 0;
        for (let i = 1; i <= 4; i++) {
            if (isStepCompleted(i)) completed++;
        }
        return (completed / 4) * 100;
    }

    // Public API
    return {
        saveStep1,
        saveStep2,
        saveStep3,
        saveStep4,
        getFormData,
        getStepData,
        clearFormData,
        isStepCompleted,
        buildPropertyObject,
        validateStep,
        getCompletionPercentage,
        deriveLocationFromCoords
    };
})();

// Make globally available
if (typeof window !== 'undefined') {
    window.AddPropertyStorage = AddPropertyStorage;
}
