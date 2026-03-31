/**
 * ==========================================
 * REAL ESTATE WALA BHAI - NAVIGATION SERVICE
 * ==========================================
 * 
 * Unified navigation system connecting all pages
 * Provides consistent routing and data flow across the app
 */

const Navigation = (function () {
    'use strict';

    // Page definitions
    const PAGES = {
        HOME: {
            url: 'home.html',
            title: 'Home',
            requiresAuth: false  // Anyone can browse listings
        },
        LOGIN: {
            url: 'login.html',
            title: 'Login',
            requiresAuth: false
        },
        MAP: {
            url: 'map-explore.html',
            title: 'Explore on Map',
            requiresAuth: false  // Anyone can explore the map
        },
        PROPERTY_LIST: {
            url: 'property-list.html',
            title: 'Properties',
            requiresAuth: false  // Anyone can view listings
        },
        PROPERTY_DETAIL: {
            url: 'property-detail.html',
            title: 'Property Details',
            requiresAuth: false  // Anyone can view property details
        },
        ADD_PROPERTY_STEP1: {
            url: 'add-property-step1.html',
            title: 'Add Property',
            requiresAuth: true  // Must be logged in to list a property
        },
        VERIFICATION: {
            url: 'upload-verification.html',
            title: 'Verify Account',
            requiresAuth: true
        },
        VERIFICATION_STATUS: {
            url: 'verification-status.html',
            title: 'Verification Status',
            requiresAuth: true
        }
    };

    /**
     * Navigate to a page
     * @param {string} pageKey - Key from PAGES object
     * @param {object} options - Additional options (queryParams, propertyId, etc.)
     */
    function goTo(pageKey, options = {}) {
        const page = PAGES[pageKey];

        if (!page) {
            console.error(`❌ Invalid page key: ${pageKey}`);
            return false;
        }

        // Check authentication
        if (page.requiresAuth && !AppState.isLoggedIn()) {
            console.warn('⚠️ Authentication required');
            goTo('LOGIN');
            return false;
        }

        // Check owner permission
        if (page.requiresOwner && !AppState.isOwner() && !AppState.isAdmin()) {
            console.warn('⚠️ Owner permission required');
            alert('Only property owners can add listings');
            return false;
        }

        // Handle property ID if provided
        if (options.propertyId) {
            AppState.setPropertyId(options.propertyId);
        }

        // Build URL with query params
        let url = page.url;
        if (options.queryParams) {
            const params = new URLSearchParams(options.queryParams);
            url += `?${params.toString()}`;
        }

        // Smooth Page Transition: Fade out before navigating
        document.body.classList.add('page-exit');

        // Wait for animation to complete (approx 300ms)
        setTimeout(() => {
            window.location.href = url;
        }, 300);

        return true;
    }

    /**
     * Navigate to property detail page
     * @param {string} propertyId - Property ID
     */
    function goToPropertyDetail(propertyId) {
        if (!propertyId) {
            console.error('❌ Property ID required');
            return false;
        }

        // Store in AppState
        AppState.setPropertyId(propertyId);

        // Smooth Page Transition
        document.body.classList.add('page-exit');

        setTimeout(() => {
            // Navigate with URL parameter for refresh support
            window.location.href = `${PAGES.PROPERTY_DETAIL.url}?id=${propertyId}`;
        }, 300);

        return true;
    }


    /**
     * Navigate to map view (optional: centered on property)
     * @param {string} propertyId - Optional property ID to center map on
     */
    function goToMap(propertyId = null) {
        document.body.classList.add('page-exit');

        setTimeout(() => {
            if (propertyId) {
                AppState.setPropertyId(propertyId);
                window.location.href = `${PAGES.MAP.url}?focus=${propertyId}`;
            } else {
                window.location.href = PAGES.MAP.url;
            }
        }, 300);
        return true;
    }

    /**
     * Navigate to property list with filters
     * @param {object} filters - Filter options
     */
    function goToPropertyList(filters = {}) {
        document.body.classList.add('page-exit');

        setTimeout(() => {
            if (Object.keys(filters).length > 0) {
                const params = new URLSearchParams(filters);
                window.location.href = `${PAGES.PROPERTY_LIST.url}?${params.toString()}`;
            } else {
                window.location.href = PAGES.PROPERTY_LIST.url;
            }
        }, 300);
        return true;
    }

    /**
     * Navigate to add property flow
     */
    function goToAddProperty() {
        document.body.classList.add('page-exit');
        setTimeout(() => goTo('ADD_PROPERTY_STEP1'), 300);
        return true;
    }

    /**
     * Navigate back
     */
    function goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            goTo('HOME');
        }
    }

    /**
     * Navigate to home
     */
    function goHome() {
        document.body.classList.add('page-exit');
        setTimeout(() => goTo('HOME'), 300);
        return true;
    }

    /**
     * Logout and navigate to login
     */
    function logout() {
        AppState.clearAll();
        window.location.href = PAGES.LOGIN.url;
    }

    /**
     * Get current page key
     * @returns {string|null} Current page key or null
     */
    function getCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop();

        for (const [key, page] of Object.entries(PAGES)) {
            if (page.url === currentPath) {
                return key;
            }
        }

        return null;
    }

    /**
     * Check if user can access current page
     */
    function checkAccess() {
        const currentPage = getCurrentPage();
        if (!currentPage) return true;

        const page = PAGES[currentPage];

        // Check authentication
        if (page.requiresAuth && !AppState.isLoggedIn()) {
            console.warn('⚠️ Redirecting to login (auth required)');
            goTo('LOGIN');
            return false;
        }

        // Check owner permission
        if (page.requiresOwner && !AppState.isOwner() && !AppState.isAdmin()) {
            console.warn('⚠️ Redirecting to home (owner required)');
            alert('Only property owners can access this page');
            goTo('HOME');
            return false;
        }

        return true;
    }

    /**
     * Initialize navigation (call on every page)
     */
    function init() {
        // Check access on page load
        checkAccess();

        // Add global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + H = Home
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                goHome();
            }

            // Alt + B = Back
            if (e.altKey && e.key === 'b') {
                e.preventDefault();
                goBack();
            }
        });

        console.log('✅ Navigation initialized');
    }

    // Auto-initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /**
     * Navigate to login page
     */
    function goToLogin() {
        window.location.href = PAGES.LOGIN.url;
    }

    // Public API
    return {
        // Main navigation
        goTo,
        goBack,
        goHome,
        goToLogin,
        logout,

        // Page-specific navigation
        goToPropertyDetail,
        goToMap,
        goToPropertyList,
        goToAddProperty,

        // Utilities
        getCurrentPage,
        checkAccess,
        PAGES
    };
})();

// Make globally available
window.Navigation = Navigation;

console.log('✅ Navigation service loaded');
