/**
 * Authentication and Properties API Service
 * 
 * Replaces Firebase with the Custom Express Backend.
 * Kept the file name 'firebaseService.js' to avoid breaking HTML imports,
 * but this file now exclusively hits the MERN backend using ApiConfig.
 */

const FirebaseService = (function () {
    'use strict';

    let _initialized = false;

    function init() {
        if (_initialized) return Promise.resolve();

        if (!window.ApiConfig) {
            console.error('ApiConfig is not loaded before FirebaseService');
            return Promise.reject(new Error('ApiConfig not loaded'));
        }

        _initialized = true;
        console.log('🔗 Auth Service connected to Express Backend');
        return Promise.resolve();
    }

    // ─────────────────────────────────────────────
    //  AUTH — USER LOGIN / REGISTER
    // ─────────────────────────────────────────────

    async function register(name, email, password, phone, role) {
        await init();
        const response = await window.ApiConfig.post(window.ApiConfig.endpoints.register, {
            name, email, password, phone, role
        });

        if (response.success && response.token) {
            // Token will be managed by AppState in the login.html, but let's ensure consistency
            return response.user;
        }
        throw new Error(response.message || 'Registration failed');
    }

    async function login(email, password) {
        await init();
        const response = await window.ApiConfig.post(window.ApiConfig.endpoints.login, {
            email, password
        });

        if (response.success && response.token) {
            // Save token globally directly to ensure subsequent requests work seamlessly
            if (window.AppState) {
                window.AppState.setAuthToken(response.token);
            }
            // Add a mock uid mapping since HTML pages might still check user.uid instead of user.id
            const user = response.user;
            user.uid = user.id;
            return user;
        }
        throw new Error(response.message || 'Login failed');
    }

    async function logout() {
        if (window.AppState) {
            window.AppState.clearUser();
        }
        return Promise.resolve();
    }

    async function getCurrentUser() {
        await init();
        if (window.AppState && window.AppState.getAuthToken()) {
            try {
                const response = await window.ApiConfig.get(window.ApiConfig.endpoints.getMe);
                if (response.success && response.user) {
                    const user = response.user;
                    user.uid = user.id;
                    return user;
                }
            } catch (e) {
                console.error('Failed to get current user', e);
            }
        }
        return null;
    }

    function onAuthChange(callback) {
        init().then(async () => {
            const user = await getCurrentUser();
            callback(user);
        });
    }

    async function updateUserProfile(updates) {
        // Not currently implemented on the backend, mock success for frontend stability
        console.warn('updateUserProfile called but not fully implemented in API yet');
        if (window.AppState) {
            window.AppState.updateUser(updates);
        }
        return Promise.resolve();
    }

    // ─────────────────────────────────────────────
    //  PROPERTIES — SAVE / LOAD
    // ─────────────────────────────────────────────

    async function addProperty(propertyData) {
        await init();
        const response = await window.ApiConfig.post(window.ApiConfig.endpoints.getAllProperties, propertyData);
        if (response.success && response.property) {
            return response.property.id;
        }
        throw new Error('Failed to add property');
    }

    async function getAllProperties() {
        await init();
        if (window.PropertiesData) {
            return await window.PropertiesData.getAllProperties();
        }
        const response = await window.ApiConfig.get(window.ApiConfig.endpoints.getAllProperties);
        return response.properties || [];
    }

    async function getPropertyById(propertyId) {
        await init();
        if (window.PropertiesData) {
            return await window.PropertiesData.getPropertyById(propertyId);
        }
        const response = await window.ApiConfig.get(window.ApiConfig.endpoints.getPropertyById(propertyId));
        return response.property || null;
    }

    function onPropertiesChange(callback) {
        init().then(async () => {
            const properties = await getAllProperties();
            callback(properties);
        });
    }

    async function getUserProperties(userId) {
        await init();
        // Fallback: fetch all and filter client-side until backend endpoint is available
        const allProperties = await getAllProperties();
        return allProperties.filter(p => p.ownerId === userId || p.owner?.id === userId);
    }

    async function incrementViewCount(propertyId) {
        // No-op until implemented on backend
        return Promise.resolve();
    }

    // ─────────────────────────────────────────────
    //  FAVORITES
    // ─────────────────────────────────────────────

    async function addFavorite(propertyId) {
        await init();
        return window.ApiConfig.post(window.ApiConfig.endpoints.addFavorite, { propertyId });
    }

    async function removeFavorite(propertyId) {
        await init();
        return window.ApiConfig.delete(window.ApiConfig.endpoints.removeFavorite(propertyId));
    }

    async function getUserFavorites() {
        await init();
        if (!window.AppState || !window.AppState.getAuthToken()) {
            return [];
        }
        try {
            const response = await window.ApiConfig.get(window.ApiConfig.endpoints.getFavorites);
            if (response.success && response.favorites) {
                return response.favorites.map(f => f.id || f.property_id); // Adjust according to backend response
            }
        } catch (e) {
            console.error('Failed to get favorites', e);
        }
        return [];
    }

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────

    return {
        init,
        register,
        login,
        logout,
        getCurrentUser,
        onAuthChange,
        updateUserProfile,
        
        addProperty,
        getAllProperties,
        getPropertyById,
        onPropertiesChange,
        getUserProperties,
        incrementViewCount,
        
        addFavorite,
        removeFavorite,
        getUserFavorites
    };
})();

window.FirebaseService = FirebaseService;
console.log('✅ API Service (replacing Firebase) loaded');
