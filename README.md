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
       │  [Model Layer]      --> Fetches from Postgres / JSON arrays │
       +────────────────────────────────────────────────────────+
```

### Flow Example: Search Nearby Listings
1. **Frontend View**: User clicks "Find Nearby" on `map-explore.html`. 
2. **Frontend API Call**: `mapService.js` coordinates with `apiConfig.js` to dispatch a `GET` request to `/api/properties/nearby?lat=26.8467&lng=80.9462&radius=5`.
3. **Backend Routing**: `backend/routes/propertyRoutes.js` routes the request to `PropertyController.getNearby`.
4. **Backend Controller**: `PropertyController` validates coordinates and queries the database model.
5. **Backend Data Model**: `PropertyModel` executes an SQL query utilizing `earthdistance` in PostgreSQL, or delegates to `distanceService.js` (Haversine formula) in **In-Memory Mode**.
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
│   ├── database/                 # Pool configurations & seed migrations
│   │   └── schema/               # Database SQL tables schemas
│   ├── middleware/               # Token verifications & standard headers
│   ├── models/                   # DB interaction abstraction (PostgreSQL / Memory fallback)
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
# Database Credentials (optional - falls back to In-Memory mode if empty)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=real_estate_db
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Authentication
JWT_SECRET=generate_a_secure_token_secret

# Server Configurations
PORT=3000
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
# → Server will start on http://localhost:3000 and fall back to In-Memory JSON mode
```

### 2. Database Mode (PostgreSQL)
For production-quality databases:
1. Ensure **PostgreSQL** is running.
2. Setup the database and schema using the files in `backend/database/schema/`.
3. Add your database credentials to `.env`.
4. Run the database seed script:
```bash
npm run seed
# → Populates PostgreSQL tables with sample users and properties
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment

### Vercel
The repository includes a pre-configured `vercel.json` and is ready for serverless deployments.
Just link your repo to Vercel, populate environment variables, and trigger a build.
