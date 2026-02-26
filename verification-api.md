# Verification System API Documentation

## Overview

Backend API endpoints for the user verification system. This API handles ID uploads, admin reviews, and verification status tracking.

---

## Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Admin-only endpoints additionally check for `role === 'admin'`.

---

## API Endpoints

### 1. Upload Verification

Submit a new ID verification request.

**Endpoint:** `POST /api/verification/upload`

**Auth:** User (authenticated)

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `id_type`: string (aadhaar | pan | driving_license | passport)
  - `last_4_digits`: string (4 digits)
  - `file`: file (image, max 5MB)

**Example:**
```javascript
const formData = new FormData();
formData.append('id_type', 'aadhaar');
formData.append('last_4_digits', '1234');
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/verification/upload', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});

const data = await response.json();
// { verification_id: 123, status: 'pending', submitted_at: '2026-02-04T...' }
```

**Response (200):**
```json
{
    "success": true,
    "verification_id": 123,
    "status": "pending",
    "submitted_at": "2026-02-04T14:30:00Z",
    "estimated_review_hours": 24
}
```

**Error (400):**
```json
{
    "success": false,
    "error": "You already have a pending verification"
}
```

---

### 2. Check Verification Status

Get current verification status for a user.

**Endpoint:** `GET /api/verification/status/:user_id`

**Auth:** User (authenticated, own status) or Admin

**Response (200):**
```json
{
    "success": true,
    "status": "approved",
    "verification_type": "aadhaar",
    "submitted_at": "2026-02-04T12:00:00Z",
    "reviewed_at": "2026-02-04T14:30:00Z",
    "badge_level": "verified",
    "expires_at": null
}
```

**Status values:**
- `unverified`: No verification submitted
- `pending`: Under review
- `approved`: Verified ✅
- `rejected`: Rejected (with reason)
- `expired`: Need re-verification

**Example:**
```javascript
const response = await fetch(`/api/verification/status/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
});

const data = await response.json();
if (data.status === 'approved') {
    // Show verified badge
}
```

---

### 3. Get Pending Queue (Admin)

Get all pending verifications for review.

**Endpoint:** `GET /api/admin/verification/queue`

**Auth:** Admin only

**Query Parameters:**
- `sort`: string (optional, default: submitted_at ASC)
- `id_type`: string (optional filter)
- `limit`: number (optional, default: 50)

**Response (200):**
```json
{
    "success": true,
    "count": 12,
    "verifications": [
        {
            "id": 123,
            "user_id": 45,
            "user_name": "Rajesh Kumar",
            "user_phone": "+91 98765 43210",
            "user_email": "rajesh@email.com",
            "verification_type": "aadhaar",
            "id_number_masked": "XXXX-XXXX-1234",
            "document_url": "/api/admin/verification/document/123",
            "submitted_at": "2026-02-04T12:30:00Z",
            "property_count": 3,
            "view_count": 0
        }
    ]
}
```

**Example:**
```javascript
const response = await fetch('/api/admin/verification/queue?sort=submitted_at', {
    headers: { Authorization: `Bearer ${adminToken}` }
});

const { verifications } = await response.json();
// Display in admin dashboard
```

---

### 4. Get Verification Document (Admin)

Get the uploaded ID document image.

**Endpoint:** `GET /api/admin/verification/document/:verification_id`

**Auth:** Admin only

**Response:** Image file (JPEG/PNG) or 404

**Note:** This logs the view action in audit_log.

**Example:**
```html
<img src="/api/admin/verification/document/123" alt="ID proof">
```

---

### 5. Approve Verification (Admin)

Approve a pending verification.

**Endpoint:** `POST /api/admin/verification/approve`

**Auth:** Admin only

**Request:**
```json
{
    "verification_id": 123,
    "notes": "All details verified"
}
```

**Response (200):**
```json
{
    "success": true,
    "verification_id": 123,
    "status": "approved",
    "reviewed_at": "2026-02-04T15:00:00Z"
}
```

**Side Effects:**
- Updates `user_verifications.status = 'approved'`
- Sets `reviewed_at` and `reviewed_by`
- Logs action in `verification_audit_log`
- Sends notification to user (email/push)
- User gets verified badge on listings

**Example:**
```javascript
const response = await fetch('/api/admin/verification/approve', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        verification_id: 123,
        notes: 'Verified successfully'
    })
});
```

---

### 6. Reject Verification (Admin)

Reject a pending verification.

**Endpoint:** `POST /api/admin/verification/reject`

**Auth:** Admin only

**Request:**
```json
{
    "verification_id": 123,
    "reason": "blurry",
    "custom_reason": "Image is too dark to read"
}
```

**Reason codes:**
- `blurry`: Blurry/unreadable image
- `name_mismatch`: Name doesn't match profile
- `digits_mismatch`: Last 4 digits don't match
- `fake`: Document appears fake/edited
- `expired`: Expired document
- `other`: Custom reason (requires custom_reason field)

**Response (200):**
```json
{
    "success": true,
    "verification_id": 123,
    "status": "rejected",
    "rejection_reason": "Blurry/unreadable image",
    "reviewed_at": "2026-02-04T15:00:00Z"
}
```

**Side Effects:**
- Updates `user_verifications.status = 'rejected'`
- Stores rejection reason
- Logs action in `verification_audit_log`
- Sends notification to user with resubmission instructions
- User can upload new ID

---

### 7. Get Verification Statistics (Admin)

Get analytics and stats for the verification system.

**Endpoint:** `GET /api/admin/verification/stats`

**Auth:** Admin only

**Response (200):**
```json
{
    "success": true,
    "stats": {
        "total_submissions": 412,
        "pending_count": 12,
        "approved_count": 387,
        "rejected_count": 13,
        "avg_review_hours": 2.3,
        "last_submission": "2026-02-04T14:30:00Z",
        "approval_rate": 0.94,
        "by_id_type": {
            "aadhaar": 245,
            "pan": 120,
            "driving_license": 35,
            "passport": 12
        }
    }
}
```

---

## Future API Integration Points

### DigiLocker Integration (Phase 3)

**Endpoint:** `POST /api/verification/digilocker`

**Flow:**
1. User clicks "Verify with DigiLocker"
2. Redirect to DigiLocker OAuth
3. User authenticates and authorizes
4. Fetch documents from DigiLocker
5. Auto-approve (already government-verified)

**Implementation:**
```javascript
// Redirect to DigiLocker
window.location.href = '/api/verification/digilocker/authorize';

// After OAuth callback
POST /api/verification/digilocker/verify
{
    "authorization_code": "ABC123",
    "document_type": "aadhaar"
}

// Response
{
    "success": true,
    "status": "approved",
    "source": "digilocker",
    "verified_at": "2026-02-04T15:00:00Z"
}
```

---

### Aadhaar e-KYC Integration (Phase 3)

**Endpoint:** `POST /api/verification/aadhaar-otp`

**Flow:**
1. User enters Aadhaar number
2. Send OTP via UIDAI API
3. User enters OTP
4. Fetch KYC data from UIDAI
5. Auto-approve

**Implementation:**
```javascript
// Step 1: Request OTP
POST /api/verification/aadhaar-otp/request
{
    "aadhaar_number": "1234 5678 9012"
}

// Response
{
    "success": true,
    "transaction_id": "TXN123456"
}

// Step 2: Verify OTP
POST /api/verification/aadhaar-otp/verify
{
    "transaction_id": "TXN123456",
    "otp": "123456"
}

// Response
{
    "success": true,
    "status": "approved",
    "kyc_data": {
        "name": "Rajesh Kumar",
        "dob": "1990-01-01",
        "address": "..."
    }
}
```

---

## Security Considerations

### 1. File Upload Security

```javascript
// Validate file type (server-side)
const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
}

// Validate file size (5MB max)
if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large');
}

// Scan for malware (optional but recommended)
await scanFile(file.path);
```

### 2. Encrypted Storage

```javascript
// Encrypt before storing
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY; // 32 bytes
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(fileBuffer);
encrypted = Buffer.concat([encrypted, cipher.final()]);

// Store: iv + encrypted data
const storedData = Buffer.concat([iv, encrypted]);
await saveToStorage(storedData);
```

### 3. Access Control

```javascript
// Only admin can view documents
app.get('/api/admin/verification/document/:id', isAdmin, async (req, res) => {
    const verification = await getVerification(req.params.id);
    
    // Log access for audit
    await logAudit({
        verification_id: req.params.id,
        admin_id: req.user.id,
        action: 'viewed_document',
        ip_address: req.ip
    });
    
    res.sendFile(verification.document_url);
});
```

### 4. Rate Limiting

```javascript
// Max 3 uploads per day per user
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3,
    message: 'Too many upload attempts, try again tomorrow'
});

app.post('/api/verification/upload', uploadLimiter, uploadHandler);
```

### 5. Auto-Deletion

```javascript
// Cron job: Delete documents after verification (30 days)
const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const oldVerifications = await db.query(`
        SELECT id, document_url
        FROM user_verifications
        WHERE status IN ('approved', 'rejected')
        AND reviewed_at < ?
        AND document_url IS NOT NULL
    `, [cutoffDate]);
    
    for (const verification of oldVerifications) {
        // Delete file
        await deleteFile(verification.document_url);
        
        // Update database
        await db.query(`
            UPDATE user_verifications
            SET document_url = NULL
            WHERE id = ?
        `, [verification.id]);
        
        // Log deletion
        await logAudit({
            verification_id: verification.id,
            admin_id: null,
            action: 'document_deleted',
            notes: 'Auto-deleted after 30 days'
        });
    }
});
```

---

## Testing Examples

### User Upload Flow Test

```javascript
describe('Verification Upload', () => {
    it('should upload ID successfully', async () => {
        const formData = new FormData();
        formData.append('id_type', 'aadhaar');
        formData.append('last_4_digits', '1234');
        formData.append('file', mockImageFile);
        
        const response = await request(app)
            .post('/api/verification/upload')
            .set('Authorization', `Bearer ${userToken}`)
            .send(formData);
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('pending');
    });
    
    it('should reject duplicate upload', async () => {
        // Upload once
        await uploadVerification(userId, 'aadhaar');
        
        // Try again
        const response = await uploadVerification(userId, 'aadhaar');
        
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('pending verification');
    });
});
```

### Admin Approval Test

```javascript
describe('Admin Verification Review', () => {
    it('should approve verification', async () => {
        const verificationId = await createPendingVerification();
        
        const response = await request(app)
            .post('/api/admin/verification/approve')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ verification_id: verificationId });
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('approved');
        
        // Check user now has verified badge
        const user = await getUser(userId);
        expect(user.verification_status).toBe('verified');
    });
});
```

---

## Integration Examples

### Frontend Integration (React)

```javascript
// VerificationUpload.jsx
import { useState } from 'react';

function VerificationUpload() {
    const [file, setFile] = useState(null);
    const [idType, setIdType] = useState('');
    const [last4, setLast4] = useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('id_type', idType);
        formData.append('last_4_digits', last4);
        formData.append('file', file);
        
        const response = await fetch('/api/verification/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            alert('✅ Submitted for verification!');
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <select value={idType} onChange={(e) => setIdType(e.target.value)}>
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN</option>
            </select>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <input 
                type="text" 
                maxLength="4" 
                value={last4} 
                onChange={(e) => setLast4(e.target.value)} 
            />
            <button type="submit">Submit</button>
        </form>
    );
}
```

### Backend Integration (Node.js + Express)

```javascript
// routes/verification.js
const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ 
    dest: 'uploads/temp/',
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/upload', 
    authenticate, 
    upload.single('file'), 
    async (req, res) => {
        try {
            const { id_type, last_4_digits } = req.body;
            const file = req.file;
            
            // Check for existing pending verification
            const existing = await db.query(
                'SELECT id FROM user_verifications WHERE user_id = ? AND status = "pending"',
                [req.user.id]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'You already have a pending verification'
                });
            }
            
            // Encrypt and store file
            const encryptedPath = await encryptAndStore(file.path);
            
            // Insert verification
            const result = await db.query(`
                INSERT INTO user_verifications 
                (user_id, verification_type, id_number_masked, document_url, status)
                VALUES (?, ?, ?, ?, 'pending')
            `, [
                req.user.id,
                id_type,
                `XXXX-XXXX-${last_4_digits}`,
                encryptedPath
            ]);
            
            // Send notification to admins
            await notifyAdmins('New verification pending');
            
            res.json({
                success: true,
                verification_id: result.insertId,
                status: 'pending',
                submitted_at: new Date(),
                estimated_review_hours: 24
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

module.exports = router;
```

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | `DUPLICATE_VERIFICATION` | User already has pending verification |
| 400 | `INVALID_FILE_TYPE` | File must be image (JPEG/PNG) |
| 400 | `FILE_TOO_LARGE` | File exceeds 5MB limit |
| 401 | `UNAUTHORIZED` | Missing or invalid auth token |
| 403 | `FORBIDDEN` | Admin access required |
| 404 | `VERIFICATION_NOT_FOUND` | Verification ID doesn't exist |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many upload attempts |
| 500 | `SERVER_ERROR` | Internal server error |

---

## Webhooks (Optional)

Send notifications to external systems when verification status changes.

**Configuration:**
```javascript
// .env
WEBHOOK_URL=https://your-app.com/webhooks/verification
WEBHOOK_SECRET=your_secret_key
```

**Payload:**
```json
{
    "event": "verification.approved",
    "timestamp": "2026-02-04T15:00:00Z",
    "data": {
        "verification_id": 123,
        "user_id": 45,
        "status": "approved",
        "reviewed_by": 2
    },
    "signature": "sha256_hash"
}
```

Events:
- `verification.submitted`
- `verification.approved`
- `verification.rejected`
- `verification.expired`

---

## Next Steps for Implementation

1. ✅ Database schema created
2. ✅ Frontend UI built (upload + admin dashboard)
3. ⏭️ **Implement backend API:**
   - File upload handling
   - Encryption/decryption
   - Admin approval/rejection
   - Audit logging
4. ⏭️ **Add authentication:**
   - JWT tokens
   - Role-based access (user vs admin)
5. ⏭️ **Set up notifications:**
   - Email on approval/rejection
   - Push notifications (optional)
6. ⏭️ **Testing:**
   - Unit tests for API endpoints
   - Integration tests
   - Security testing

---

**Total Estimated Implementation Time:** 8-10 hours for backend API + testing
