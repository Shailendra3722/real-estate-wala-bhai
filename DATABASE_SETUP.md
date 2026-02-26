# Database Setup - Quick Start

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

---

### Step 2: Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE real_estate_db;

# Connect to it
\c real_estate_db

# Enable geo extensions (CRITICAL for map queries)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

# Exit
\q
```

---

### Step 3: Run Schema

```bash
cd "/Users/shailendrasingh/Developer/REAL ESTATE WALA BHAI "

# Import schema
psql -U postgres -d real_estate_db -f database_schema.sql
```

**Expected output:**
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
...
INSERT 0 3  (sample users)
INSERT 0 2  (sample properties)
```

---

### Step 4: Verify Installation

```bash
# Login again
psql -U postgres -d real_estate_db

# Check tables
\dt

# Should show:
# users, properties, favorites, inquiries, sessions

# Test query
SELECT id, title, city FROM properties;

# Should show 2 sample properties
```

---

## 📦 Node.js Integration

### Step 1: Install Dependencies

```bash
npm install pg dotenv bcrypt
```

### Step 2: Create .env File

```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=real_estate_db
DB_PASSWORD=your_password
DB_PORT=5432
```

### Step 3: Test Connection

Create `test-db.js`:
```javascript
const db = require('./database-service');

async function testConnection() {
    try {
        // Test connection
        const result = await db.query('SELECT NOW()');
        console.log('✅ Database connected!');
        console.log('Server time:', result.rows[0].now);
        
        // Get all properties
        const properties = await db.getAllProperties();
        console.log(`✅ Found ${properties.length} properties`);
        
        // Find nearby (Lucknow coordinates)
        const nearby = await db.findPropertiesNearby(26.8467, 80.9462, 5);
        console.log(`✅ Found ${nearby.length} properties within 5km`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testConnection();
```

Run it:
```bash
node test-db.js
```

**Expected output:**
```
✅ Database connected!
Server time: 2026-02-04T10:09:57.123Z
✅ Found 2 properties
✅ Found 2 properties within 5km
```

---

## 🗺️ Testing Map Queries

### Test 1: Find Properties Nearby

```javascript
const db = require('./database-service');

async function testMapQuery() {
    // User location: Lucknow center
    const userLat = 26.8467;
    const userLng = 80.9462;
    
    // Find within 5km
    const results = await db.findPropertiesNearby(userLat, userLng, 5);
    
    results.forEach(prop => {
        console.log(`📍 ${prop.title}`);
        console.log(`   Distance: ${prop.distance_km.toFixed(2)} km`);
        console.log(`   Price: ₹${prop.price.toLocaleString('en-IN')}`);
        console.log('');
    });
}

testMapQuery();
```

### Test 2: Search with Filters

```javascript
async function testFilters() {
    const results = await db.searchProperties({
        city: 'Lucknow',
        listingType: 'sell',
        minPrice: 3000000,
        maxPrice: 10000000,
        bhk: '3 BHK',
        verifiedOnly: true
    });
    
    console.log(`Found ${results.length} matching properties`);
}
```

---

## 🎯 Common Queries

### Get Property Detail
```sql
SELECT * FROM properties WHERE id = 'prop_001';
```

### Get User's Favorites
```sql
SELECT p.* 
FROM favorites f
JOIN properties p ON f.property_id = p.id
WHERE f.user_id = 'user_002';
```

### Get Agent's Inquiries
```sql
SELECT i.*, p.title, u.name as buyer_name
FROM inquiries i
JOIN properties p ON i.property_id = p.id
JOIN users u ON i.buyer_id = u.id
WHERE i.agent_id = 'user_001'
ORDER BY i.created_at DESC;
```

---

## 🔧 Troubleshooting

### Error: "extension cube does not exist"
```sql
-- Run as postgres superuser
psql -U postgres -d real_estate_db
CREATE EXTENSION cube;
CREATE EXTENSION earthdistance;
```

### Error: "connection refused"
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start it
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Linux
```

### Error: "password authentication failed"
```bash
# Reset postgres password
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';

# Update .env file
DB_PASSWORD=new_password
```

---

## 📊 Performance Check

### Check Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Explain Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM properties
WHERE city = 'Lucknow'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎉 You're Ready!

### What You Have Now:
- ✅ PostgreSQL installed and running
- ✅ Database schema created
- ✅ Sample data loaded
- ✅ Geo extensions enabled
- ✅ Node.js service ready
- ✅ Map queries working

### Next Steps:
1. Build your API endpoints (Express.js)
2. Connect frontend to backend
3. Add more sample data
4. Deploy to production

**Your database is production-ready!** 🚀
