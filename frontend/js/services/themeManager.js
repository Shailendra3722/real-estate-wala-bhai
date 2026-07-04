/**
 * ==========================================
 * REAL ESTATE WALA BHAI - THEME MANAGER
 * ==========================================
 * 
 * Manages Light/Dark mode preferences.
 * Persists user choice via localStorage and falls back
 * to system preferences (prefers-color-scheme).
 */

class ThemeManager {
    constructor() {
        this.themeKey = 'real-estate-theme';
        this.currentTheme = this.getInitialTheme();

        // Listen for system theme changes if user hasn't forced a preference
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.mediaQuery.addEventListener('change', (e) => this.handleSystemThemeChange(e));
    }

    /**
     * Determine the initial theme to apply
     */
    getInitialTheme() {
        // 1. Check local storage
        const savedTheme = localStorage.getItem(this.themeKey);
        if (savedTheme) {
            return savedTheme;
        }

        // 2. Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // 3. Default to light
        return 'light';
    }

    /**
     * Apply the theme to the document root
     */
    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.themeKey, theme);

        // Dispatch custom event for other components to react (e.g., changing map styles)
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));

        // Update any toggle buttons on the page
        this.updateToggleButtons();
    }

    /**
     * Toggle between light and dark
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    /**
     * Handle OS-level theme changes
     */
    handleSystemThemeChange(e) {
        // Only auto-switch if user hasn't explicitly set a preference
        if (!localStorage.getItem(this.themeKey)) {
            const newTheme = e.matches ? 'dark' : 'light';
            this.applyTheme(newTheme);
            // Clear storage so it continues to track system preference
            localStorage.removeItem(this.themeKey);
        }
    }

    /**
     * Visually update all theme toggle buttons on the page
     */
    updateToggleButtons() {
        const buttons = document.querySelectorAll('.theme-toggle-btn');
        buttons.forEach(btn => {
            if (this.currentTheme === 'dark') {
                btn.innerHTML = '☀️';
                btn.setAttribute('aria-label', 'Switch to light mode');
            } else {
                btn.innerHTML = '🌙';
                btn.setAttribute('aria-label', 'Switch to dark mode');
            }
        });
    }

    /**
     * Initialize the system
     */
    init() {
        // Apply instantly to prevent flash of wrong theme
        this.applyTheme(this.currentTheme);

        // Bind click events to any toggle buttons when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupToggleButtons());
        } else {
            this.setupToggleButtons();
        }

        console.log(`🌓 Theme Manager initialized: ${this.currentTheme} mode`);
    }

    setupToggleButtons() {
        const buttons = document.querySelectorAll('.theme-toggle-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Add a small scale animation class
                btn.style.transform = 'scale(0.8)';
                setTimeout(() => btn.style.transform = 'scale(1)', 150);
                this.toggleTheme();
            });
        });
        this.updateToggleButtons();
    }
}

// Create global instance and execute immediately to avoid FOUC (Flash of Unstyled Content)
window.AppTheme = new ThemeManager();
window.AppTheme.init();
