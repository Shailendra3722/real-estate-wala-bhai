/**
 * Loading Utilities
 * Global utilities for showing/hiding loading indicators
 */

const LoadingUtils = {
    /**
     * Show loading overlay
     * @param {string} message - Optional loading message
     */
    show(message = 'Loading...') {
        // Remove existing overlay if any
        this.hide();
        
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'globalLoadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * Hide loading overlay
     */
    hide() {
        const overlay = document.getElementById('globalLoadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                overlay.remove();
                // Restore body scroll
                document.body.style.overflow = '';
            }, 300);
        }
    },
    
    /**
     * Show loading for a specific element
     * @param {string} elementId - ID of the element to show loading in
     * @param {string} message - Optional loading message
     */
    showInElement(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem;">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
    },
    
    /**
     * Show skeleton loading for cards
     * @param {string} containerId - ID of the container
     * @param {number} count - Number of skeleton cards
     */
    showSkeletonCards(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton skeleton-card"></div>';
        }
        container.innerHTML = html;
    },
    
    /**
     * Execute async function with loading indicator
     * @param {Function} asyncFn - Async function to execute
     * @param {string} message - Loading message
     */
    async withLoading(asyncFn, message = 'Loading...') {
        this.show(message);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            this.hide();
        }
    }
};

// Make it globally available
if (typeof window !== 'undefined') {
    window.LoadingUtils = LoadingUtils;
}
