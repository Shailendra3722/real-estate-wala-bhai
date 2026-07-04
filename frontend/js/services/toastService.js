/**
 * Toast Notification System
 * Professional toast notifications for success, error, and info messages
 */

const Toast = (function () {
    'use strict';

    let container = null;

    /**
     * Initialize toast container
     */
    function init() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    /**
     * Show a toast notification
     */
    function show(message, type = 'info', duration = 4000) {
        init();

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    /**
     * Success toast
     */
    function success(message, duration) {
        return show(message, 'success', duration);
    }

    /**
     * Error toast
     */
    function error(message, duration) {
        return show(message, 'error', duration);
    }

    /**
     * Info toast
     */
    function info(message, duration) {
        return show(message, 'info', duration);
    }

    /**
     * Clear all toasts
     */
    function clear() {
        if (container) {
            container.innerHTML = '';
        }
    }

    // Public API
    return {
        success,
        error,
        info,
        clear
    };
})();

// Make globally available
window.Toast = Toast;

console.log('✅ Toast notification system loaded');
