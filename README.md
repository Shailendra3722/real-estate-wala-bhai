# 🏗️ Real Estate Wala Bhai — Full-Stack Refactored Platform

A clean, production-ready, beginner-friendly web application for map-based property search. The architecture leverages **MVC (Model-View-Controller)** principles on the backend, and groups structured styling/clients on the frontend.

---

## 🗺️ Project Architecture & Data Flow

This application is built as a unified repository separating Concerns between a static client and a structured Node.js/Express server.

```
       +────────────────────────────────────────────────────────+
       │                      FRONTEND CLIENT                   │
       │                                                        │
       │  [Leaflet.js Map UI] <--- Bind coordinates & list      │
       +───────────────────────────┬────────────────────────────+
                                   │
                           HTTP API Requests
                           (Axios / Fetch)
                                   │
                                   ▼
       +────────────────────────────────────────────────────────+
       │                      EXPRESS SERVER                    │
       │                                                        │
       │  [Routes Layer]     --> Matches endpoint (/api/nearby) │
       │  [Controller Layer] --> Parses parameters, formats response │
       │  [Service Layer]    --> Calculates spatial geo-distances │
       │  [Model Layer]      --> Fetches from MongoDB / JSON arrays  │
       +────────────────────────────────────────────────────────+
```

### Flow Example: Search Nearby Listings
1. **Frontend View**: User clicks "Find Nearby" on `map-explore.html`. 
2. **Frontend API Call**: `mapService.js` coordinates with `apiConfig.js` to dispatch a `GET` request to `/api/properties/nearby?lat=26.8467&lng=80.9462&radius=5`.
3. **Backend Routing**: `backend/routes/propertyRoutes.js` routes the request to `PropertyController.getNearby`.
4. **Backend Controller**: `PropertyController` validates coordinates and queries the database model.
5. **Backend Data Model**: `PropertyModel` fetches MongoDB records and delegates nearby distance sorting to `distanceService.js` (Haversine formula), or uses the same local logic in **In-Memory Mode**.
6. **Response Delivery**: The formatted list of properties, complete with calculated distances and localized pricing, is returned as JSON to the client to render custom map markers.

---

## 📂 Reorganized Folder Structure

```
real-estate-wala-bhai/
├── frontend/                     # Structured Client Code
│   ├── assets/                   # Site media, icons, and pictures
│   ├── css/                      # Structured stylesheets (Consolidated UX/Forms/Animations)
│   ├── js/                       # Clean JavaScript Modules
│   │   ├── api/                  # API configurations & central request functions
│   │   ├── services/             # Helper wrappers (firebase, maps, alerts)
│   │   └── utils/                # UI helpers (loading, form validation, animations)
│   ├── pages/                    # Reorganized HTML Views (kept flat for relative links)
│   └── index.html                # Main routing redirection page
│
├── backend/                      # Layered Express Server
│   ├── config/                   # Global parameters & Firebase configurations
│   ├── database/                 # MongoDB connection & seed migrations
│   │   └── schema/               # Legacy SQL schema reference
│   ├── middleware/               # Token verifications & standard headers
│   ├── models/                   # DB interaction abstraction (MongoDB / Memory fallback)
│   ├── controllers/              # Express handlers parsing requests & returned payloads
│   ├── routes/                   # Routing configuration mapping URLs to controllers
│   ├── services/                 # Geo-distance & pricing format services
│   └── server.js                 # App startup entry point
│
├── .env.example                  # Environment template config
├── README.md                     # Documentation
├── package.json                  # Dependencies configuration
└── vercel.json                   # Serverless deployment configuration
```

---

## ⚙️ Environment Variables (`.env`)

Copy `.env.example` to `.env` in the root directory:

```env
# MongoDB Credentials (optional - falls back to In-Memory mode if empty)
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=real_estate_wala_bhai

# Authentication
JWT_SECRET=generate_a_secure_token_secret

# Server Configurations
PORT=3004
NODE_ENV=development
```

---

## 🚀 Running Locally

### 1. In-Memory Mode (Zero Database Setup Required)
Perfect for testing out-of-the-box:
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
# → Server will start on http://localhost:3004 and fall back to In-Memory JSON mode
```

### 2. Database Mode (MongoDB Atlas)
For production-quality databases:
1. Create or open your **MongoDB Atlas** cluster.
2. Add `MONGODB_URI` and `MONGODB_DB_NAME` to `.env`.
3. Run the database seed script:
```bash
npm run seed
# → Populates MongoDB collections with sample users and properties
```

Open [http://localhost:3004](http://localhost:3004) in your browser.

---

## 🚀 Deployment

### Vercel
The repository includes a pre-configured `vercel.json` and is ready for serverless deployments.
Just link your repo to Vercel, populate environment variables, and trigger a build.
