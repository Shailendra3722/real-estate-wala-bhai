/**
 * Empty States System
 * Provides friendly, actionable empty state templates
 */

const EmptyStates = (function () {
    'use strict';

    /**
     * No properties found
     */
    function getNoPropertiesState() {
        return `
            <div class="empty-state fade-in">
                <div class="empty-state-icon">🏠</div>
                <h3 class="empty-state-title">No Properties Yet</h3>
                <p class="empty-state-message">
                    Be the first to add a property to this amazing platform!
                    Start listing your property and connect with potential buyers.
                </p>
                <button class="empty-state-action" onclick="Navigation.goToAddProperty()">
                    <span>➕</span>
                    <span>Add Your Property</span>
                </button>
            </div>
        `;
    }

    /**
     * No search results
     */
    function getNoSearchResultsState(searchQuery) {
        return `
            <div class="empty-state fade-in">
                <div class="empty-state-icon">🔍</div>
                <h3 class="empty-state-title">No Results Found</h3>
                <p class="empty-state-message">
                    We couldn't find any properties matching "${searchQuery}".<br>
                    Try adjusting your search or explore all properties.
                </p>
                <button class="empty-state-action" onclick="document.getElementById('searchInput').value = ''; loadAllProperties();">
                    <span>🔄</span>
                    <span>Clear Search</span>
                </button>
            </div>
        `;
    }

    /**
     * No filtered results (Buy/Rent)
     */
    function getNoFilteredResultsState(filterType) {
        const icon = filterType === 'sale' ? '🏡' : '🔑';
        const label = filterType === 'sale' ? 'Buy' : 'Rent';

        return `
            <div class="empty-state fade-in">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">No ${label} Properties Available</h3>
                <p class="empty-state-message">
                    There are no properties available for ${label.toLowerCase()} at the moment.<br>
                    Check back later or explore all properties.
                </p>
                <button class="empty-state-action" onclick="loadAllProperties()">
                    <span>🏠</span>
                    <span>View All Properties</span>
                </button>
            </div>
        `;
    }

    /**
     * Error state
     */
    function getErrorState(errorMessage = 'Something went wrong') {
        return `
            <div class="empty-state fade-in">
                <div class="empty-state-icon">⚠️</div>
                <h3 class="empty-state-title">Oops! ${errorMessage}</h3>
                <p class="empty-state-message">
                    We're having trouble loading the properties right now.<br>
                    Please check your connection and try again.
                </p>
                <button class="empty-state-action" onclick="location.reload()">
                    <span>🔄</span>
                    <span>Retry</span>
                </button>
            </div>
        `;
    }

    /**
     * Loading skeleton for property card
     */
    function getPropertyCardSkeleton() {
        return `
            <div class="property-card skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text large"></div>
                <div class="skeleton skeleton-text medium"></div>
                <div class="skeleton skeleton-text small"></div>
            </div>
        `;
    }

    /**
     * Show loading skeletons in grid
     */
    function showLoadingSkeletons(container, count = 6) {
        const skeletons = Array(count)
            .fill(null)
            .map(() => getPropertyCardSkeleton())
            .join('');

        container.innerHTML = skeletons;
    }

    // Public API
    return {
        getNoPropertiesState,
        getNoSearchResultsState,
        getNoFilteredResultsState,
        getErrorState,
        getPropertyCardSkeleton,
        showLoadingSkeletons
    };
})();

// Make globally available
window.EmptyStates = EmptyStates;

console.log('✅ Empty States system loaded');
