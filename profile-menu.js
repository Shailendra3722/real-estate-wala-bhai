/**
 * ==========================================
 * PROFILE MENU COMPONENT
 * ==========================================
 * 
 * Handles the display of the user profile popup menu.
 * Closes when clicking outside.
 */

document.addEventListener('DOMContentLoaded', () => {
    // We expect the profile icon to have the class .user-profile
    const profileIcon = document.querySelector('.user-profile');
    if (!profileIcon) return;

    // Create the popup menu HTML structure dynamically
    const popupHtml = `
        <div class="profile-popup" id="userProfileMenu">
            <div class="profile-popup-header">
                <div class="profile-popup-avatar-wrapper">
                    <div class="profile-popup-avatar" id="profilePopupAvatar">G</div>
                    <div class="profile-popup-badge-icon" id="profilePopupBadge" style="display: none;">✓</div>
                </div>
                <div class="profile-popup-info">
                    <div class="profile-popup-wrapper-name">
                        <div class="profile-popup-name" id="profilePopupName">Guest User</div>
                    </div>
                    <div class="profile-popup-phone" id="profilePopupPhone">Please log in</div>
                </div>
            </div>
            
            <div class="profile-popup-item" id="btnMyDetails">
                <div class="profile-popup-item-left">
                    <span class="profile-popup-item-icon">👤</span> My Details
                </div>
                <span class="profile-popup-item-chevron">→</span>
            </div>
            
            <div class="profile-popup-item" id="btnSavedProperties">
                <div class="profile-popup-item-left">
                    <span class="profile-popup-item-icon">❤️</span> Saved Properties
                </div>
                <span class="profile-popup-item-chevron">→</span>
            </div>
            
            <div class="profile-popup-item" id="btnAddProperty" style="display: none;">
                <div class="profile-popup-item-left">
                    <span class="profile-popup-item-icon">✨</span> List a Property
                </div>
                <span class="profile-popup-item-chevron">→</span>
            </div>

            <div class="profile-popup-item" id="btnSettings">
                <div class="profile-popup-item-left">
                    <span class="profile-popup-item-icon">⚙️</span> Settings
                </div>
                <span class="profile-popup-item-chevron">→</span>
            </div>

            <div class="profile-popup-item" id="btnSupport">
                <div class="profile-popup-item-left">
                    <span class="profile-popup-item-icon">🎧</span> Help & Support
                </div>
                <span class="profile-popup-item-chevron">→</span>
            </div>
            
            <div class="profile-popup-divider"></div>
            
            <div class="profile-popup-item danger" id="btnLogout">
                <div class="profile-popup-item-left">
                    <span class="profile-popup-item-icon">🚪</span> Logout
                </div>
            </div>
        </div>
    `;

    // Wrap the icon in a relative container so the absolute popup positions correctly
    const parent = profileIcon.parentNode;
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';

    // Move the icon into the wrapper, then the wrapper into the DOM
    parent.insertBefore(wrapper, profileIcon);
    wrapper.appendChild(profileIcon);

    // Inject the popup HTML
    wrapper.insertAdjacentHTML('beforeend', popupHtml);

    const popup = document.getElementById('userProfileMenu');

    // Set up user data
    function updateMenuData() {
        const user = window.AppState ? window.AppState.getUser() : null;
        const role = window.AppState ? window.AppState.getRole() : null;

        if (user && user.name) {
            document.getElementById('profilePopupName').textContent = user.name;
            document.getElementById('profilePopupPhone').textContent = user.phone || 'No phone provided';

            // Set Avatar Initial
            const initial = user.name.charAt(0).toUpperCase();
            document.getElementById('profilePopupAvatar').textContent = initial;

            // Show verification badge if applicable (mocking property 'isVerified' for luxury feel)
            if (user.isVerified) {
                const badge = document.getElementById('profilePopupBadge');
                badge.style.display = 'flex';
                badge.style.color = 'var(--gold-600)';
                badge.innerHTML = '✓';
            }

            if (role === 'owner') {
                document.getElementById('btnAddProperty').style.display = 'flex';
            }
        }
    }

    // Toggle Menu on Click
    profileIcon.addEventListener('click', (e) => {
        // Prevent default onclick defined in home.html
        e.preventDefault();
        e.stopPropagation();

        updateMenuData();
        popup.classList.toggle('active');
    });

    // Actions
    document.getElementById('btnMyDetails').addEventListener('click', () => {
        window.location.href = 'settings.html';
        popup.classList.remove('active');
    });

    document.getElementById('btnSavedProperties').addEventListener('click', () => {
        // Assume property-list.html can show saved properties
        window.location.href = 'property-list.html?saved=true';
        popup.classList.remove('active');
    });

    document.getElementById('btnAddProperty').addEventListener('click', () => {
        if (window.Navigation) window.Navigation.goToAddProperty();
        popup.classList.remove('active');
    });

    document.getElementById('btnSettings').addEventListener('click', () => {
        window.location.href = 'settings.html';
        popup.classList.remove('active');
    });

    document.getElementById('btnSupport').addEventListener('click', () => {
        window.location.href = 'mailto:support@realestatewala.com?subject=Need Help';
        popup.classList.remove('active');
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
        if (window.Navigation) window.Navigation.logout();
        popup.classList.remove('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target) && popup.classList.contains('active')) {
            popup.classList.remove('active');
        }
    });
});
