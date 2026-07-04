/**
 * ==========================================
 * VERIFICATION BADGE SYSTEM - JAVASCRIPT
 * ==========================================
 * Dynamically adds verification badges to user elements
 */

const VerificationBadge = {
    /**
     * Initialize verification badges on page
     * Call this on DOMContentLoaded or after dynamic content loads
     */
    init() {
        // Add badges to all elements with data-user-id
        this.addBadgesToElements();

        // Listen for dynamic content updates
        this.observeDOMChanges();
    },

    /**
     * Add verification badges to all user elements
     */
    addBadgesToElements() {
        const elements = document.querySelectorAll('[data-user-id][data-verification-status]');

        elements.forEach(element => {
            const userId = element.dataset.userId;
            const status = element.dataset.verificationStatus;
            const showCompact = element.dataset.badgeCompact === 'true';

            // Skip if badge already exists
            if (element.querySelector('.verification-badge, .verification-badge-compact')) {
                return;
            }

            // Add badge based on status
            if (status === 'verified') {
                const badge = this.createBadge('verified', showCompact);
                element.appendChild(badge);
            } else if (status === 'pending') {
                const badge = this.createBadge('pending', showCompact);
                element.appendChild(badge);
            }
            // Don't show badge for unverified/rejected users
        });
    },

    /**
     * Create a verification badge element
     * @param {string} status - verified, pending, rejected, unverified
     * @param {boolean} compact - Show compact (icon-only) version
     * @returns {HTMLElement}
     */
    createBadge(status, compact = false) {
        const badge = document.createElement('span');

        if (compact) {
            badge.className = `verification-badge-compact ${status}`;
            badge.setAttribute('aria-label', this.getAriaLabel(status));
        } else {
            badge.className = `verification-badge ${status}`;
            badge.setAttribute('role', 'img');
            badge.setAttribute('aria-label', this.getAriaLabel(status));

            const text = document.createElement('span');
            text.className = 'verification-badge-text';
            text.textContent = this.getBadgeText(status);
            badge.appendChild(text);
        }

        // Add tooltip
        const tooltip = document.createElement('span');
        tooltip.className = 'verification-badge-tooltip';
        tooltip.textContent = this.getTooltipText(status);
        badge.appendChild(tooltip);

        return badge;
    },

    /**
     * Get badge text for status
     */
    getBadgeText(status) {
        const texts = {
            verified: 'Verified',
            pending: 'Pending',
            rejected: 'Rejected',
            unverified: 'Not Verified'
        };
        return texts[status] || 'Unknown';
    },

    /**
     * Get tooltip text for status
     */
    getTooltipText(status) {
        const tooltips = {
            verified: 'ID verified by Real Estate Wala Bhai',
            pending: 'Verification in progress',
            rejected: 'Verification failed',
            unverified: 'Not verified'
        };
        return tooltips[status] || '';
    },

    /**
     * Get aria label for accessibility
     */
    getAriaLabel(status) {
        const labels = {
            verified: 'Verified user',
            pending: 'Verification pending',
            rejected: 'Verification rejected',
            unverified: 'Unverified user'
        };
        return labels[status] || 'Unknown verification status';
    },

    /**
     * Create status pill (larger, for profile pages)
     * @param {string} status
     * @returns {HTMLElement}
     */
    createStatusPill(status) {
        const pill = document.createElement('div');
        pill.className = `verification-status-pill ${status}`;

        const text = this.getStatusPillText(status);
        pill.textContent = text;

        return pill;
    },

    /**
     * Get status pill text
     */
    getStatusPillText(status) {
        const texts = {
            verified: 'ID Verified',
            pending: 'Verification Pending',
            rejected: 'Verification Rejected',
            unverified: 'Not Verified'
        };
        return texts[status] || 'Unknown Status';
    },

    /**
     * Create CTA banner for unverified users
     * @returns {HTMLElement}
     */
    createCTABanner() {
        const banner = document.createElement('div');
        banner.className = 'verification-cta-banner';
        banner.innerHTML = `
            <div class="verification-cta-content">
                <div class="verification-cta-title">Get Verified to Build Trust</div>
                <div class="verification-cta-subtitle">Verified users get 3x more inquiries</div>
            </div>
            <button class="verification-cta-button" onclick="VerificationBadge.goToVerification()">
                Verify Now
            </button>
        `;
        return banner;
    },

    /**
     * Navigate to verification page
     */
    goToVerification() {
        window.location.href = 'upload-verification.html';
    },

    /**
     * Show CTA banner if user is unverified
     * @param {string} userId - Current user ID
     * @param {string} status - Current verification status
     * @param {string} targetSelector - Where to insert banner
     */
    showCTAIfNeeded(userId, status, targetSelector = '#main-content') {
        if (status !== 'verified' && status !== 'pending') {
            const target = document.querySelector(targetSelector);
            if (target && !target.querySelector('.verification-cta-banner')) {
                const banner = this.createCTABanner();
                target.prepend(banner);
            }
        }
    },

    /**
     * Update badge status dynamically (e.g., after approval)
     * @param {string} userId
     * @param {string} newStatus
     */
    updateBadgeStatus(userId, newStatus) {
        const elements = document.querySelectorAll(`[data-user-id="${userId}"]`);

        elements.forEach(element => {
            // Update data attribute
            element.dataset.verificationStatus = newStatus;

            // Remove existing badge
            const existingBadge = element.querySelector('.verification-badge, .verification-badge-compact');
            if (existingBadge) {
                existingBadge.remove();
            }

            // Add new badge
            if (newStatus === 'verified' || newStatus === 'pending') {
                const showCompact = element.dataset.badgeCompact === 'true';
                const badge = this.createBadge(newStatus, showCompact);
                element.appendChild(badge);
            }
        });

        // Update status pills
        const pills = document.querySelectorAll(`[data-user-id="${userId}"] .verification-status-pill`);
        pills.forEach(pill => {
            pill.className = `verification-status-pill ${newStatus}`;
            pill.textContent = this.getStatusPillText(newStatus);
        });
    },

    /**
     * Observe DOM changes and add badges to new elements
     */
    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if node itself needs badge
                        if (node.hasAttribute && node.hasAttribute('data-user-id')) {
                            this.addBadgesToElements();
                        }
                        // Check descendants
                        if (node.querySelectorAll) {
                            const elements = node.querySelectorAll('[data-user-id][data-verification-status]');
                            if (elements.length > 0) {
                                this.addBadgesToElements();
                            }
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    /**
     * Fetch verification status from backend
     * @param {string} userId
     * @returns {Promise<string>} status
     */
    async fetchStatus(userId) {
        try {
            const response = await fetch(`/api/verification/status/${userId}`);
            const data = await response.json();
            return data.status || 'unverified';
        } catch (error) {
            console.error('Failed to fetch verification status:', error);
            return 'unverified';
        }
    },

    /**
     * Helper: Add badge to specific element
     * @param {HTMLElement} element
     * @param {string} status
     * @param {boolean} compact
     */
    addBadgeToElement(element, status, compact = false) {
        // Remove existing badge if any
        const existing = element.querySelector('.verification-badge, .verification-badge-compact');
        if (existing) {
            existing.remove();
        }

        // Add new badge
        if (status === 'verified' || status === 'pending') {
            const badge = this.createBadge(status, compact);
            element.appendChild(badge);
        }
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        VerificationBadge.init();
    });
} else {
    VerificationBadge.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerificationBadge;
}
