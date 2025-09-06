# Render Deployment Testing Guide

## 🚀 Test Your Backend on Render

This guide helps you verify that all your APIs are working correctly on the deployed Render server.

### Step 1: Update Test Configuration

1. Open `render-test.js`
2. Update these URLs with your actual Render URLs:

```javascript
// UPDATE THESE WITH YOUR ACTUAL RENDER URLS
const BASE_URL = 'https://your-app-name.onrender.com/api';
const WS_URL = 'wss://your-app-name.onrender.com';
const HEALTH_URL = 'https://your-app-name.onrender.com/health';
```

**How to find your Render URL:**
- Go to your Render dashboard
- Click on your deployed service
- Copy the URL (it looks like: `https://your-app-name.onrender.com`)

### Step 2: Run Basic Tests (No Authentication)

```bash
# Install testing dependencies (if not already installed)
npm install

# Run the test suite
npm run test:render
```

OR directly:

```bash
node render-test.js
```

### Step 3: Get Firebase Token for Full Testing

To test protected endpoints (user profile, messages, etc.), you need a Firebase ID token:

1. **In your Flutter app**, after a user logs in:
```dart
final token = await FirebaseAuth.instance.currentUser?.getIdToken();
print('Firebase Token: $token');
```

2. **Copy the token** and update `render-test.js`:
```javascript
const FIREBASE_TOKEN = 'your-actual-firebase-token-here';
```

3. **Run tests again** for complete coverage:
```bash
npm run test:render
```

### What the Tests Check

#### ✅ Critical Tests (Must Pass)
- **Server Health**: Is your server running?
- **Database Connection**: Can it connect to MongoDB Atlas?
- **Public APIs**: Are basic endpoints working?
- **Authentication**: Is Firebase auth properly configured?

#### 🔧 Additional Tests
- **Protected Endpoints**: User profile, messages, notifications
- **File Upload**: Image/file upload functionality
- **WebSocket**: Real-time messaging capability
- **Security**: CORS, rate limiting, error handling

### Test Results Interpretation

#### 🎉 All Tests Pass
Your backend is **production-ready**! You can:
- Connect your Flutter app
- Start using all features
- Deploy to app stores

#### ⚠️ Some Tests Fail
Common issues and solutions:

**Database Connection Failed:**
```
Check your MongoDB Atlas:
• Connection string in Render environment variables
• Network access allows all IPs (0.0.0.0/0)
• Database user has correct permissions
```

**Authentication Failed:**
```
Check Firebase configuration:
• Firebase private key in environment variables
• Service account JSON format is correct
• Firebase project settings match your app
```

**File Upload Failed:**
```
Check file upload system:
• Multer configuration is working
• File permissions are correct
• Storage directory exists
```

### Environment Variables Checklist

Make sure these are set in your Render dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
NODE_ENV=production
PORT=3000
```

### Quick Commands

```bash
# Test just the health endpoint
curl https://your-app-name.onrender.com/health

# Test API documentation
curl https://your-app-name.onrender.com/api-docs

# Test public communities endpoint
curl https://your-app-name.onrender.com/api/communities
```

### Flutter Integration URLs

Once tests pass, use these URLs in your Flutter app:

```dart
class ApiConfig {
  static const String baseUrl = 'https://your-app-name.onrender.com/api';
  static const String websocketUrl = 'wss://your-app-name.onrender.com';
}
```

### Troubleshooting

#### Server Not Responding
1. Check Render logs in dashboard
2. Verify app is deployed and running
3. Check for startup errors

#### Database Errors
1. Test MongoDB connection string locally
2. Verify Atlas network access settings
3. Check database user permissions

#### Firebase Auth Issues
1. Verify service account JSON format
2. Check Firebase project configuration
3. Ensure private key format is correct

### Support

If tests fail, check:
1. **Render Logs**: Go to your Render dashboard → Service → Logs
2. **Environment Variables**: Ensure all required vars are set
3. **Network**: Check if your service is accessible publicly

The test file provides detailed error messages and recommendations for fixing any issues found.

---

**Note**: The first time your Render app starts, it might take 30-60 seconds to become fully available. If health checks fail initially, wait a minute and try again.
