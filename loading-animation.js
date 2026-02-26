/**
 * Premium Loading Animation Controller
 * Handles app launch and page transition loading screens
 */

const PremiumLoader = {
    loader: null,

    /**
     * Initialize the loader
     */
    init() {
        // Check if loader already exists
        if (document.getElementById('premiumLoader')) {
            this.loader = document.getElementById('premiumLoader');
            return;
        }

        // Create loader element
        this.createLoader();

        // Auto-show on page load
        this.showOnPageLoad();

        console.log('✨ Premium loader initialized');
    },

    /**
     * Create the loader HTML
     */
    createLoader() {
        const loaderHTML = `
            <div id="premiumLoader" class="premium-loader">
                <div class="loader-content">
                    <div class="app-name">Real Estate Wala Bhai</div>
                    <div class="app-tagline">Find Your Dream Home</div>
                    <div class="loader-dots">
                        <div class="loader-dot"></div>
                        <div class="loader-dot"></div>
                        <div class="loader-dot"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        this.loader = document.getElementById('premiumLoader');
    },

    /**
     * Show loader on page load
     */
    showOnPageLoad() {
        // Show loader
        this.show();

        // Multiple fallback methods to ensure it hides
        let hidden = false;

        const hideLoader = () => {
            if (!hidden) {
                hidden = true;
                this.hide();
            }
        };

        // Method 1: Window load event
        window.addEventListener('load', () => {
            setTimeout(hideLoader, 800);
        });

        // Method 2: DOMContentLoaded fallback
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(hideLoader, 1000);
            });
        } else {
            // DOM already loaded, hide immediately
            setTimeout(hideLoader, 800);
        }

        // Method 3: Absolute timeout fallback (ensure it hides no matter what)
        setTimeout(hideLoader, 2000);
    },

    /**
     * Show the loader
     */
    show(isTransition = false) {
        if (!this.loader) {
            this.init();
        }

        // Add transition mode class if this is a page transition
        if (isTransition) {
            this.loader.classList.add('transition-mode');
        } else {
            this.loader.classList.remove('transition-mode');
        }

        this.loader.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    },

    /**
     * Hide the loader
     */
    hide() {
        if (!this.loader) return;

        this.loader.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    },

    /**
     * Show loader for page transition
     * Use before navigating to another page
     */
    showForTransition(targetUrl, delay = 600) {
        this.show(true);

        setTimeout(() => {
            if (targetUrl) {
                window.location.href = targetUrl;
            }
        }, delay);
    },

    /**
     * Wrap a function with loading animation
     */
    async wrapWithLoader(asyncFunction, minDisplayTime = 500) {
        this.show();

        const startTime = Date.now();

        try {
            const result = await asyncFunction();

            // Ensure minimum display time for smooth UX
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minDisplayTime - elapsed);

            await new Promise(resolve => setTimeout(resolve, remaining));

            this.hide();
            return result;
        } catch (error) {
            this.hide();
            throw error;
        }
    }
};

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
    window.PremiumLoader = PremiumLoader;

    // Initialize immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PremiumLoader.init());
    } else {
        PremiumLoader.init();
    }
}

/**
 * Usage Examples:
 * 
 * 1. Manual show/hide:
 *    PremiumLoader.show();
 *    // ... do something ...
 *    PremiumLoader.hide();
 * 
 * 2. Page transition:
 *    PremiumLoader.showForTransition('home.html');
 * 
 * 3. Wrap async operation:
 *    await PremiumLoader.wrapWithLoader(async () => {
 *        // Your async code here
 *    });
 * 
 * 4. On button click:
 *    <button onclick="PremiumLoader.showForTransition('property-detail.html')">
 *        View Property
 *    </button>
 */
