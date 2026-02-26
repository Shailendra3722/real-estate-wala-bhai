# Verification System - Integration Examples

Complete code examples for integrating the verification system into your Real Estate app.

---

## Table of Contents

1. [Adding Badge to Property Cards](#property-cards)
2. [Profile Page Integration](#profile-page)
3. [Navigation Integration](#navigation)
4. [Backend Integration](#backend)
5. [Testing](#testing)

---

## 1. Property Cards Integration

### Add Verification Badge to Property Listings

**HTML Structure:**
```html
<!-- property-card.html -->
<div class="property-card">
    <img src="property.jpg" alt="Property">
    
    <div class="property-details">
        <h3>3 BHK Flat in Pune</h3>
        <p class="price">₹85 Lakhs</p>
        
        <!-- Owner Info with Verification Badge -->
        <div class="owner-info" 
             data-user-id="123" 
             data-verification-status="verified">
            <span class="owner-name">Rajesh Kumar</span>
            <!-- Badge auto-inserted by verification-badge.js -->
        </div>
    </div>
</div>
```

**Key Attributes:**
- `data-user-id`: Property owner's user ID
- `data-verification-status`: `verified`, `pending`, `rejected`, or `unverified`

The badge will be **automatically added** by `verification-badge.js`.

---

### For Existing Property Card Component

If you already have property cards, just add the data attributes:

**Before:**
```html
<p class="owner">By Rajesh Kumar</p>
```

**After:**
```html
<p class="owner" 
   data-user-id="123" 
   data-verification-status="verified">
    By Rajesh Kumar
</p>
```

That's it! The badge appears automatically.

---

## 2. Profile Page Integration

### Show Verification Status on User Profile

**HTML:**
```html
<!-- profile.html -->
<div class="profile-header">
    <img src="avatar.jpg" class="avatar">
    <div class="profile-info">
        <h2 data-user-id="123" data-verification-status="verified">
            Rajesh Kumar
        </h2>
        
        <!-- Verification Status Pill -->
        <div id="verificationStatusContainer"></div>
        
        <!-- CTA for Unverified Users -->
        <div id="verificationCTA"></div>
    </div>
</div>

<script>
// Check user's verification status
const userId = 123; // From session/auth
const status = 'unverified'; // Fetch from API

// Show status pill
if (status === 'verified') {
    const pill = VerificationBadge.createStatusPill('verified');
    document.getElementById('verificationStatusContainer').appendChild(pill);
} else if (status === 'pending') {
    const pill = VerificationBadge.createStatusPill('pending');
    document.getElementById('verificationStatusContainer').appendChild(pill);
} else {
    // Show CTA to get verified
    VerificationBadge.showCTAIfNeeded(userId, status, '#verificationCTA');
}
</script>
```

---

### Fetch Verification Status from Backend

**JavaScript:**
```javascript
async function loadVerificationStatus(userId) {
    try {
        const response = await fetch(`/api/verification/status/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        // Update UI based on status
        if (data.status === 'verified') {
            showVerifiedBadge();
        } else if (data.status === 'pending') {
            showPendingStatus();
        } else {
            showGetVerifiedCTA();
        }
        
        return data.status;
        
    } catch (error) {
        console.error('Failed to load verification status:', error);
        return 'unverified';
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', async () => {
    const userId = getCurrentUserId();
    await loadVerificationStatus(userId);
});
```

---

## 3. Navigation Integration

### Add "Get Verified" Link to User Menu

**HTML:**
```html
<!-- navigation.html -->
<nav class="user-menu">
    <a href="profile.html">My Profile</a>
    <a href="my-properties.html">My Properties</a>
    
    <!-- Show only if not verified -->
    <a href="upload-verification.html" id="getVerifiedLink" class="highlight">
        🔐 Get Verified
    </a>
    
    <a href="logout">Logout</a>
</nav>

<script>
// Hide "Get Verified" link if already verified
async function updateMenu() {
    const status = await VerificationBadge.fetchStatus(getCurrentUserId());
    
    if (status === 'verified') {
        document.getElementById('getVerifiedLink').style.display = 'none';
    }
}

updateMenu();
</script>
```

---

## 4. Backend Integration

### Node.js + Express Example

**Full Implementation:**

```javascript
// server.js
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(express.json());

// File upload configuration
const upload = multer({
    dest: 'uploads/temp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG/PNG allowed'));
        }
    }
});

// ==========================================
// 1. UPLOAD VERIFICATION
// ==========================================
app.post('/api/verification/upload', 
    authenticate, 
    upload.single('file'), 
    async (req, res) => {
        try {
            const { id_type, last_4_digits } = req.body;
            const userId = req.user.id;
            
            // Check for existing pending verification
            const existing = await queryDB(
                'SELECT id FROM user_verifications WHERE user_id = ? AND status = "pending"',
                [userId]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'You already have a pending verification'
                });
            }
            
            // Encrypt and store file
            const encryptedPath = await encryptFile(req.file.path);
            
            // Insert verification record
            const result = await queryDB(`
                INSERT INTO user_verifications 
                (user_id, verification_type, id_number_masked, document_url, status)
                VALUES (?, ?, ?, ?, 'pending')
            `, [userId, id_type, `XXXX-XXXX-${last_4_digits}`, encryptedPath]);
            
            // Notify admins
            await notifyAdmins('New verification pending');
            
            res.json({
                success: true,
                verification_id: result.lastID,
                status: 'pending',
                submitted_at: new Date(),
                estimated_review_hours: 24
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// ==========================================
// 2. GET VERIFICATION STATUS
// ==========================================
app.get('/api/verification/status/:userId', authenticate, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Check authorization
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        const verification = await queryDB(`
            SELECT status, verification_type, submitted_at, reviewed_at
            FROM user_verifications
            WHERE user_id = ?
            ORDER BY submitted_at DESC
            LIMIT 1
        `, [userId]);
        
        if (verification.length === 0) {
            return res.json({
                success: true,
                status: 'unverified',
                badge_level: null
            });
        }
        
        res.json({
            success: true,
            status: verification[0].status,
            verification_type: verification[0].verification_type,
            submitted_at: verification[0].submitted_at,
            reviewed_at: verification[0].reviewed_at,
            badge_level: verification[0].status === 'approved' ? 'verified' : null
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3. ADMIN: GET PENDING QUEUE
// ==========================================
app.get('/api/admin/verification/queue', isAdmin, async (req, res) => {
    try {
        const verifications = await queryDB(`
            SELECT 
                v.id,
                v.user_id,
                u.name as user_name,
                u.phone as user_phone,
                u.email as user_email,
                v.verification_type,
                v.id_number_masked,
                v.document_url,
                v.submitted_at,
                (SELECT COUNT(*) FROM properties WHERE user_id = v.user_id) as property_count,
                (SELECT COUNT(*) FROM verification_audit_log WHERE verification_id = v.id AND action = 'viewed_document') as view_count
            FROM user_verifications v
            JOIN users u ON v.user_id = u.id
            WHERE v.status = 'pending'
            ORDER BY v.submitted_at ASC
        `);
        
        res.json({
            success: true,
            count: verifications.length,
            verifications: verifications
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 4. ADMIN: APPROVE VERIFICATION
// ==========================================
app.post('/api/admin/verification/approve', isAdmin, async (req, res) => {
    try {
        const { verification_id, notes } = req.body;
        const adminId = req.user.id;
        
        // Update verification
        await queryDB(`
            UPDATE user_verifications
            SET status = 'approved',
                reviewed_at = CURRENT_TIMESTAMP,
                reviewed_by = ?
            WHERE id = ?
        `, [adminId, verification_id]);
        
        // Log action
        await queryDB(`
            INSERT INTO verification_audit_log
            (verification_id, admin_id, action, notes, ip_address)
            VALUES (?, ?, 'approved', ?, ?)
        `, [verification_id, adminId, notes, req.ip]);
        
        // Get user email for notification
        const verification = await queryDB(`
            SELECT u.email, u.name
            FROM user_verifications v
            JOIN users u ON v.user_id = u.id
            WHERE v.id = ?
        `, [verification_id]);
        
        // Send email notification
        await sendEmail({
            to: verification[0].email,
            subject: '✅ You are now verified!',
            text: `Hi ${verification[0].name}, your verification has been approved!`
        });
        
        res.json({
            success: true,
            verification_id: verification_id,
            status: 'approved',
            reviewed_at: new Date()
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 5. ADMIN: REJECT VERIFICATION
// ==========================================
app.post('/api/admin/verification/reject', isAdmin, async (req, res) => {
    try {
        const { verification_id, reason, custom_reason } = req.body;
        const adminId = req.user.id;
        
        const reasonText = reason === 'other' ? custom_reason : getRejectionReasonText(reason);
        
        // Update verification
        await queryDB(`
            UPDATE user_verifications
            SET status = 'rejected',
                reviewed_at = CURRENT_TIMESTAMP,
                reviewed_by = ?,
                rejection_reason = ?
            WHERE id = ?
        `, [adminId, reasonText, verification_id]);
        
        // Log action
        await queryDB(`
            INSERT INTO verification_audit_log
            (verification_id, admin_id, action, notes, ip_address)
            VALUES (?, ?, 'rejected', ?, ?)
        `, [verification_id, adminId, reasonText, req.ip]);
        
        // Notify user
        const verification = await queryDB(`
            SELECT u.email, u.name
            FROM user_verifications v
            JOIN users u ON v.user_id = u.id
            WHERE v.id = ?
        `, [verification_id]);
        
        await sendEmail({
            to: verification[0].email,
            subject: 'Verification Update',
            text: `Hi ${verification[0].name}, we couldn't verify your ID. Reason: ${reasonText}. Please try again with a clearer photo.`
        });
        
        res.json({
            success: true,
            verification_id: verification_id,
            status: 'rejected',
            rejection_reason: reasonText,
            reviewed_at: new Date()
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    // Verify JWT token (implementation depends on your auth system)
    const user = verifyToken(token);
    req.user = user;
    next();
}

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

async function encryptFile(filePath) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    const fileBuffer = await fs.promises.readFile(filePath);
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    
    const outputPath = `uploads/encrypted/${Date.now()}.enc`;
    await fs.promises.writeFile(outputPath, Buffer.concat([iv, encrypted]));
    
    // Delete temp file
    await fs.promises.unlink(filePath);
    
    return outputPath;
}

function getRejectionReasonText(code) {
    const reasons = {
        'blurry': 'Blurry/unreadable image',
        'name_mismatch': "Name doesn't match profile",
        'digits_mismatch': "Last 4 digits don't match",
        'fake': 'Document appears fake/edited',
        'expired': 'Expired document'
    };
    return reasons[code] || 'Unknown reason';
}

function queryDB(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## 5. Testing

### Manual Testing Checklist

**User Upload Flow:**
- [ ] Upload valid Aadhaar with correct last 4 digits → Status = pending
- [ ] Try uploading while pending → Error message
- [ ] Upload file > 5MB → Error
- [ ] Upload non-image file → Error
- [ ] Check status after upload → Shows "pending"

**Admin Review Flow:**
- [ ] View pending queue → Shows submitted verifications
- [ ] Click to enlarge image → Image modal opens
- [ ] Approve verification → Status updates, user notified
- [ ] Reject with reason → Status updates, rejection reason stored
- [ ] Check audit log → Actions are logged

**Badge Display:**
- [ ] Verified user listing → Blue checkmark visible
- [ ] Pending user listing → Yellow badge or no badge
- [ ] Unverified user listing → No badge
- [ ] Hover on badge → Tooltip shows

---

## Summary

**Files to Include:**
1. `verification-badge.css` - Badge styles
2. `verification-badge.js` - Badge controller
3. `upload-verification.html` - User upload page
4. `admin-verification-dashboard.html` - Admin dashboard

**Backend Requirements:**
1. Database schema (`verification_schema.sql`)
2. API endpoints (see above)
3. File encryption logic
4. Email notifications

**That's it!** Your verification system is ready. 🎉
