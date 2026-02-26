# Setup Instructions for Neon PostgreSQL

## Steps to Complete Setup

### 1. Create Neon Account & Get Connection String
1. Go to https://neon.tech
2. Sign up (free)
3. Create project: "real-estate-wala-bhai"
4. Copy connection string from dashboard

### 2. Fix npm Permissions (One-time Fix)
```bash
sudo chown -R $(id -u):$(id -g) ~/.npm
```

### 3. Install Dependencies
```bash
cd auth-backend
npm install pg dotenv
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env and paste your Neon connection string
```

### 5. Run Database Schema
Using psql (if installed):
```bash
psql "YOUR_NEON_CONNECTION_STRING" -f database/schema.sql
```

OR using Neon Web Console:
- Go to your Neon project dashboard
- Click "SQL Editor"
- Copy schema.sql contents and run

### 6. Seed Initial Data
```bash
node database/seed.js
```

### 7. Start Server
```bash
node simple-api-server.js
```

## Verify Setup
- Browser: http://localhost:3000/api/properties
- Should see 8 initial properties from database

##Ready!
Your data now persists forever - restart server anytime without losing data!
