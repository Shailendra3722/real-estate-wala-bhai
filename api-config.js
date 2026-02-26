/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Determine API base URL based on environment
const API_BASE_URL = (() => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
        // Check for custom API URL in window config
        if (window.API_BASE_URL) {
            return window.API_BASE_URL;
        }

        // In production, API is on same domain
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return window.location.origin;
        }

        // Local development - API server on port 3000
        return 'http://localhost:3000';
    }

    // Node.js environment
    return process.env.API_BASE_URL || 'http://localhost:3000';
})();

const ApiConfig = {
    // Base URL
    baseUrl: API_BASE_URL,

    // API Endpoints
    endpoints: {
        // Properties
        getAllProperties: '/api/properties',
        getPropertyById: (id) => `/api/properties/${id}`,
        getNearbyProperties: '/api/properties/nearby',
        searchProperties: '/api/properties/search',

        // Contact
        submitContact: '/api/contact',

        // Future endpoints
        getFavorites: '/api/favorites',
        addFavorite: '/api/favorites',
        removeFavorite: (id) => `/api/favorites/${id}`,
    },

    // Request configuration
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },

    // Timeout settings (in milliseconds)
    timeout: 10000,

    // Helper method to build full URL
    getUrl(endpoint) {
        return `${this.baseUrl}${endpoint}`;
    },

    // Helper method to make API calls
    async fetch(endpoint, options = {}) {
        const url = this.getUrl(endpoint);
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // Parse JSON response
            const data = await response.json();

            // Handle error responses
            if (!response.ok) {
                throw new Error(data.message || `API error: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API call failed: ${endpoint}`, error);
            throw error;
        }
    },

    // Convenience methods for common HTTP verbs
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.fetch(fullEndpoint, { method: 'GET' });
    },

    async post(endpoint, body = {}) {
        return this.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    async put(endpoint, body = {}) {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    async delete(endpoint) {
        return this.fetch(endpoint, { method: 'DELETE' });
    },
};

// Make it available globally for browser
if (typeof window !== 'undefined') {
    window.ApiConfig = ApiConfig;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiConfig;
}

console.log('✅ API Config initialized:', API_BASE_URL);
