-- ==========================================
-- USER VERIFICATION SYSTEM - DATABASE SCHEMA
-- ==========================================
-- Aadhaar-inspired verification with admin approval
-- Future-ready for API integration

-- ==========================================
-- 1. USER VERIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_verifications (
    -- Primary identification
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Verification details
    verification_type TEXT NOT NULL CHECK(verification_type IN ('aadhaar', 'pan', 'driving_license', 'passport')),
    id_number_masked TEXT NOT NULL, -- Only last 4 digits: "XXXX-XXXX-1234"
    document_url TEXT NOT NULL, -- Encrypted storage path
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'expired')),
    
    -- Timestamps
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    expires_at DATETIME, -- For periodic re-verification
    
    -- Review details
    reviewed_by INTEGER, -- Admin user_id
    rejection_reason TEXT,
    
    -- Additional data (JSON)
    metadata TEXT, -- OCR results, AI scores, etc. for future use
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_submitted ON user_verifications(submitted_at);

-- ==========================================
-- 2. VERIFICATION AUDIT LOG
-- ==========================================
CREATE TABLE IF NOT EXISTS verification_audit_log (
    -- Primary identification
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verification_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    
    -- Action details
    action TEXT NOT NULL CHECK(action IN ('viewed_document', 'approved', 'rejected', 'document_deleted')),
    notes TEXT,
    
    -- Security tracking
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Constraints
    FOREIGN KEY (verification_id) REFERENCES user_verifications(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_verification_id ON verification_audit_log(verification_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON verification_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON verification_audit_log(timestamp);

-- ==========================================
-- 3. VERIFICATION SETTINGS (Configuration)
-- ==========================================
CREATE TABLE IF NOT EXISTS verification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT OR IGNORE INTO verification_settings (setting_key, setting_value) VALUES
    ('auto_delete_days', '30'), -- Delete ID proofs after 30 days
    ('max_upload_attempts_per_day', '3'),
    ('verification_required_for_listing', 'false'), -- Can users list without verification?
    ('show_verification_badge', 'true'),
    ('api_integration_enabled', 'false'); -- Future: DigiLocker/Aadhaar API

-- ==========================================
-- 4. HELPER VIEWS
-- ==========================================

-- View: Pending verifications queue (for admin dashboard)
CREATE VIEW IF NOT EXISTS v_pending_verifications AS
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
ORDER BY v.submitted_at ASC;

-- View: Verification statistics (for admin analytics)
CREATE VIEW IF NOT EXISTS v_verification_stats AS
SELECT 
    COUNT(*) as total_submissions,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
    AVG(CASE WHEN reviewed_at IS NOT NULL 
        THEN (julianday(reviewed_at) - julianday(submitted_at)) * 24 
        ELSE NULL END) as avg_review_hours,
    MAX(submitted_at) as last_submission
FROM user_verifications;

-- View: User verification status (for badge display)
CREATE VIEW IF NOT EXISTS v_user_verification_status AS
SELECT 
    u.id as user_id,
    u.name,
    CASE 
        WHEN v.status = 'approved' AND (v.expires_at IS NULL OR v.expires_at > CURRENT_TIMESTAMP) THEN 'verified'
        WHEN v.status = 'pending' THEN 'pending'
        WHEN v.status = 'rejected' THEN 'rejected'
        ELSE 'unverified'
    END as verification_status,
    v.verification_type,
    v.reviewed_at,
    v.expires_at
FROM users u
LEFT JOIN user_verifications v ON u.id = v.user_id 
    AND v.id = (SELECT id FROM user_verifications WHERE user_id = u.id ORDER BY submitted_at DESC LIMIT 1);

-- ==========================================
-- 5. SAMPLE DATA (for testing)
-- ==========================================

-- Sample verification submission (status: pending)
-- INSERT INTO user_verifications (user_id, verification_type, id_number_masked, document_url, status)
-- VALUES (1, 'aadhaar', 'XXXX-XXXX-1234', '/encrypted/uploads/user1_aadhaar.jpg', 'pending');

-- Sample audit log entry
-- INSERT INTO verification_audit_log (verification_id, admin_id, action, ip_address)
-- VALUES (1, 2, 'viewed_document', '192.168.1.1');

-- ==========================================
-- NOTES FOR FUTURE API INTEGRATION
-- ==========================================
-- When integrating DigiLocker or Aadhaar e-KYC:
-- 1. Add column: external_verification_id TEXT (stores API transaction ID)
-- 2. Add column: api_response TEXT (stores full API response JSON)
-- 3. Update metadata field with API-specific data
-- 4. Set status = 'approved' automatically on successful API verification
-- 5. Still log everything in audit_log for compliance
