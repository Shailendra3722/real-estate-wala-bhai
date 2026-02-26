-- ==========================================
-- REAL ESTATE APP - DATABASE SCHEMA
-- ==========================================
-- Simple, production-ready schema
-- PostgreSQL recommended (has built-in geo support)
-- Also works with MySQL 8.0+ with minor changes

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE users (
    -- Primary Key
    id VARCHAR(50) PRIMARY KEY,
    
    -- Basic Info
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    
    -- Role: 'buyer' or 'agent'
    role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'agent', 'admin')),
    
    -- Profile
    avatar_url TEXT,
    bio TEXT,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_verified ON users(is_verified);

-- ==========================================
-- 2. PROPERTIES TABLE
-- ==========================================
CREATE TABLE properties (
    -- Primary Key
    id VARCHAR(50) PRIMARY KEY,
    
    -- Ownership
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Info
    title VARCHAR(200) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('flat', 'house', 'villa', 'plot', 'commercial')),
    listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('sell', 'rent')),
    
    -- Specs
    bhk VARCHAR(20), -- '1 BHK', '2 BHK', etc.
    bathrooms INTEGER,
    sqft INTEGER NOT NULL,
    furnishing VARCHAR(50) CHECK (furnishing IN ('unfurnished', 'semi-furnished', 'fully-furnished')),
    
    -- Pricing
    price BIGINT NOT NULL, -- In rupees
    
    -- Location (coordinates for map)
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    
    -- Features
    amenities TEXT[], -- Array of amenities
    year_built INTEGER,
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'under_review')),
    verified_at TIMESTAMP,
    verified_by VARCHAR(50) REFERENCES users(id),
    
    -- Media
    images TEXT[], -- Array of image URLs
    video_url TEXT,
    
    -- Featured
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'sold', 'rented', 'inactive')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_listing ON properties(listing_type);
CREATE INDEX idx_properties_status ON properties(status);

-- IMPORTANT: Geo-spatial index for map queries
-- PostgreSQL version (recommended)
CREATE INDEX idx_properties_location ON properties USING GIST (
    ll_to_earth(latitude, longitude)
);

-- If using MySQL 8.0+, use this instead:
-- CREATE SPATIAL INDEX idx_properties_location ON properties(latitude, longitude);

-- ==========================================
-- 3. FAVORITES TABLE
-- ==========================================
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure user can't favorite same property twice
    UNIQUE(user_id, property_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);

-- ==========================================
-- 4. CONTACTS / INQUIRIES TABLE
-- ==========================================
CREATE TABLE inquiries (
    id SERIAL PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    buyer_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50) NOT NULL REFERENCES users(id),
    
    -- Message
    message TEXT,
    
    -- Contact method
    contact_method VARCHAR(20) CHECK (contact_method IN ('call', 'whatsapp', 'email')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'new' 
        CHECK (status IN ('new', 'contacted', 'interested', 'not-interested', 'closed')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    
    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_inquiries_property ON inquiries(property_id);
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_agent ON inquiries(agent_id);
CREATE INDEX idx_inquiries_created ON inquiries(created_at);

-- ==========================================
-- 5. SESSIONS TABLE (for auth)
-- ==========================================
CREATE TABLE sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ==========================================
-- HELPER VIEWS
-- ==========================================

-- View: Active properties with owner info
CREATE VIEW v_active_properties AS
SELECT 
    p.*,
    u.name as owner_name,
    u.phone as owner_phone,
    u.email as owner_email,
    u.is_verified as owner_verified,
    (SELECT COUNT(*) FROM favorites WHERE property_id = p.id) as favorite_count
FROM properties p
JOIN users u ON p.owner_id = u.id
WHERE p.status = 'active' AND u.is_active = TRUE;

-- View: User property stats
CREATE VIEW v_user_property_stats AS
SELECT 
    u.id as user_id,
    u.name,
    u.role,
    COUNT(p.id) as total_properties,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_properties,
    COUNT(CASE WHEN p.verification_status = 'verified' THEN 1 END) as verified_properties,
    SUM(p.view_count) as total_views,
    SUM(p.contact_count) as total_contacts
FROM users u
LEFT JOIN properties p ON u.id = p.owner_id
WHERE u.role = 'agent'
GROUP BY u.id, u.name, u.role;

-- ==========================================
-- TRIGGERS (Auto-update timestamps)
-- ==========================================

-- PostgreSQL version
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Sample Users
INSERT INTO users (id, name, email, phone, password_hash, role, is_verified) VALUES
('user_001', 'Rajesh Kumar', 'rajesh@example.com', '+919876543210', '$2b$10$hashedpassword1', 'agent', TRUE),
('user_002', 'Priya Sharma', 'priya@example.com', '+919876543211', '$2b$10$hashedpassword2', 'buyer', TRUE),
('user_003', 'Amit Singh', 'amit@example.com', '+919876543212', '$2b$10$hashedpassword3', 'agent', TRUE);

-- Sample Properties
INSERT INTO properties (
    id, owner_id, title, description, property_type, listing_type,
    bhk, bathrooms, sqft, furnishing, price,
    latitude, longitude, address, city, area, pincode,
    amenities, year_built, verification_status, images, is_featured, status
) VALUES
(
    'prop_001',
    'user_001',
    '3 BHK Flat in Gomti Nagar',
    'Spacious 3 BHK apartment with modern amenities',
    'flat',
    'sell',
    '3 BHK',
    2,
    1450,
    'semi-furnished',
    8500000,
    26.8467,
    80.9462,
    'Sector 12, Gomti Nagar Extension, Lucknow',
    'Lucknow',
    'Gomti Nagar',
    '226010',
    ARRAY['Parking', 'Lift', 'Security', 'Park', 'Gym'],
    2020,
    'verified',
    ARRAY['/images/prop_001_1.jpg', '/images/prop_001_2.jpg'],
    TRUE,
    'active'
),
(
    'prop_002',
    'user_001',
    '2 BHK Apartment in Alambagh',
    'Affordable 2 BHK near city center',
    'flat',
    'sell',
    '2 BHK',
    2,
    980,
    'unfurnished',
    4500000,
    26.8205,
    80.8869,
    'Kanpur Road, Alambagh, Lucknow',
    'Lucknow',
    'Alambagh',
    '226005',
    ARRAY['Parking', 'Lift', 'Security'],
    2018,
    'verified',
    ARRAY['/images/prop_002_1.jpg'],
    FALSE,
    'active'
);

-- ==========================================
-- USEFUL QUERIES
-- ==========================================

-- Find properties near a location (within 5km radius)
-- PostgreSQL version using earth_distance
/*
SELECT *,
    earth_distance(
        ll_to_earth(26.8467, 80.9462),
        ll_to_earth(latitude, longitude)
    ) / 1000 AS distance_km
FROM properties
WHERE earth_box(ll_to_earth(26.8467, 80.9462), 5000) @> ll_to_earth(latitude, longitude)
ORDER BY distance_km
LIMIT 10;
*/

-- Search properties with filters
/*
SELECT * FROM v_active_properties
WHERE city = 'Lucknow'
  AND listing_type = 'sell'
  AND price BETWEEN 3000000 AND 10000000
  AND bhk = '3 BHK'
  AND verification_status = 'verified'
ORDER BY created_at DESC;
*/

-- Get user's favorite properties
/*
SELECT p.*, f.created_at as favorited_at
FROM favorites f
JOIN properties p ON f.property_id = p.id
WHERE f.user_id = 'user_002'
ORDER BY f.created_at DESC;
*/

-- Get property with owner details
/*
SELECT 
    p.*,
    u.name as owner_name,
    u.phone as owner_phone,
    u.is_verified as owner_verified
FROM properties p
JOIN users u ON p.owner_id = u.id
WHERE p.id = 'prop_001';
*/
