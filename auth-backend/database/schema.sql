-- Properties Table Schema for Neon PostgreSQL
-- This creates the main properties table with all necessary fields

CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL,
    listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('sell', 'rent')),
    bhk VARCHAR(20),
    bathrooms INTEGER DEFAULT 1,
    sqft INTEGER,
    furnishing VARCHAR(50),
    price BIGINT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    city VARCHAR(100),
    area VARCHAR(100),
    pincode VARCHAR(10),
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    year_built INTEGER,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'in_progress', 'under_review')),
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'rented')),
    owner_id VARCHAR(50),
    owner_name VARCHAR(255),
    owner_phone VARCHAR(20),
    owner_email VARCHAR(255),
    owner_verified BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_area ON properties(area);
CREATE INDEX IF NOT EXISTS idx_verification ON properties(verification_status);
CREATE INDEX IF NOT EXISTS idx_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price ON properties(price);

-- Update trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
