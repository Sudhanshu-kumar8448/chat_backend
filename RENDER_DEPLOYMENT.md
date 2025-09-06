# Render Deployment Guide for Community Chat Backend

## 🚀 Deploying to Render

### Prerequisites
- GitHub account
- Render account (free tier available)
- Your code pushed to a GitHub repository

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Ensure your `.gitignore` is properly configured** (already done):
   - `.env` files are ignored
   - `node_modules/` is ignored
   - Firebase service account JSON is ignored

### Step 2: Create Render Service

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the service:**
   - **Name:** `community-chat-backend` (or your preferred name)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for production)

### Step 3: Set Environment Variables

In Render dashboard, go to **Environment** tab and add these variables:

```
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://Sudha:Sudha@cluster0.3ps4dpk.mongodb.net/community-chat
FIREBASE_PROJECT_ID=web-app-4bc28
FIREBASE_PRIVATE_KEY_ID=d1e56f5372da3f5c3d41660165b98f4443aa4fe4
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDnFi8rM+Xfqstv
P2t2d0+PWf396nlL1t0YGZjQliz9dIMELzIDG1FQcPDH50pmzsRYjzD6WmnDjCJd
+D+fwN/taMEZxMg60hT7uvkUcHeYA5U2Cvpa0szs1uu9QIHe2b/tmgTxJyTTRWzn
2O08rHSwnkr0q28XY6z0x83I+4wVcII00N794h1AAwFzzJZ79UI+WwWunykmh9eF
zVlj8+wSpPxvGBlLAihMvaWxfGcPyUeEsXktCbrGScyMj35fHGQnpHditlHHe82M
5hiMov8n1CM0rVbNiW9oau+xphnb8w1jxQVkJEM2326F2wdNKAJvznNUg3VaMcAq
JQHTu7pJAgMBAAECggEADeZulqqP4Z76TvIphoYZe+nZvnnpyyss4C/c+nIIGYRW
Q6yLlXaBkwVCJIIn/mxiUOHnHC4PVdcCc7TUrek6BwOxttk4gppDrxsxc55qwTL4
+RfatJcgwr/QTRFZ5oPiWLpWoQNd4pP237DTn15PxBZ3c4Vy4J0rKIuyuAvSgrEF
Lp2GAm3DcoK6Px8LM63o8F5tQs7WShNWjGe/P8DHBSF/B4tsREn4k4vuaOj/f1so
2DNsXY11JRyg01CML7P2Uu+HPdsnRshInbJlhwQflUqFJB6GN0p3y/D/GwUx+cpa
dFR7sE5C8qLSju3xqZ0EQ9wRLSDPqskH2CMcECcA8QKBgQD2V+SctC+r1Z1Jy6P4
ebXNtxENfBQqar6uATQkimOq4kkpHRccS8Ks6iQGb6zMhwmojQMlaPv/QU9hqa4o
LwjEOUzulXjgCHwKS1yAo6+7hfkQ0I+NElaK98Oj+YAorAUDSIC9wKR0Q2d4++GQ
6jGZ2aIlzjMT5PVeJZVoIF7uOQKBgQDwJS/zSr4h0HiU9u+WXzvuwlgPpEEBnN/X
p2czeEpWafNw3ocyvK+JLwV1Bi+nwkRFe0/3NlWfwNWywPUgf7tOHR/QFJdR+oMm
desmjB4PoRosVWFs2N9TXN5UO8LgheWIYLUaYaEfR6UtTC8tgR+auEshbRX020BR
zfMhtS0skQKBgCgPzyv02bPWP4gayAXGtVxJI0rQHO9xAKWHqJUwtFi8CC3Zf0Ko
x3YbddReIPn6FAYHOLXCxwiR9HjrgVkjnQdcUjiSsl+swY9jBh4dgJy8gu7LHC1T
CCP9eyGVl9QFdaM9DULOq3AE7jTssZhBneNpU0dWq1PW7lhrQEr4yLdxAoGBANTi
EnTZkF1Hgm2DznZ+LBIHRKtxD5OPbrutEgaFn1iligJHspBexjmVboAEIODVjVIO
85+SEiuRdZ+GAIdz1CZ2GQqMBmzM59CDfhbo5YkzZpFgiwJD6w3qaMlBRQtmh0jz
efhODdg92gai37u2GL8+mpOiMXGjn4wlR2BdTRORAoGBAKm1ugbbvI1/XaFSzZPk
QpXcRAsIywyzNeNq8zuxv90/1FoCatMi/LIR5yhxYycKBf5QkLdGR/UfeWSD+KMX
jUXMS+dwY8Vhmg0OTVRQHLEdHGQwHaXHZMflM6j1s1ZCuVakMFZrk2zodvMK+VYA
mtSPXvViU6hr5b0xVwkr1cLE
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@web-app-4bc28.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=114243000819292002408
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

**Important:** Copy the private key exactly as shown, including line breaks.

### Step 4: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Your app will be available at:** `https://your-app-name.onrender.com`

### Step 5: Test Your Deployment

Once deployed, test these endpoints:

1. **Health Check:** `https://your-app-name.onrender.com/health`
2. **API Docs:** `https://your-app-name.onrender.com/api-docs`
3. **Communities:** `https://your-app-name.onrender.com/api/communities`

### Step 6: Update Your Flutter App

Update your Flutter app to use the Render URL:

```dart
// Replace localhost with your Render URL
const String baseUrl = 'https://your-app-name.onrender.com/api';
const String websocketUrl = 'wss://your-app-name.onrender.com';
```

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **Environment Variables:**
   - Make sure all environment variables are set correctly
   - Firebase private key must include proper line breaks

3. **Database Connection:**
   - Verify MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
   - Check that connection string is correct

4. **Firebase Issues:**
   - Ensure Firebase project settings are correct
   - Verify service account has proper permissions

## 📊 Monitoring

- **Render Dashboard:** Monitor logs, metrics, and deployments
- **Health Endpoint:** Regular health checks at `/health`
- **MongoDB Atlas:** Monitor database performance

## 💰 Costs

- **Free Tier:** Limited to 750 hours/month, goes to sleep after inactivity
- **Starter Plan:** $7/month for always-on service
- **Pro Plan:** $25/month for enhanced performance

## 🔄 Auto-Deployment

Render automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update backend"
git push origin main
# Render will automatically redeploy
```

## ✅ Your Backend is Ready!

Once deployed successfully, your WhatsApp-like community chat backend will be live and ready for your Flutter app integration!
