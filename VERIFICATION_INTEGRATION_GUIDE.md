# User Verification System - Integration Guide

## 📋 Quick Start

The verification system is ready to use! Here's how to integrate it across your app.

---

## 🗂️ Files Created

### Core System
1. **verification-service.js** - Business logic, ID masking, approval workflow
2. **verification-badges.css** - Reusable badge styles

### User Pages
3. **verify-account.html** - Upload ID for verification
4. **verification-status.html** - Check verification status

### Admin Pages
5. **admin-verifications.html** - Review and approve/reject queue

---

## 🔧 Integration Steps

### 1. Add Scripts to Pages

Add to `<head>` of all pages that need verification:

```html
<script src="verification-service.js"></script>
<link rel="stylesheet" href="verification-badges.css">
```

### 2. Show Verification Badge on User Profile

```javascript
// Get user verification status
const userId = AppState.getUserEmail();
const verification = VerificationService.getUserVerification(userId);
const status = verification ? verification.verificationStatus : 'none';

// Add badge HTML
const badgeHTML = VerificationService.getBadgeHTML(status);
document.getElementById('userBadge').innerHTML = badgeHTML;
```

### 3. Show Badge on Property Cards

```html
<!-- In property card HTML -->
<div class="property-card">
    <div id="ownerBadge"></div>
    <!-- Rest of property card -->
</div>

<script>
// Add badge for property owner
const ownerVerification = VerificationService.getUserVerification(property.ownerId);
const status = ownerVerification ? ownerVerification.verificationStatus : 'none';

if (status === 'approved') {
    document.getElementById('ownerBadge').innerHTML = `
        <div class="verification-badge-inline">
            <span class="badge-icon">✓</span>
            <span>Verified Owner</span>
        </div>
    `;
}
</script>
```

### 4. Add "Get Verified" Button

```html
<!-- In user profile or settings -->
<button onclick="window.location.href='verify-account.html'">
    Get Verified
</button>
```

### 5. Link to Admin Panel

```html
<!-- In admin dashboard -->
<a href="admin-verifications.html">
    Verification Queue
    <span class="badge">${pendingCount}</span>
</a>
```

---

## 🎯 User Flow

```
1. User clicks "Get Verified"
   ↓
2. Opens verify-account.html
   - Chooses ID type (Aadhaar/PAN/License/Passport)
   - Uploads photos
   - Enters ID number
   - Submits
   ↓
3. Status: Pending (verification-status.html)
   ↓
4. Admin reviews in admin-verifications.html
   - Views ID photos
   - Approves or Rejects
   ↓
5. User becomes Verified
   - Badge appears everywhere
   - Trust score increases to 75
```

---

## 🔐 ID Types Supported

| ID Type | Format | Example |
|---------|--------|---------|
| Aadhaar | 12 digits | XXXX-XXXX-1234 |
| PAN | 10 chars | XXXXX1234 |
| License | Variable | XXXXXXX1234 |
| Passport | 8 chars | XXXX1234 |

**All IDs are masked** to show only last 4 characters for privacy.

---

## 🛡️ Trust Scores

| Status | Score | Benefits |
|--------|-------|----------|
| None | 0 | 1 property max |
| Pending | 25 | 2 properties max |
| Verified | 75 | Unlimited, priority listing |
| Premium | 100 | Featured + business features |

---

## 🎨 Badge Examples

### HTML Usage

**Verified:**
```html
<div class="verification-badge verified">
    <span class="badge-icon">✓</span>
    <span class="badge-text">Verified</span>
</div>
```

**Pending:**
```html
<div class="verification-badge pending">
    <span class="badge-icon">⏳</span>
    <span class="badge-text">Pending</span>
</div>
```

**Not Verified:**
```html
<div class="verification-badge none">
    <span class="badge-icon">?</span>
    <span class="badge-text">Get Verified</span>
</div>
```

### JavaScript Usage

```javascript
// Get badge HTML dynamically
const badgeHTML = VerificationService.getBadgeHTML('approved');
element.innerHTML = badgeHTML;
```

---

## 🔄 Future API Integration

### Current: Manual Upload
```javascript
// User uploads ID photo
submitVerification(userId, {
    idType: 'aadhaar',
    photoFront: base64Image,
    idNumber: '123456789012'
});

// Admin reviews manually
```

### Future: Aadhaar API
```javascript
// Switch via config flag
const VERIFICATION_CONFIG = {
    USE_AADHAAR_API: true  // Enable when API available
};

// Code automatically uses API instead
if (USE_AADHAAR_API) {
    // Send OTP to Aadhaar-linked mobile
    // User enters OTP
    // Auto-verify via eKYC API
} else {
    // Fallback to manual upload
}
```

**Architecture is ready** for seamless API integration!

---

## ✨ Summary

**Created:**
- ✅ ID upload system (Aadhaar/PAN/License/Passport)
- ✅ Admin approval panel
- ✅ Trust score system (0-100)
- ✅ Verification badges
- ✅ Future API integration ready

**Integration:**
- Add 2 lines to any page (script + CSS)
- Use `VerificationService` to show badges
- Link to upload/status/admin pages

**Zero backend changes needed!** Works with localStorage for demo. Easy to swap for real API.
