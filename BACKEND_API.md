# Real Estate Backend API Documentation

## Overview

This document describes the REST API endpoints for the Real Estate Wala Bhai application.

**Base URL (Development):** `http://localhost:3000`  
**Base URL (Production):** Your deployed server URL

---

## Endpoints

### 1. Get All Properties

Get a paginated list of all active properties.

**Endpoint:** `GET /api/properties`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Example Request:**
```bash
curl http://localhost:3000/api/properties?page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 8,
  "count": 8,
  "properties": [ /* array of property objects */ ]
}
```

---

### 2. Get Property by ID

Fetch detailed information about a single property.

**Endpoint:** `GET /api/properties/:id`

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Property ID (e.g., "prop_001") |

**Example Request:**
```bash
curl http://localhost:3000/api/properties/prop_001
```

**Success Response (200):**
```json
{
  "success": true,
  "property": {
    "id": "prop_001",
    "title": "3 BHK Flat in Gomti Nagar",
    "description": "Spacious 3 BHK apartment...",
    "propertyType": "flat",
    "listingType": "sell",
    "bhk": "3 BHK",
    "bathrooms": 2,
    "sqft": 1450,
    "furnishing": "semi-furnished",
    "price": 8500000,
    "priceFormatted": "₹85.00 Lakh",
    "location": {
      "latitude": 26.8467,
      "longitude": 80.9462,
      "address": "Sector 12, Gomti Nagar Extension, Lucknow",
      "city": "Lucknow",
      "area": "Gomti Nagar",
      "pincode": "226010"
    },
    "amenities": ["Parking", "Lift", "Security", "Park", "Gym"],
    "yearBuilt": 2020,
    "images": ["/images/prop_001_1.jpg", ...],
    "verificationStatus": "verified",
    "isVerified": true,
    "owner": {
      "id": "user_001",
      "name": "Rajesh Kumar",
      "phone": "+919876543210",
      "email": "rajesh@example.com",
      "isVerified": true
    },
    "viewCount": 142,
    "contactCount": 8,
    "status": "active",
    "isFeatured": true,
    "createdAt": "2026-01-15T00:00:00.000Z",
    "updatedAt": "2026-02-06T14:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": "Property not found",
  "propertyId": "prop_999"
}
```

---

### 3. Get Nearby Properties (Map Query)

Find properties within a specified radius of coordinates.

**Endpoint:** `GET /api/properties/nearby`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lng` | number | Yes | Longitude |
| `radius` | number | No | Radius in kilometers (default: 5, max: 100) |
| `listingType` | string | No | Filter by 'sell' or 'rent' |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |

**Example Request:**
```bash
curl "http://localhost:3000/api/properties/nearby?lat=26.8467&lng=80.9462&radius=5"
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 6,
  "radius": 5,
  "center": {
    "latitude": 26.8467,
    "longitude": 80.9462
  },
  "properties": [
    {
      "id": "prop_001",
      "title": "3 BHK Flat in Gomti Nagar",
      "distanceKm": "0.50",
      "distanceFormatted": "0.5 km away",
      /* ... other property fields ... */
    }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "Missing coordinates",
  "message": "lat and lng are required"
}
```

---

### 4. Search Properties (Advanced Filters)

Search properties with multiple filters.

**Endpoint:** `POST /api/properties/search`

**Request Body:**
```json
{
  "city": "Lucknow",
  "listingType": "sell",
  "minPrice": 3000000,
  "maxPrice": 10000000,
  "bhk": "3 BHK",
  "propertyType": "flat",
  "verifiedOnly": true
}
```

All fields are optional.

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/properties/search \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Lucknow",
    "listingType": "sell",
    "minPrice": 5000000,
    "maxPrice": 15000000
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 4,
  "filters": {
    "city": "Lucknow",
    "listingType": "sell",
    "minPrice": 5000000,
    "maxPrice": 15000000
  },
  "properties": [ /* filtered properties */ ]
}
```

---

### 5. Submit Contact Form

Submit an inquiry/contact request for a property.

**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "propertyId": "prop_001",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "message": "Interested in viewing this property",
  "contactMethod": "whatsapp"
}
```

**Field Validations:**
| Field | Required | Type | Options |
|-------|----------|------|---------|
| `propertyId` | Yes | string | Valid property ID |
| `name` | Yes | string | Buyer's name |
| `phone` | Yes | string | Contact number |
| `email` | No | string | Email address |
| `message` | No | string | Inquiry message |
| `contactMethod` | No | string | 'call', 'whatsapp', or 'email' |

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop_001",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "message": "I would like to schedule a viewing",
    "contactMethod": "whatsapp"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact request submitted successfully",
  "inquiryId": 42,
  "contactInfo": {
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields",
  "message": "name and phone are required"
}
```

**Error Response (404):**
```json
{
  "error": "Property not found",
  "propertyId": "prop_999"
}
```

---

## Frontend Integration

### Setup

1. Include the API configuration file in your HTML:

```html
<script src="api-config.js"></script>
<script src="properties-data-api.js"></script>
```

2. The API will automatically detect if running locally or in production.

### Usage Examples

#### Fetch Properties on Map

```javascript
// In map-explore.html
async function loadNearbyProperties(lat, lng) {
  const properties = await PropertiesData.getPropertiesNearby(lat, lng, 5);
  properties.forEach(property => {
    addPropertyMarker(property);
  });
}
```

#### Load Property Details

```javascript
// In property-detail.html
async function loadPropertyDetails(propertyId) {
  const property = await PropertiesData.getPropertyById(propertyId);
  if (property) {
    displayPropertyInfo(property);
  }
}
```

#### Submit Contact Form

```javascript
// In property-detail.html
async function submitContactForm(event) {
  event.preventDefault();
  
  const formData = {
    propertyId: currentPropertyId,
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value,
    contactMethod: 'whatsapp'
  };
  
  const result = await PropertiesData.submitContactForm(formData);
  
  if (result.success) {
    alert('✅ Contact request sent successfully!');
  } else {
    alert('❌ Error: ' + result.error);
  }
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Resource Not Found |
| 500 | Internal Server Error |

---

## Development Setup

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database:**
   ```bash
   # Create database
   createdb real_estate_db
   
   # Run schema
   psql -d real_estate_db -f database_schema.sql
   
   # Seed data
   node seed-database.js
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:3000`

5. **Test API:**
   ```bash
   curl http://localhost:3000/api/properties
   ```

---

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
NODE_ENV=production
PORT=3000
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=real_estate_db
DB_PASSWORD=your_secure_password
DB_PORT=5432
```

### CORS Configuration

The API has CORS enabled by default. Update `api-server.js` if you need to restrict origins:

```javascript
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

---

## Performance Considerations

1. **Caching:** Frontend caches API responses for 5 minutes
2. **Pagination:** Default limit is 20 items per page
3. **Database Indexes:** All location queries use spatial indexes
4. **Connection Pooling:** Max 20 concurrent database connections

---

## Security Notes

1. **Input Validation:** All endpoints validate input parameters
2. **SQL Injection:** Uses parameterized queries
3. **Rate Limiting:** Consider adding rate limiting in production
4. **Authentication:** Currently open, add JWT auth for user-specific actions

---

## Support

For issues or questions:
- Check the implementation plan in `implementation_plan.md`
- Review the database schema in `database_schema.sql`
- Examine API server code in `api-server.js`
