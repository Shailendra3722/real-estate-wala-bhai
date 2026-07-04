/**
 * Real Estate Wala Bhai - Global App State Management
 * 
 * This module provides centralized state management for the entire application.
 * It uses localStorage for persistence and provides a simple API for managing:
 * - User authentication data
 * - User role (buyer/owner)
 * - Current selected property ID
 * - Session management
 */

const AppState = (function () {
    'use strict';

    // Storage keys
    const STORAGE_KEYS = {
        USER: 'rewb_user',
        ROLE: 'rewb_role',
        PROPERTY_ID: 'rewb_property_id',
        AUTH_TOKEN: 'rewb_auth_token',
        SESSION: 'rewb_session',
        INTENT: 'rewb_intent'
    };

    // User roles
    const ROLES = {
        BUYER: 'buyer',
        OWNER: 'owner',
        ADMIN: 'admin'
    };

    /**
     * Initialize the app state
     */
    function init() {
        // Check if session is still valid
        const session = getSession();
        if (session && isSessionExpired(session)) {
            clearAll();
        }
    }

    /**
     * Check if session has expired (24 hours)
     */
    function isSessionExpired(session) {
        if (!session.timestamp) return true;
        const now = new Date().getTime();
        const sessionAge = now - session.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        return sessionAge > maxAge;
    }

    /**
     * Get item from localStorage
     */
    function getItem(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Error getting ${key} from localStorage:`, error);
            return null;
        }
    }

    /**
     * Set item in localStorage
     */
    function setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting ${key} in localStorage:`, error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     */
    function removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
            return false;
        }
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * Set user data
     * @param {Object} userData - User information
     * @param {string} userData.id - User ID
     * @param {string} userData.name - User name
     * @param {string} userData.email - User email
     * @param {string} userData.phone - User phone number
     * @param {string} userData.avatar - User avatar URL (optional)
     */
    function setUser(userData) {
        const success = setItem(STORAGE_KEYS.USER, userData);
        if (success) {
            updateSession();
            dispatchEvent('userChanged', userData);
        }
        return success;
    }

    /**
     * Get current user data
     * @returns {Object|null} User data or null if not logged in
     */
    function getUser() {
        return getItem(STORAGE_KEYS.USER);
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in
     */
    function isLoggedIn() {
        const user = getUser();
        const session = getSession();
        return user !== null && session !== null && !isSessionExpired(session);
    }

    /**
     * Update user data (merge with existing)
     * @param {Object} updates - Partial user data to update
     */
    function updateUser(updates) {
        const currentUser = getUser();
        if (!currentUser) {
            console.warn('No user logged in. Use setUser() first.');
            return false;
        }
        const updatedUser = { ...currentUser, ...updates };
        return setUser(updatedUser);
    }

    /**
     * Clear user data (logout)
     */
    function clearUser() {
        removeItem(STORAGE_KEYS.USER);
        removeItem(STORAGE_KEYS.AUTH_TOKEN);
        removeItem(STORAGE_KEYS.SESSION);
        dispatchEvent('userCleared', null);
    }

    // ==================== ROLE MANAGEMENT ====================

    /**
     * Set user role
     * @param {string} role - User role (buyer/owner/admin)
     */
    function setRole(role) {
        if (!Object.values(ROLES).includes(role)) {
            console.error(`Invalid role: ${role}. Must be one of: ${Object.values(ROLES).join(', ')}`);
            return false;
        }
        const success = setItem(STORAGE_KEYS.ROLE, role);
        if (success) {
            updateSession();
            dispatchEvent('roleChanged', role);
        }
        return success;
    }

    /**
     * Get current user role
     * @returns {string|null} User role or null
     */
    function getRole() {
        return getItem(STORAGE_KEYS.ROLE);
    }

    /**
     * Check if user has a specific role
     * @param {string} role - Role to check
     * @returns {boolean} True if user has the role
     */
    function hasRole(role) {
        return getRole() === role;
    }

    /**
     * Check if user is a buyer
     * @returns {boolean}
     */
    function isBuyer() {
        return hasRole(ROLES.BUYER);
    }

    /**
     * Check if user is an owner
     * @returns {boolean}
     */
    function isOwner() {
        return hasRole(ROLES.OWNER);
    }

    /**
     * Check if user is an admin
     * @returns {boolean}
     */
    function isAdmin() {
        return hasRole(ROLES.ADMIN);
    }

    // ==================== PROPERTY MANAGEMENT ====================

    /**
     * Set selected property ID
     * @param {string} propertyId - Property ID
     */
    function setPropertyId(propertyId) {
        const success = setItem(STORAGE_KEYS.PROPERTY_ID, propertyId);
        if (success) {
            dispatchEvent('propertyChanged', propertyId);
        }
        return success;
    }

    /**
     * Get selected property ID
     * @returns {string|null} Property ID or null
     */
    function getPropertyId() {
        return getItem(STORAGE_KEYS.PROPERTY_ID);
    }

    /**
     * Clear selected property ID
     */
    function clearPropertyId() {
        removeItem(STORAGE_KEYS.PROPERTY_ID);
        dispatchEvent('propertyCleared', null);
    }

    // ==================== SESSION MANAGEMENT ====================

    /**
     * Set authentication token
     * @param {string} token - Auth token
     */
    function setAuthToken(token) {
        return setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }

    /**
     * Get authentication token
     * @returns {string|null} Auth token or null
     */
    function getAuthToken() {
        return getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    /**
     * Update session timestamp
     */
    function updateSession() {
        setItem(STORAGE_KEYS.SESSION, {
            timestamp: new Date().getTime(),
            lastActivity: new Date().toISOString()
        });
    }

    /**
     * Get session data
     * @returns {Object|null} Session data or null
     */
    function getSession() {
        return getItem(STORAGE_KEYS.SESSION);
    }

    /**
     * Clear all app state (complete logout)
     */
    function clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => {
            removeItem(key);
        });
        dispatchEvent('stateCleared', null);
    }

    // ==================== INTENT MANAGEMENT ====================

    /**
     * Set user intent (what they wanted to do before login)
     * @param {string} intent - User intent (buy/sell/rent/map)
     */
    function setIntent(intent) {
        const success = setItem(STORAGE_KEYS.INTENT, intent);
        if (success) {
            dispatchEvent('intentChanged', intent);
        }
        return success;
    }

    /**
     * Get stored user intent
     * @returns {string|null} Intent or null
     */
    function getIntent() {
        return getItem(STORAGE_KEYS.INTENT);
    }

    /**
     * Clear stored intent (after processing)
     */
    function clearIntent() {
        removeItem(STORAGE_KEYS.INTENT);
        dispatchEvent('intentCleared', null);
    }

    // ==================== EVENT SYSTEM ====================

    /**
     * Dispatch custom event for state changes
     * @param {string} eventName - Event name
     * @param {*} detail - Event detail data
     */
    function dispatchEvent(eventName, detail) {
        const event = new CustomEvent(`appState:${eventName}`, {
            detail: detail,
            bubbles: true
        });
        window.dispatchEvent(event);
    }

    /**
     * Subscribe to state change events
     * @param {string} eventName - Event name (userChanged, roleChanged, propertyChanged, etc.)
     * @param {Function} callback - Callback function
     */
    function on(eventName, callback) {
        window.addEventListener(`appState:${eventName}`, (e) => {
            callback(e.detail);
        });
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Get complete app state snapshot
     * @returns {Object} Complete state object
     */
    function getState() {
        return {
            user: getUser(),
            role: getRole(),
            propertyId: getPropertyId(),
            authToken: getAuthToken(),
            session: getSession(),
            isLoggedIn: isLoggedIn()
        };
    }

    /**
     * Debug: Print current state to console
     */
    function debugState() {
        console.group('🏡 Real Estate Wala Bhai - App State');
        console.log('User:', getUser());
        console.log('Role:', getRole());
        console.log('Property ID:', getPropertyId());
        console.log('Is Logged In:', isLoggedIn());
        console.log('Session:', getSession());
        console.groupEnd();
    }

    /**
     * Check if user can perform owner actions
     * @returns {boolean}
     */
    function canAddProperty() {
        return isLoggedIn() && (isOwner() || isAdmin());
    }

    /**
     * Check if user can view property details
     * @returns {boolean}
     */
    function canViewProperty() {
        return isLoggedIn();
    }

    // Initialize on load
    init();

    // Public API
    return {
        // User management
        setUser,
        getUser,
        updateUser,
        clearUser,
        isLoggedIn,

        // Role management
        setRole,
        getRole,
        hasRole,
        isBuyer,
        isOwner,
        isAdmin,
        ROLES,

        // Property management
        setPropertyId,
        getPropertyId,
        clearPropertyId,

        // Session management
        setAuthToken,
        getAuthToken,
        updateSession,
        getSession,

        // Intent management
        setIntent,
        getIntent,
        clearIntent,

        // General
        clearAll,
        getState,
        debugState,
        on,

        // Permissions
        canAddProperty,
        canViewProperty
    };
})();

// Make it available globally
window.AppState = AppState;

// Auto-update session on user activity
['click', 'keypress', 'scroll', 'mousemove'].forEach(eventType => {
    let timeout;
    window.addEventListener(eventType, () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (AppState.isLoggedIn()) {
                AppState.updateSession();
            }
        }, 5000); // Update every 5 seconds of activity
    });
});

// Log state changes in development
if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
    AppState.on('userChanged', (user) => console.log('👤 User changed:', user));
    AppState.on('roleChanged', (role) => console.log('🎭 Role changed:', role));
    AppState.on('propertyChanged', (id) => console.log('🏠 Property changed:', id));
}

console.log('✅ AppState initialized');
