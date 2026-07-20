# Database Setup - MongoDB Quick Start

## 1. Configure MongoDB

Create or open a MongoDB Atlas cluster, then add these values to `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=real_estate_wala_bhai
```

The app automatically falls back to local JSON/static data if `MONGODB_URI` is missing or Atlas is unreachable.

## 2. Install Dependencies

```bash
npm install
```

## 3. Seed Sample Data

```bash
npm run seed
```

This creates the `users`, `properties`, `favorites`, and `inquiries` indexes used by the backend and inserts sample users/listings when they are not already present.

## 4. Run The Backend

```bash
npm run dev
```

Verify the API:

```bash
curl http://localhost:3004/health
curl http://localhost:3004/api/properties
```

Expected health database value:

```json
{
  "database": "mongodb_connected"
}
```
