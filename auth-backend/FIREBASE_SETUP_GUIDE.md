# How to Create Firebase Project - Complete Guide

## 🔥 Step-by-Step Firebase Setup

### Step 1: Go to Firebase Console

1. Open your browser
2. Go to: **https://console.firebase.google.com/**
3. Sign in with your Google account

---

### Step 2: Create New Project

1. Click the **"Add project"** or **"Create a project"** button
2. You'll see a wizard with 3 steps

**Step 2a: Project Name**
- Enter project name: `Real Estate Wala Bhai` (or any name you like)
- A project ID will be auto-generated (e.g., `real-estate-wala-bhai-12345`)
- Click **Continue**

**Step 2b: Google Analytics (Optional)**
- Toggle **OFF** if you don't need analytics for now
- Or keep it **ON** if you want user analytics
- Click **Continue** (or **Create project** if analytics is off)

**Step 2c: Wait for Setup**
- Firebase will create your project (takes ~30 seconds)
- Click **Continue** when done

---

### Step 3: Enable Phone Authentication

1. In the left sidebar, click **🔐 Authentication**
2. Click **"Get started"** button
3. Go to **"Sign-in method"** tab (top)
4. Find **"Phone"** in the list
5. Click on it
6. Toggle the switch to **Enabled** ✅
7. Click **Save**

**Important for Phone Auth:**
- You'll need to add your app's domain later
- For testing, Firebase provides a test phone number option

---

### Step 4: Enable Email Authentication (Optional)

1. Still in **Sign-in method** tab
2. Find **"Email/Password"**
3. Click on it
4. Enable **Email/Password** ✅
5. You can also enable **Email link (passwordless sign-in)** if you want OTP via email
6. Click **Save**

---

### Step 5: Create Firestore Database

1. In the left sidebar, click **🗄️ Firestore Database**
2. Click **"Create database"** button
3. Choose mode:
   - Select **"Start in production mode"** (we'll set rules later)
   - Click **Next**
4. Choose location:
   - Select **"asia-south1 (Mumbai)"** for India
   - Or choose the location closest to you
   - Click **Enable**
5. Wait for database creation (~30 seconds)

---

### Step 6: Get Service Account Key (IMPORTANT!)

1. Click the **⚙️ Settings** icon (top left, next to "Project Overview")
2. Click **"Project settings"**
3. Go to **"Service accounts"** tab (top)
4. You'll see: "Firebase Admin SDK"
5. Click **"Generate new private key"** button
6. A popup will warn you about keeping it secure
7. Click **"Generate key"**
8. A JSON file will download to your computer (e.g., `real-estate-wala-bhai-firebase-adminsdk-xxxxx.json`)

**⚠️ CRITICAL: Keep this file SECURE!**
- This file gives full access to your Firebase project
- Never commit it to Git
- Never share it publicly

---

### Step 7: Get Web API Key (For Frontend)

1. Still in **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **</>** icon (Web app)
4. Give your app a nickname: "Real Estate Web App"
5. Check **"Also set up Firebase Hosting"** if you want (optional)
6. Click **"Register app"**
7. You'll see your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "real-estate-xxxxx.firebaseapp.com",
  projectId: "real-estate-xxxxx",
  storageBucket: "real-estate-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

8. **Copy this somewhere safe** - you'll need it for frontend
9. Click **"Continue to console"**

---

## ✏️ Configure Your Backend

Now that you have the Firebase project and downloaded the service account key, configure your backend:

### Step 8: Open the Downloaded JSON File

Open the downloaded JSON file (e.g., `real-estate-wala-bhai-firebase-adminsdk-xxxxx.json`) in a text editor.

You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "real-estate-wala-bhai-xxxxx",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqh...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@real-estate-xxxxx.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

### Step 9: Update .env File

1. Navigate to your `auth-backend` folder
2. Copy the example environment file:
   ```bash
   cd auth-backend
   cp .env.example .env
   ```

3. Open `.env` in a text editor
4. Fill in the values from your downloaded JSON file:

```env
# Copy from JSON: "project_id"
FIREBASE_PROJECT_ID=real-estate-wala-bhai-xxxxx

# Copy from JSON: "private_key" (INCLUDING the quotes and \n characters!)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqh...\n-----END PRIVATE KEY-----\n"

# Copy from JSON: "client_email"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@real-estate-xxxxx.iam.gserviceaccount.com

# Server settings
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Generate a random secret (any long random string)
JWT_SECRET=randomly-generated-secret-key-change-this-123456
```

**IMPORTANT for FIREBASE_PRIVATE_KEY:**
- Keep the quotes around the entire key: `"-----BEGIN..."`
- Keep the `\n` characters (they represent newlines)
- Don't modify the key at all - copy it exactly as shown in the JSON

---

## 🚀 Start Your Backend

### Step 10: Fix npm Permissions (if needed)

```bash
sudo chown -R 501:20 ~/.npm
```

Or use your own user ID:
```bash
sudo chown -R $(whoami) ~/.npm
```

### Step 11: Install Dependencies

```bash
cd auth-backend
npm install
```

This will install:
- firebase-admin
- express
- cors, helmet, morgan
- express-rate-limit
- express-validator
- ua-parser-js

### Step 12: Start the Server

```bash
npm run dev
```

You should see:

```
✅ Firebase Admin SDK initialized successfully
🔥 ========================================
🚀 Firebase Auth Server Running
📡 Port: 5000
🌍 Environment: development
🔥 ========================================
```

### Step 13: Test It!

Open browser: **http://localhost:5000**

You should see:

```json
{
  "success": true,
  "message": "Real Estate Auth API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

---

## ✅ Success Checklist

- [ ] Firebase project created
- [ ] Phone authentication enabled ✅
- [ ] Firestore database created ✅
- [ ] Service account key downloaded (JSON file)
- [ ] Web API key copied
- [ ] `.env` file configured with credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors
- [ ] http://localhost:5000 shows API info

---

## 🐛 Troubleshooting

### "Firebase initialization error"
- Check that `.env` file exists in `auth-backend` folder
- Verify `FIREBASE_PRIVATE_KEY` is copied correctly (with quotes and `\n`)
- Make sure all three Firebase variables are filled in

### "npm install" fails with EPERM
```bash
sudo chown -R $(whoami) ~/.npm
cd auth-backend
npm install
```

### "Port 5000 already in use"
Change the port in `.env`:
```env
PORT=5001
```

---

## 📱 Next: Frontend Integration

Once your backend is running, you'll integrate it with your Next.js frontend. The steps are:

1. Install Firebase SDK in frontend: `npm install firebase`
2. Create `lib/firebase.js` with the web config you copied
3. Implement phone OTP UI
4. Call your backend API endpoints

---

**You're all set!** 🎉

Your Firebase backend is now ready to handle phone OTP authentication!
