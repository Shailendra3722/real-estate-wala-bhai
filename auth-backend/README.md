# Real Estate Wala Bhai - Firebase Auth Backend

Production-ready Firebase Authentication backend with OTP support for phone and email login.

## 🔥 Features

- ✅ **Phone OTP Authentication** via Firebase
- ✅ **Email OTP Authentication** (optional)
- ✅ **Device Tracking** - Track user devices and sessions
- ✅ **Secure Token Validation** - Firebase Admin SDK verification
- ✅ **User Management** - CRUD operations for users
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **CORS Protection** - Secure cross-origin requests
- ✅ **Role-Based Access** - Admin and user roles

---

## 📋 Prerequisites

1. **Node.js** 18+ installed
2. **Firebase Project** created
3. **Firebase Authentication** enabled (Phone & Email Sign-in)
4. **Firestore Database** created
5. **Service Account Key** downloaded

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd auth-backend
npm install
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication → Sign-in Methods:
   - **Phone** ✓
   - **Email/Password** ✓ (optional)
4. Enable Firestore Database
5. Go to Project Settings → Service Accounts
6. Click **Generate New Private Key**
7. Download JSON file

#### Configure Environment

Create `.env` file in `auth-backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

JWT_SECRET=your-super-secret-jwt-key
```

> **⚠️ IMPORTANT:** Never commit `.env` to Git!

### 3. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start at `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "idToken": "firebase_id_token_from_frontend"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "uid": "user123",
    "phone": "+919876543210",
    "email": null,
    "displayName": null,
    "role": "user",
    "lastLogin": "2026-02-08T15:00:00.000Z"
  },
  "token": "firebase_id_token"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <firebase_id_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <firebase_id_token>
```

#### Get User Devices
```http
GET /api/auth/devices
Authorization: Bearer <firebase_id_token>
```

### User Management

#### Get User by ID
```http
GET /api/user/:id
Authorization: Bearer <firebase_id_token>
```

#### Update User Profile
```http
PATCH /api/user/:id
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "displayName": "John Doe",
  "email": "john@example.com"
}
```

#### Get All Users (Admin Only)
```http
GET /api/user?limit=50&orderBy=createdAt&order=desc
Authorization: Bearer <firebase_id_token>
```

---

## 🔐 Security Features

### Token Verification
- All protected routes verify Firebase ID tokens
- Tokens are validated using Firebase Admin SDK
- Expired tokens are automatically rejected

### Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents brute force attacks

### CORS Protection
- Only configured frontend URLs can access API
- Credentials support enabled

### Input Validation
- Phone numbers validated (E.164 format: `+919876543210`)
- Email validation
- Request body sanitization

---

## 📊 Firestore Data Models

### Users Collection
```
users/{uid}
{
  uid: string,
  phone: string,
  email: string | null,
  displayName: string | null,
  role: "user" | "admin",
  isActive: boolean,
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

### Devices Subcollection
```
users/{uid}/devices/{deviceId}
{
  browser: string,
  os: string,
  device: string,
  ip: string,
  firstUsed: Timestamp,
  lastUsed: Timestamp
}
```

---

## 🖥️ Frontend Integration

### 1. Install Firebase SDK

```bash
npm install firebase
```

### 2. Initialize Firebase (Frontend)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

### 3. Phone OTP Flow

```javascript
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Setup reCAPTCHA
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
  size: 'invisible'
});

// Send OTP
const phoneNumber = '+919876543210';
const appVerifier = window.recaptchaVerifier;

signInWithPhoneNumber(auth, phoneNumber, appVerifier)
  .then((confirmationResult) => {
    // OTP sent!
    const verificationCode = prompt('Enter OTP:');
    return confirmationResult.confirm(verificationCode);
  })
  .then((userCredential) => {
    // Get Firebase ID token
    return userCredential.user.getIdToken();
  })
  .then((idToken) => {
    // Send to backend
    return fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
  })
  .then(res => res.json())
  .then(data => {
    console.log('Logged in:', data.user);
    // Store token for future requests
    localStorage.setItem('authToken', data.token);
  });
```

### 4. Protected API Calls

```javascript
const token = localStorage.getItem('authToken');

fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('User:', data.user));
```

---

## 🚀 Deployment

### Option 1: Vercel Serverless
Deploy as serverless functions in Next.js API routes

### Option 2: Render / Railway
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Add environment variables
4. Deploy

### Option 3: Google Cloud Run
```bash
gcloud run deploy auth-server --source .
```

---

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

### Test OTP Flow
1. Use Firebase Console to test phone authentication
2. Get ID token from frontend
3. Send to `/api/auth/verify-otp`
4. Check Firestore for created user

---

## 📁 Project Structure

```
auth-backend/
├── auth-server.js           # Main Express server
├── package.json             # Dependencies
├── .env.example             # Environment template
├── config/
│   └── firebase.js          # Firebase Admin SDK initialization
├── middleware/
│   ├── auth.js              # Token verification
│   └── validation.js        # Input validation
├── routes/
│   ├── auth.js              # Auth endpoints
│   └── user.js              # User endpoints
└── services/
    └── authService.js       # Auth business logic
```

---

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | `my-project-123` |
| `FIREBASE_PRIVATE_KEY` | Service account private key | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk@...` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://myapp.vercel.app` |
| `JWT_SECRET` | Secret for custom tokens | Random string |

---

## ❓ Troubleshooting

### Error: "Firebase initialization error"
- Check `.env` file exists
- Verify Firebase credentials are correct
- Ensure private key has `\n` replaced with actual newlines

### Error: "CORS policy"
- Add frontend URL to `FRONTEND_URL` in `.env`
- Check CORS middleware in `auth-server.js`

### Error: "Invalid token"
- Token might be expired (valid for 1 hour)
- Request new OTP and get new token

---

## 📝 License

MIT

---

## 🤝 Support

For issues or questions, create an issue on GitHub.
