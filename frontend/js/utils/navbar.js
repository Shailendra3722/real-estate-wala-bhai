/**
 * ============================================================
 * REAL ESTATE WALA BHAI — NAVBAR MODULE v2
 * ============================================================
 *
 * Handles all navbar interactivity WITHOUT touching business logic.
 * Reads from AppState & Navigation — never duplicates them.
 *
 * Features:
 *  1. Theme Toggle (light/dark, localStorage, system preference)
 *  2. Notification Dropdown (frontend store, mark-read, clear-all)
 *  3. Profile Dropdown (auth-aware: guest vs logged-in)
 *  4. Mobile Menu (keyboard, outside-click, ARIA)
 *  5. Scroll-aware sticky shadow on navbar
 * ============================================================
 */

(function () {
  'use strict';

  /* ================================================================
   * 1. THEME  ── light / dark / system preference (no flicker)
   * ================================================================ */

  const THEME_KEY = 'rewb_theme';

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getSavedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.textContent = theme === 'dark' ? '🌙' : '☀️';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function initTheme() {
    const saved = getSavedTheme();
    const theme = saved || getSystemTheme();
    applyTheme(theme);

    // Listen for OS-level change if user hasn't overridden
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!getSavedTheme()) applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || getSystemTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    applyTheme(next);
  };

  /* ================================================================
   * 2. NOTIFICATIONS
   * ================================================================ */

  const NOTIF_KEY = 'rewb_notifications';

  const DEFAULT_NOTIFICATIONS = [
    { id: 'n1', icon: '🏠', title: 'New property in Mumbai', body: 'A 3 BHK flat in Andheri West was just listed.', time: '2 min ago', read: false },
    { id: 'n2', icon: '✅', title: 'Verification complete', body: 'Your identity has been verified successfully.', time: '1 hr ago', read: false },
    { id: 'n3', icon: '💰', title: 'Price drop alert', body: 'A property you saved dropped by ₹5 Lakhs.', time: '3 hrs ago', read: true }
  ];

  function getNotifications() {
    try {
      var raw = localStorage.getItem(NOTIF_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    saveNotifications(DEFAULT_NOTIFICATIONS);
    return DEFAULT_NOTIFICATIONS;
  }

  function saveNotifications(list) {
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(list)); } catch {}
  }

  function getUnreadCount() {
    return getNotifications().filter(function(n) { return !n.read; }).length;
  }

  function markAllRead() {
    var list = getNotifications().map(function(n) { return Object.assign({}, n, { read: true }); });
    saveNotifications(list);
    renderNotifications();
    updateNotifBadge();
  }

  function markOneRead(id) {
    var list = getNotifications().map(function(n) { return n.id === id ? Object.assign({}, n, { read: true }) : n; });
    saveNotifications(list);
    renderNotifications();
    updateNotifBadge();
  }

  function clearAllNotifications() {
    saveNotifications([]);
    renderNotifications();
    updateNotifBadge();
  }

  function updateNotifBadge() {
    var count = getUnreadCount();
    document.querySelectorAll('.notification-badge').forEach(function(badge) {
      badge.style.display = count > 0 ? 'block' : 'none';
    });
    document.querySelectorAll('.notif-count-label').forEach(function(el) {
      el.textContent = count > 0 ? (count + ' unread') : 'All caught up';
    });
  }

  function renderNotifications() {
    var list = document.getElementById('notifList');
    if (!list) return;
    var notifs = getNotifications();

    if (notifs.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:2rem 1rem;color:var(--color-text-muted);"><div style="font-size:2rem;margin-bottom:.5rem;">🔔</div><div style="font-size:.875rem;font-weight:600;">No notifications</div><div style="font-size:.75rem;margin-top:.25rem;">You\'re all caught up!</div></div>';
      return;
    }

    list.innerHTML = notifs.map(function(n) {
      return '<div class="notif-item' + (n.read ? '' : ' notif-unread') + '" data-id="' + n.id + '" role="listitem" tabindex="0">' +
        '<div class="notif-icon">' + n.icon + '</div>' +
        '<div class="notif-body">' +
          '<div class="notif-title">' + n.title + '</div>' +
          '<div class="notif-text">' + n.body + '</div>' +
          '<div class="notif-time">' + n.time + '</div>' +
        '</div>' +
        (!n.read ? '<div class="notif-dot" aria-label="Unread"></div>' : '') +
        '</div>';
    }).join('');

    // Attach click listeners
    list.querySelectorAll('.notif-item').forEach(function(item) {
      item.addEventListener('click', function() { markOneRead(item.dataset.id); });
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') markOneRead(item.dataset.id);
      });
    });
  }

  function buildNotificationDropdown() {
    if (document.getElementById('notifDropdown')) return;

    var notifBtn = document.querySelector('.notification-btn');
    if (!notifBtn) return;

    var dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.setAttribute('role', 'dialog');
    dropdown.setAttribute('aria-label', 'Notifications');
    dropdown.style.cssText = [
      'display:none',
      'position:absolute',
      'top:calc(100% + 12px)',
      'right:0',
      'width:340px',
      'background:var(--color-surface)',
      'border:1px solid var(--color-border)',
      'border-radius:var(--r-xl)',
      'box-shadow:var(--shadow-xl)',
      'z-index:1100',
      'overflow:hidden'
    ].join(';');

    dropdown.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:.875rem 1rem .75rem;border-bottom:1px solid var(--color-border);">' +
        '<div>' +
          '<div style="font-size:.9375rem;font-weight:700;color:var(--color-text-primary);">Notifications</div>' +
          '<div class="notif-count-label" style="font-size:.7rem;color:var(--color-text-muted);margin-top:1px;"></div>' +
        '</div>' +
        '<div style="display:flex;gap:.5rem;">' +
          '<button id="notifMarkAll" style="font-size:.7rem;font-weight:600;color:var(--brand-500);background:none;border:none;cursor:pointer;padding:.25rem .5rem;border-radius:var(--r-sm);" title="Mark all read">Mark all read</button>' +
          '<button id="notifClearAll" style="font-size:.7rem;font-weight:600;color:var(--color-text-muted);background:none;border:none;cursor:pointer;padding:.25rem .5rem;border-radius:var(--r-sm);" title="Clear all">Clear all</button>' +
        '</div>' +
      '</div>' +
      '<div id="notifList" role="list" style="max-height:380px;overflow-y:auto;"></div>';

    // Wrap button in relative container
    var parent = notifBtn.parentNode;
    var wrapDiv = document.createElement('div');
    wrapDiv.style.cssText = 'position:relative;display:inline-flex;align-items:center;';
    parent.insertBefore(wrapDiv, notifBtn);
    wrapDiv.appendChild(notifBtn);
    wrapDiv.appendChild(dropdown);

    // Button actions
    dropdown.querySelector('#notifMarkAll').addEventListener('click', function(e) {
      e.stopPropagation();
      markAllRead();
    });
    dropdown.querySelector('#notifClearAll').addEventListener('click', function(e) {
      e.stopPropagation();
      clearAllNotifications();
    });

    // Toggle on bell click
    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = dropdown.style.display !== 'none';
      closeAllDropdowns();
      if (!isOpen) {
        dropdown.style.display = 'block';
        renderNotifications();
        updateNotifBadge();
        notifBtn.setAttribute('aria-expanded', 'true');
      }
    });
    notifBtn.setAttribute('aria-haspopup', 'dialog');
    notifBtn.setAttribute('aria-expanded', 'false');
  }

  function closeAllDropdowns() {
    var notifDd = document.getElementById('notifDropdown');
    if (notifDd) notifDd.style.display = 'none';
    var notifBtn = document.querySelector('.notification-btn');
    if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
    var profilePopup = document.getElementById('userProfileMenu');
    if (profilePopup) profilePopup.classList.remove('active');
  }

  /* ================================================================
   * 3. PROFILE MENU  ── auth-aware
   * ================================================================ */

  function syncProfileState() {
    var isLoggedIn = window.AppState && window.AppState.isLoggedIn();
    var user = isLoggedIn ? window.AppState.getUser() : null;
    var profileIcon = document.querySelector('.user-profile');
    if (!profileIcon) return;

    if (user && user.name) {
      profileIcon.textContent = user.name.charAt(0).toUpperCase();
      profileIcon.setAttribute('title', user.name + ' — Profile');
      profileIcon.setAttribute('aria-label', 'Logged in as ' + user.name);
    } else {
      profileIcon.textContent = '👤';
      profileIcon.setAttribute('title', 'Login / Register');
      profileIcon.setAttribute('aria-label', 'Guest user. Click to login.');
    }

    var popup = document.getElementById('userProfileMenu');
    if (!popup) return;

    popup.setAttribute('role', 'menu');
    popup.querySelectorAll('.profile-popup-item').forEach(function(item) {
      item.setAttribute('role', 'menuitem');
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');
      // Keyboard activation
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
    });

    if (!isLoggedIn) {
      var nameEl = popup.querySelector('#profilePopupName');
      if (nameEl) nameEl.textContent = 'Guest User';
      var phoneEl = popup.querySelector('#profilePopupPhone');
      if (phoneEl) phoneEl.textContent = 'Please log in to continue';
      var addBtn = popup.querySelector('#btnAddProperty');
      if (addBtn) addBtn.style.display = 'none';

      // Inject login/register if not present
      if (!popup.querySelector('#btnLogin')) {
        var divider = popup.querySelector('.profile-popup-divider');
        var loginHtml =
          '<div class="profile-popup-item" id="btnLogin" role="menuitem" tabindex="0" onclick="if(window.Navigation) Navigation.goToLogin()" style="display:flex;">' +
            '<div class="profile-popup-item-left"><span class="profile-popup-item-icon">🔑</span> Login</div>' +
            '<span class="profile-popup-item-chevron">→</span>' +
          '</div>' +
          '<div class="profile-popup-item" id="btnRegister" role="menuitem" tabindex="0" onclick="if(window.Navigation) Navigation.goToLogin()" style="display:flex;">' +
            '<div class="profile-popup-item-left"><span class="profile-popup-item-icon">✨</span> Register Free</div>' +
            '<span class="profile-popup-item-chevron">→</span>' +
          '</div>';
        if (divider) {
          divider.insertAdjacentHTML('beforebegin', loginHtml);
        } else {
          popup.insertAdjacentHTML('beforeend', loginHtml);
        }
      }
      var logoutBtn = popup.querySelector('#btnLogout');
      var loginBtn  = popup.querySelector('#btnLogin');
      var regBtn    = popup.querySelector('#btnRegister');
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (loginBtn)  loginBtn.style.display  = 'flex';
      if (regBtn)    regBtn.style.display    = 'flex';

    } else {
      var logoutBtn2 = popup.querySelector('#btnLogout');
      var loginBtn2  = popup.querySelector('#btnLogin');
      var regBtn2    = popup.querySelector('#btnRegister');
      if (logoutBtn2) logoutBtn2.style.display = 'flex';
      if (loginBtn2)  loginBtn2.style.display  = 'none';
      if (regBtn2)    regBtn2.style.display    = 'none';

      var role = window.AppState.getRole();
      var addBtnL = popup.querySelector('#btnAddProperty');
      if (addBtnL) addBtnL.style.display = (role === 'owner' || role === 'admin') ? 'flex' : 'none';
    }
  }

  function initProfileMenu() {
    // Wait a tick for profile-menu.js to inject the popup first
    setTimeout(syncProfileState, 150);
    window.addEventListener('appState:userChanged', syncProfileState);
    window.addEventListener('appState:userCleared', syncProfileState);
  }

  /* ================================================================
   * 4. MOBILE MENU  ── keyboard, outside-click, ARIA
   * ================================================================ */

  // Override the global toggleMobileMenu
  window.toggleMobileMenu = function () {
    var dropdown = document.getElementById('navMobileDropdown');
    var toggleBtn = document.querySelector('.mobile-menu-toggle');
    if (!dropdown) return;

    var isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
    dropdown.style.display = isHidden ? 'flex' : 'none';

    if (toggleBtn) {
      toggleBtn.textContent = isHidden ? '✕' : '☰';
      toggleBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', isHidden ? 'Close menu' : 'Open navigation menu');
    }
    if (dropdown) {
      dropdown.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
      // Focus first link when opening
      if (isHidden) {
        var firstLink = dropdown.querySelector('a, button');
        if (firstLink) setTimeout(function() { firstLink.focus(); }, 50);
      }
    }
  };

  function initMobileMenu() {
    var dropdown = document.getElementById('navMobileDropdown');
    var toggleBtn = document.querySelector('.mobile-menu-toggle');
    if (!dropdown || !toggleBtn) return;

    toggleBtn.setAttribute('aria-controls', 'navMobileDropdown');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open navigation menu');
    dropdown.setAttribute('role', 'navigation');
    dropdown.setAttribute('aria-label', 'Mobile navigation');
    dropdown.setAttribute('aria-hidden', 'true');

    // Outside click
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
        if (dropdown.style.display === 'flex') {
          dropdown.style.display = 'none';
          dropdown.setAttribute('aria-hidden', 'true');
          toggleBtn.textContent = '☰';
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.setAttribute('aria-label', 'Open navigation menu');
        }
      }
    });

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && dropdown.style.display === 'flex') {
        dropdown.style.display = 'none';
        dropdown.setAttribute('aria-hidden', 'true');
        toggleBtn.textContent = '☰';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.focus();
      }
      // Close all dropdowns on Escape
      if (e.key === 'Escape') closeAllDropdowns();
    });
  }

  /* ================================================================
   * 5. SCROLL-AWARE STICKY SHADOW
   * ================================================================ */

  function initScrollShadow() {
    var header = document.querySelector('header.header') || document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', function() {
      header.style.boxShadow = window.scrollY > 10 ? 'var(--shadow-md)' : 'none';
    }, { passive: true });
  }

  /* ================================================================
   * 6. INJECT NOTIFICATION STYLES
   * ================================================================ */

  function injectNotifStyles() {
    if (document.getElementById('rewb-notif-styles')) return;
    var s = document.createElement('style');
    s.id = 'rewb-notif-styles';
    s.textContent = [
      '.notif-item{display:flex;align-items:flex-start;gap:.75rem;padding:.75rem 1rem;cursor:pointer;border-bottom:1px solid var(--color-border);transition:background var(--dur-fast);outline:none;}',
      '.notif-item:last-child{border-bottom:none;}',
      '.notif-item:hover,.notif-item:focus{background:var(--color-bg-alt);}',
      '.notif-unread{background:rgba(79,70,229,.04);}',
      '.notif-icon{font-size:1.5rem;flex-shrink:0;margin-top:2px;}',
      '.notif-body{flex:1;min-width:0;}',
      '.notif-title{font-size:.8125rem;font-weight:600;color:var(--color-text-primary);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.notif-text{font-size:.75rem;color:var(--color-text-secondary);line-height:1.4;}',
      '.notif-time{font-size:.7rem;color:var(--color-text-muted);margin-top:3px;}',
      '.notif-dot{width:8px;height:8px;background:var(--brand-500);border-radius:50%;flex-shrink:0;margin-top:5px;}',
      '#notifList::-webkit-scrollbar{width:4px;}',
      '#notifList::-webkit-scrollbar-track{background:transparent;}',
      '#notifList::-webkit-scrollbar-thumb{background:var(--color-border-strong);border-radius:4px;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ================================================================
   * GLOBAL OUTSIDE-CLICK
   * ================================================================ */

  document.addEventListener('click', function(e) {
    var notifDd = document.getElementById('notifDropdown');
    if (!notifDd) return;
    var notifWrap = notifDd.parentElement;
    if (notifWrap && !notifWrap.contains(e.target)) {
      notifDd.style.display = 'none';
      var nb = document.querySelector('.notification-btn');
      if (nb) nb.setAttribute('aria-expanded', 'false');
    }
  });

  /* ================================================================
   * INIT
   * ================================================================ */

  function init() {
    initTheme();
    injectNotifStyles();
    buildNotificationDropdown();
    updateNotifBadge();
    initProfileMenu();
    initMobileMenu();
    initScrollShadow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.rewbNavbar = {
    markOneRead: markOneRead,
    markAllRead: markAllRead,
    clearAll: clearAllNotifications,
    getUnreadCount: getUnreadCount,
  };

})();
