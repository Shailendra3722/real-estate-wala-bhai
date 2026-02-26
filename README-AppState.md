# Global App State Management

## Overview
The `app-state.js` module provides centralized state management for the Real Estate Wala Bhai application. It uses localStorage for persistence and works across all HTML pages.

## Quick Start

### 1. Include the Script
Add this to the `<head>` section of every HTML page:

```html
<script src="app-state.js"></script>
```

### 2. Basic Usage

```javascript
// Login a user
AppState.setUser({
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210'
});

// Set user role
AppState.setRole('buyer'); // or 'owner' or 'admin'

// Select a property
AppState.setPropertyId('property_456');

// Check if logged in
if (AppState.isLoggedIn()) {
    console.log('User is logged in!');
}
```

## API Reference

### User Management

| Method | Description | Example |
|--------|-------------|---------|
| `setUser(userData)` | Store user data | `AppState.setUser({id: '123', name: 'John'})` |
| `getUser()` | Get current user | `const user = AppState.getUser()` |
| `updateUser(updates)` | Update user data | `AppState.updateUser({phone: '1234567890'})` |
| `isLoggedIn()` | Check login status | `if (AppState.isLoggedIn()) {...}` |
| `clearUser()` | Logout user | `AppState.clearUser()` |

### Role Management

| Method | Description | Example |
|--------|-------------|---------|
| `setRole(role)` | Set user role | `AppState.setRole('buyer')` |
| `getRole()` | Get current role | `const role = AppState.getRole()` |
| `isBuyer()` | Check if buyer | `if (AppState.isBuyer()) {...}` |
| `isOwner()` | Check if owner | `if (AppState.isOwner()) {...}` |
| `isAdmin()` | Check if admin | `if (AppState.isAdmin()) {...}` |

**Available Roles:**
- `AppState.ROLES.BUYER` - 'buyer'
- `AppState.ROLES.OWNER` - 'owner'
- `AppState.ROLES.ADMIN` - 'admin'

### Property Management

| Method | Description | Example |
|--------|-------------|---------|
| `setPropertyId(id)` | Set selected property | `AppState.setPropertyId('prop_123')` |
| `getPropertyId()` | Get selected property | `const id = AppState.getPropertyId()` |
| `clearPropertyId()` | Clear selection | `AppState.clearPropertyId()` |

### Session Management

| Method | Description | Example |
|--------|-------------|---------|
| `setAuthToken(token)` | Store auth token | `AppState.setAuthToken('abc123')` |
| `getAuthToken()` | Get auth token | `const token = AppState.getAuthToken()` |
| `updateSession()` | Update session timestamp | `AppState.updateSession()` |
| `getSession()` | Get session data | `const session = AppState.getSession()` |

### Permissions

| Method | Description | Example |
|--------|-------------|---------|
| `canAddProperty()` | Check if can add property | `if (AppState.canAddProperty()) {...}` |
| `canViewProperty()` | Check if can view property | `if (AppState.canViewProperty()) {...}` |

### General

| Method | Description | Example |
|--------|-------------|---------|
| `getState()` | Get complete state | `const state = AppState.getState()` |
| `clearAll()` | Clear all state | `AppState.clearAll()` |
| `debugState()` | Print state to console | `AppState.debugState()` |

## Events

Subscribe to state changes using the `on()` method:

```javascript
// Listen for user changes
AppState.on('userChanged', (user) => {
    console.log('User changed:', user);
    updateUI();
});

// Listen for role changes
AppState.on('roleChanged', (role) => {
    console.log('Role changed:', role);
    updatePermissions();
});

// Listen for property changes
AppState.on('propertyChanged', (propertyId) => {
    console.log('Property selected:', propertyId);
    loadPropertyDetails(propertyId);
});

// Listen for state cleared
AppState.on('stateCleared', () => {
    console.log('All state cleared');
    redirectToLogin();
});
```

## Real-World Examples

### Example 1: Login Flow

```javascript
// login.html
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Simulate API call
    const userData = {
        id: 'user_' + Date.now(),
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };
    
    // Store user data
    AppState.setUser(userData);
    AppState.setRole('buyer');
    AppState.setAuthToken('token_abc123');
    
    // Redirect to home
    window.location.href = 'home.html';
});
```

### Example 2: Protected Page

```javascript
// property-detail.html
window.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!AppState.isLoggedIn()) {
        alert('Please login to view property details');
        window.location.href = 'login.html';
        return;
    }
    
    // Get user data
    const user = AppState.getUser();
    document.getElementById('userName').textContent = user.name;
    
    // Load property details
    const propertyId = AppState.getPropertyId();
    if (propertyId) {
        loadProperty(propertyId);
    }
});
```

### Example 3: Role-Based Access

```javascript
// add-property-step1.html
window.addEventListener('DOMContentLoaded', () => {
    // Check if user can add property
    if (!AppState.canAddProperty()) {
        alert('Only property owners can add listings');
        window.location.href = 'home.html';
        return;
    }
    
    // Continue with add property flow
    console.log('User authorized to add property');
});
```

### Example 4: User Profile Display

```javascript
// Any page with user profile
function updateUserProfile() {
    const user = AppState.getUser();
    const role = AppState.getRole();
    
    if (user) {
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileRole').textContent = role || 'Not set';
    }
}

// Call on page load
window.addEventListener('DOMContentLoaded', updateUserProfile);

// Listen for changes
AppState.on('userChanged', updateUserProfile);
```

### Example 5: Logout

```javascript
// Logout button handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        AppState.clearAll();
        window.location.href = 'login.html';
    }
}
```

## Session Management

Sessions automatically expire after 24 hours of inactivity. The session is automatically updated on user activity (clicks, scrolls, etc.).

```javascript
// Check session status
const session = AppState.getSession();
console.log('Last activity:', session.lastActivity);
```

## Debugging

```javascript
// Print current state to console
AppState.debugState();

// Get complete state object
const state = AppState.getState();
console.log(state);
```

## Technical Details

- **Storage**: Uses `localStorage` for persistence
- **Session Duration**: 24 hours from last activity
- **Auto-update**: Session updates every 5 seconds of user activity
- **Events**: Custom events dispatched for all state changes
- **Namespace**: All data stored with `rewb_` prefix to avoid conflicts

## Best Practices

1. **Always check login status** before accessing protected pages
2. **Use role checks** for permission-based features
3. **Clear state on logout** using `clearAll()`
4. **Subscribe to events** for reactive UI updates
5. **Store auth tokens** for API authentication
6. **Update session** on important user actions

## Files

- `app-state.js` - Main state management module
- `app-state-demo.html` - Interactive demo and testing page
- `README-AppState.md` - This documentation
