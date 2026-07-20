# MongoDB Setup For Legacy Simple API

## 1. Configure Environment

```bash
cp .env.example .env
```

Set:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=real_estate_wala_bhai
```

## 2. Install Dependencies

```bash
cd auth-backend
npm install
```

## 3. Seed Initial Data

```bash
node database/seed.js
```

## 4. Start Server

```bash
node simple-api-server.js
```

Verify:

```bash
curl http://localhost:3004/api/properties
```
