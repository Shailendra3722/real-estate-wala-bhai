/**
 * ==========================================
 * REAL ESTATE WALA BHAI - SMOOTH SCROLL
 * ==========================================
 * 
 * Implements Lenis smooth scrolling for a premium 
 * native-like scroll experience on the web.
 */

class SmoothScroll {
    constructor() {
        this.lenis = null;
        this.isActive = false;
        this.init();
    }

    init() {
        // Only initialize on non-touch devices for better performance
        // Native scrolling is usually better on iOS/Android
        const isTouchDevice = ('ontouchstart' in window) || 
                             (navigator.maxTouchPoints > 0) || 
                             (navigator.msMaxTouchPoints > 0);
                             
        if (isTouchDevice && window.innerWidth < 1024) {
            console.log('📱 Touch device detected, using native scroll for performance');
            return;
        }

        try {
            // Check if Lenis is loaded
            if (typeof Lenis === 'undefined') {
                console.warn('⚠️ Lenis library not found. Falling back to native scroll.');
                return;
            }

            // Initialize Lenis with premium settings
            this.lenis = new Lenis({
                duration: 1.2, // Subtle, relaxed scroll duration
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom premium easing
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                smoothTouch: false, // Keep native touch scroll
                touchMultiplier: 2,
                infinite: false,
            });

            this.isActive = true;

            // Start animation loop
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);

            // Integrate with app state/navigation if needed
            this.lenis.on('scroll', (e) => {
                // Optional: Trigger custom events for parallax effects
                // document.dispatchEvent(new CustomEvent('lenisScroll', { detail: e }));
            });

            console.log('✨ Premium Smooth Scroll Initialized');
        } catch (error) {
            console.error('❌ Failed to initialize smooth scroll:', error);
            this.isActive = false;
        }
    }

    animate(time) {
        if (!this.isActive || !this.lenis) return;
        this.lenis.raf(time);
        requestAnimationFrame(this.animate);
    }

    // Public API methods
    scrollTo(target, options = {}) {
        if (this.isActive && this.lenis) {
            this.lenis.scrollTo(target, options);
        } else {
             // Fallback to native
             if(typeof target === 'number') {
                window.scrollTo({ top: target, behavior: 'smooth' });
             } else {
                const el = document.querySelector(target);
                if(el) el.scrollIntoView({ behavior: 'smooth' });
             }
        }
    }

    stop() {
        if (this.isActive && this.lenis) this.lenis.stop();
    }

    start() {
        if (this.isActive && this.lenis) this.lenis.start();
    }
    
    destroy() {
         if (this.isActive && this.lenis) {
             this.lenis.destroy();
             this.isActive = false;
         }
    }
}

// Initialize automatically when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Expose to window for global access
    window.AppScroll = new SmoothScroll();
});
