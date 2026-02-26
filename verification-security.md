# Verification System - Security & Privacy Guide

## Overview

This document outlines the security measures and privacy considerations for the user verification system.

---

## Data Protection

### 1. Encryption at Rest

All uploaded ID documents are encrypted using AES-256 encryption before storage.

**Implementation:**
- Algorithm: AES-256-CBC
- Key Management: Environment variables (rotate every 90 days)
- IV (Initialization Vector): Random 16 bytes per file
- Storage: IV prepended to encrypted data

**Benefits:**
- ✅ Even if storage is compromised, files are unreadable
- ✅ Meets industry standards for sensitive data
- ✅ Compliant with data protection regulations

---

### 2. Encrypted Transmission

All API communication uses HTTPS/TLS 1.3+.

**Requirements:**
- Force HTTPS in production
- HSTS (HTTP Strict Transport Security) headers
- Valid SSL certificate
- No mixed content

**Server Configuration:**
```nginx
# Force HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

# HTTPS with security headers
server {
    listen 443 ssl http2;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

### 3. Data Minimization

**What We Store:**
- ✅ ID type (Aadhaar/PAN/etc.)
- ✅ Last 4 digits of ID number (masked)
- ✅ Encrypted image file
- ✅ Verification status

**What We DON'T Store:**
- ❌ Full ID number (only last 4 digits)
- ❌ Plaintext images
- ❌ OCR data (unless needed for AI features)

**Database Schema:**
```sql
-- Only masked ID stored
id_number_masked TEXT NOT NULL  -- "XXXX-XXXX-1234"

-- NOT stored:
-- id_number_full (never store this!)
```

---

### 4. Automatic Data Deletion

ID documents are automatically deleted after verification.

**Deletion Policy:**
- ✅ **Approved verifications:** Delete after 30 days
- ✅ **Rejected verifications:** Delete after 90 days (allow resubmission)
- ✅ **Abandoned uploads:** Delete after 7 days

**Implementation (Cron Job):**
```javascript
// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
    const now = new Date();
    
    // Delete approved (30 days)
    await deleteDocuments({
        status: 'approved',
        reviewed_before: new Date(now - 30 * 24 * 60 * 60 * 1000)
    });
    
    // Delete rejected (90 days)
    await deleteDocuments({
        status: 'rejected',
        reviewed_before: new Date(now - 90 * 24 * 60 * 60 * 1000)
    });
    
    console.log('✅ Auto-deletion complete');
});
```

**User Notification:**
> "Your ID document will be automatically deleted 30 days after verification for your privacy."

---

## Access Control

### 1. Role-Based Access

**User Permissions:**
- ✅ Upload own ID
- ✅ View own verification status
- ❌ Cannot view own uploaded image
- ❌ Cannot view others' data

**Admin Permissions:**
- ✅ View pending verifications
- ✅ View uploaded ID images (logged)
- ✅ Approve/reject verifications
- ❌ Cannot download or export images

**Implementation:**
```javascript
// Middleware
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Protect admin endpoints
app.get('/api/admin/verification/queue', isAdmin, getQueue);
```

---

### 2. Audit Logging

Every access to ID documents is logged.

**Logged Actions:**
- `viewed_document`: Admin viewed ID image
- `approved`: Admin approved verification
- `rejected`: Admin rejected verification
- `document_deleted`: Document auto-deleted

**Audit Log Schema:**
```sql
CREATE TABLE verification_audit_log (
    id INTEGER PRIMARY KEY,
    verification_id INTEGER,
    admin_id INTEGER,
    action TEXT,
    timestamp DATETIME,
    ip_address TEXT,
    user_agent TEXT,
    notes TEXT
);
```

**Benefits:**
- ✅ Track who accessed what and when
- ✅ Detect suspicious activity
- ✅ Compliance with data access regulations
- ✅ Accountability for admins

---

### 3. IP Whitelisting (Optional)

Restrict admin dashboard access to specific IP addresses.

**Configuration:**
```javascript
const ADMIN_ALLOWED_IPS = process.env.ADMIN_IPS.split(',');

function checkAdminIP(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!ADMIN_ALLOWED_IPS.includes(clientIP)) {
        console.warn(`⚠️ Unauthorized admin access attempt from ${clientIP}`);
        return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
}

app.use('/api/admin/*', checkAdminIP);
```

---

## Fraud Prevention

### 1. Rate Limiting

Prevent abuse and spam uploads.

**Limits:**
- **User uploads:** 3 per day
- **Status checks:** 10 per minute
- **Admin actions:** 100 per hour

**Implementation:**
```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3,
    message: 'Too many upload attempts. Try again tomorrow.',
    keyGenerator: (req) => req.user.id // Per user
});

app.post('/api/verification/upload', uploadLimiter, uploadHandler);
```

---

### 2. Duplicate Detection

Prevent same ID being used by multiple accounts.

**Check:**
- Hash the uploaded image
- Compare against existing hashes
- Alert if duplicate found

**Implementation:**
```javascript
const crypto = require('crypto');

async function checkDuplicate(fileBuffer) {
    // Generate hash
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Check database
    const existing = await db.query(
        'SELECT user_id FROM user_verifications WHERE document_hash = ?',
        [hash]
    );
    
    if (existing.length > 0) {
        throw new Error('This ID has already been used for verification');
    }
    
    return hash;
}
```

**Limitation:**
- Only detects exact duplicates
- Cropped/rotated versions won't match
- Consider perceptual hashing for better detection

---

### 3. One Verification Per Account

Users can only have one active verification.

**Rules:**
- ❌ Cannot upload if verification is pending
- ❌ Cannot upload if already verified (unless expired)
- ✅ Can reupload if rejected

**Implementation:**
```javascript
async function checkExistingVerification(userId) {
    const existing = await db.query(`
        SELECT status FROM user_verifications 
        WHERE user_id = ? 
        AND status IN ('pending', 'approved')
        ORDER BY submitted_at DESC 
        LIMIT 1
    `, [userId]);
    
    if (existing.length > 0) {
        if (existing[0].status === 'pending') {
            throw new Error('You already have a pending verification');
        }
        if (existing[0].status === 'approved') {
            throw new Error('You are already verified');
        }
    }
}
```

---

### 4. Content Validation

Validate uploaded files before processing.

**Checks:**
1. **File type:** Only JPEG/PNG
2. **File size:** Max 5MB
3. **Image dimensions:** Min 800x600px
4. **EXIF data:** Strip metadata
5. **Malware scan:** Optional but recommended

**Implementation:**
```javascript
const sharp = require('sharp');

async function validateImage(file) {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Only JPEG/PNG images allowed');
    }
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB');
    }
    
    // Check image dimensions
    const metadata = await sharp(file.path).metadata();
    if (metadata.width < 800 || metadata.height < 600) {
        throw new Error('Image resolution too low (min 800x600)');
    }
    
    // Strip EXIF data and re-encode
    await sharp(file.path)
        .rotate() // Auto-rotate based on EXIF
        .jpeg({ quality: 90 })
        .toFile(file.path + '.clean');
    
    return true;
}
```

---

## Privacy Compliance

### 1. User Consent

Clear consent before upload.

**Consent Screen:**
> **Before you upload:**
> - ✅ Your ID is encrypted and stored securely
> - ✅ Only our verification team can view it
> - ✅ We'll delete it 30 days after verification
> - ✅ We never share your ID with third parties
> 
> By uploading, you agree to our [Privacy Policy]

**Legal:**
- GDPR compliant (EU users)
- CCPA compliant (California users)
- Data Protection Act (India)

---

### 2. Data Subject Rights

Users have rights over their data.

**Rights:**
1. **Right to Access:** View verification status
2. **Right to Delete:** Request deletion anytime
3. **Right to Rectify:** Reupload if info incorrect
4. **Right to Portability:** Download verification record

**Implementation:**
```javascript
// Delete my verification
app.delete('/api/verification/me', authenticate, async (req, res) => {
    await db.query(
        'UPDATE user_verifications SET status = "deleted", document_url = NULL WHERE user_id = ?',
        [req.user.id]
    );
    
    await deleteUserDocument(req.user.id);
    
    res.json({ success: true, message: 'Verification deleted' });
});
```

---

### 3. Privacy Policy

**Template:**
```markdown
# Verification Privacy Policy

## What We Collect
- Government ID image (Aadhaar, PAN, etc.)
- Last 4 digits of ID number
- Verification status

## How We Use It
- Verify your identity to build trust
- Prevent fraud
- Show verified badge on your listings

## How Long We Keep It
- ID images: Deleted after 30 days
- Verification status: Kept indefinitely

## Who Can Access It
- Our verification team (access is logged)
- Not shared with third parties
- Not used for marketing

## Your Rights
- Request deletion anytime
- View your verification status
- Resubmit if rejected

## Security
- AES-256 encryption
- HTTPS transmission
- Automatic deletion
- Audit logging

Contact: privacy@realestatewalabhai.com
```

---

## Security Best Practices

### 1. Admin Security

**Requirements:**
- ✅ Strong passwords (min 12 chars)
- ✅ Two-factor authentication (2FA)
- ✅ Session timeout (30 min inactive)
- ✅ IP whitelisting (optional)
- ✅ Admin activity monitoring

**2FA Implementation:**
```javascript
const speakeasy = require('speakeasy');

// Generate 2FA secret
const secret = speakeasy.generateSecret({ name: 'Real Estate Admin' });

// Verify 2FA token
const verified = speakeasy.totp.verify({
    secret: admin.twofa_secret,
    encoding: 'base32',
    token: req.body.code,
    window: 2
});
```

---

### 2. Incident Response Plan

**What to do if data breach occurs:**

1. **Immediate Actions (0-1 hour):**
   - Shut down affected systems
   - Revoke compromised credentials
   - Enable maintenance mode

2. **Investigation (1-24 hours):**
   - Identify what was accessed
   - Check audit logs
   - Determine root cause

3. **Notification (24-72 hours):**
   - Notify affected users
   - Report to regulators (if required)
   - Public disclosure (if needed)

4. **Remediation:**
   - Patch vulnerabilities
   - Reset all admin passwords
   - Rotate encryption keys
   - Enhanced monitoring

**Emergency Contacts:**
```
Security Team: security@company.com
Legal Team: legal@company.com
Data Protection Officer: dpo@company.com
```

---

### 3. Regular Security Audits

**Monthly:**
- Review audit logs for suspicious activity
- Check for unauthorized admin accounts
- Verify encryption is working

**Quarterly:**
- Penetration testing
- Rotate encryption keys
- Review and update security policies

**Annually:**
- Third-party security audit
- Compliance certification (ISO 27001, SOC 2)
- Staff security training

---

## User-Facing Security Messaging

### On Upload Page

> **🔒 Your privacy is protected**
> 
> - Your ID is encrypted and secure
> - Only our team sees it (never buyers/sellers)
> - Automatically deleted after 30 days
> - We never share your personal info

### After Submission

> **✅ Submitted securely**
> 
> Your ID is being reviewed. You'll hear from us within 24 hours.
> 
> **What happens next:**
> 1. Our team verifies your ID
> 2. You get a verified badge
> 3. Your ID is deleted after 30 days
> 
> **Questions?** Read our [Privacy Policy]

### On Rejection

> **We couldn't verify your ID**
> 
> Reason: [Image was blurry/unclear]
> 
> Don't worry! Try again with:
> - Better lighting
> - Clear photo (no blur)
> - All text visible
> 
> Your previous upload was deleted for privacy.
> 
> [Upload New ID]

---

## Compliance Checklist

### GDPR (EU)
- ✅ Lawful basis: Consent
- ✅ Data minimization: Only store what's needed
- ✅ Right to erasure: Users can delete
- ✅ Data portability: Users can export
- ✅ Breach notification: Within 72 hours
- ✅ DPO appointed: dpo@company.com

### CCPA (California)
- ✅ Privacy policy published
- ✅ Opt-out available
- ✅ Do not sell personal info
- ✅ Disclosure of data practices

### IT Act (India)
- ✅ Reasonable security practices
- ✅ Data breach notification
- ✅ Consent for sensitive data
- ✅ Data localization (if applicable)

---

## Summary

**Security Measures:**
- ✅ AES-256 encryption
- ✅ HTTPS/TLS transmission
- ✅ Automatic deletion (30 days)
- ✅ Audit logging
- ✅ Role-based access control
- ✅ Rate limiting
- ✅ Duplicate detection

**Privacy Protections:**
- ✅ Data minimization (only last 4 digits)
- ✅ User consent required
- ✅ Right to deletion
- ✅ Privacy policy
- ✅ No third-party sharing

**Result:** A secure, privacy-first verification system that builds trust! 🔒
