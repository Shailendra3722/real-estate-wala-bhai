# Firebase Authentication Backend - Quick Setup Guide

## 🚀 Installation Steps

### 1. Fix npm Permissions (If Needed)
```bash
sudo chown -R 501:20 "/Users/shailendrasingh/.npm"
```

### 2. Install Dependencies
```bash
cd auth-backend
npm install
```

### 3. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Name: "Real Estate Wala Bhai Auth"
4. Disable Google Analytics (optional)
5. Create Project

### 4. Enable Authentication

1. In Firebase Console → Authentication
2. Click "Get Started"
3. Enable Sign-in Methods:
   - **Phone** ✅ Click Enable → Save
   - **Email/Password** ✅ (optional)

### 5. Create Firestore Database

1. In Firebase Console → Firestore Database
2. Click "Create Database"
3. Start in **Production Mode**
4. Choose location (asia-south1 for India)

### 6. Get Service Account Credentials

1. Firebase Console → Project Settings (⚙️)
2. Go to "Service Accounts" tab
3. Click "Generate New Private Key"
4. Download JSON file
5. **IMPORTANT:** Keep this file secure!

### 7. Configure Environment Variables

```bash
cd auth-backend
cp .env.example .env
```

Open `.env` and fill in:

```env
# From the downloaded JSON file:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Copy the entire private_key value (including quotes and \n):
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"

# Server settings:
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Generate a random string:
JWT_SECRET=your-super-secret-random-string-here
```

### 8. Start Server

```bash
npm run dev
```

You should see:
```
🔥 ========================================
🚀 Firebase Auth Server Running
📡 Port: 5000
🌍 Environment: development
🔥 ========================================
```

### 9. Test Server

Open browser: http://localhost:5000

You should see API documentation.

---

## 📱 Frontend Integration (Next.js)

### Install Firebase SDK in Frontend

```bash
cd ..  # Back to root project
npm install firebase
```

### Create Firebase Config File

Create `lib/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_WEB_API_KEY", // From Firebase Console
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Get Web API Key

1. Firebase Console → Project Settings
2. Scroll to "Your apps"
3. Click "Web app" icon (</>)
4. Register app
5. Copy `apiKey` from config

---

## 🧪 Testing the API

### Test 1: Health Check

```bash
curl http://localhost:5000/health
```

Expected:
```json
{
  "success": true,
  "message": "Server is running"
}
```

### Test 2: Phone OTP Flow

Use the frontend to:
1. Enter phone number
2. Receive OTP
3. Verify OTP
4. Get ID token
5. Call `/api/auth/verify-otp` with token

---

## ⚠️ Troubleshooting

**npm install fails:**
```bash
sudo chown -R $(whoami) "/Users/shailendrasingh/.npm"
cd auth-backend
npm install
```

**Firebase initialization error:**
- Check `.env` file exists
- Verify credentials from downloaded JSON
- Make sure `FIREBASE_PRIVATE_KEY` includes the quotes and `\n` characters

**CORS error:**
- Update `FRONTEND_URL` in `.env`
- Restart server after changing `.env`

---

## ✅ Success Checklist

- [ ] Firebase project created
- [ ] Phone authentication enabled
- [ ] Firestore database created
- [ ] Service account key downloaded
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors
- [ ] Health endpoint works
- [ ] Frontend can call API

---

Complete README: See `auth-backend/README.md`
