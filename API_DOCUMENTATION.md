# Community Chat Backend - Complete API Documentation

## 🎯 Overview

This is a comprehensive real-time community chat backend server that provides all the functionality described in your requirements. The server supports Firebase authentication, real-time messaging, community management, file sharing, and much more.

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js with Express.js
- **Real-time**: Socket.IO for WebSocket communication
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **File Upload**: Multer with local storage
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet.js, CORS, Rate limiting

### Key Features Implemented
✅ Firebase Authentication Integration  
✅ User Management (get/create from Firebase UID)  
✅ Community Creation and Management  
✅ Real-time Messaging (WebSocket)  
✅ Private 1:1 Chat  
✅ Message Mentions (@username)  
✅ Message Replies (Threading)  
✅ Message Reactions (Emojis)  
✅ Message Editing and Deletion  
✅ File Upload and Sharing  
✅ Real-time Notifications  
✅ User Search  
✅ Community Search  
✅ Message Search  
✅ Typing Indicators  
✅ Read Receipts  
✅ User Status (Online/Offline/Away/Busy)  
✅ User Blocking  
✅ Reporting System  
✅ Admin/Moderator Controls  
✅ Rate Limiting  
✅ Input Validation  
✅ Comprehensive Error Handling  

## 📡 Complete API Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication
All endpoints require Firebase authentication token:
```
Authorization: Bearer <firebase-id-token>
```

---

## 👥 User Endpoints

### Get User Profile
```http
GET /api/users/profile
```
**Description**: Gets or creates user profile from Firebase UID
**Response**: User object with profile information

### Update User Profile
```http
PUT /api/users/profile
Content-Type: application/json

{
  "displayName": "John Doe",
  "bio": "Software Developer",
  "status": "online"
}
```

### Search Users
```http
GET /api/users/search?q=john&page=1&limit=20
```

### Block/Unblock User
```http
POST /api/users/{userId}/block
```

### Update User Status
```http
PUT /api/users/status
Content-Type: application/json

{
  "status": "away"
}
```
**Status Options**: `online`, `offline`, `away`, `busy`

---

## 🏘️ Community Endpoints

### Create Community
```http
POST /api/communities
Content-Type: application/json

{
  "name": "Tech Enthusiasts",
  "description": "A community for tech lovers",
  "tags": ["technology", "programming", "innovation"],
  "isPrivate": false
}
```

### Search Communities
```http
GET /api/communities/search?q=tech&page=1&limit=20
```

### Get User's Communities
```http
GET /api/communities/my
```

### Get Community Details
```http
GET /api/communities/{communityId}
```

### Update Community
```http
PUT /api/communities/{communityId}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Join Community
```http
POST /api/communities/{communityId}/join
```

### Leave Community
```http
POST /api/communities/{communityId}/leave
```

### Update Member Role
```http
PUT /api/communities/{communityId}/members/{userId}/role
Content-Type: application/json

{
  "role": "admin"
}
```
**Role Options**: `member`, `admin`, `moderator`

### Remove Member
```http
DELETE /api/communities/{communityId}/members/{userId}
```

---

## 💬 Message Endpoints

### Send Message
```http
POST /api/messages
Content-Type: application/json

{
  "content": {
    "text": "Hello @username! How are you?",
    "type": "text"
  },
  "communityId": "community_id_here",
  "mentions": ["firebase_uid_of_mentioned_user"],
  "replyTo": "message_id_to_reply_to",
  "priority": "normal"
}
```

### Send Private Message
```http
POST /api/messages
Content-Type: application/json

{
  "content": {
    "text": "Hey there!",
    "type": "text"
  },
  "recipientId": "firebase_uid_of_recipient"
}
```

### Get Messages
```http
GET /api/messages?communityId={id}&page=1&limit=50
GET /api/messages?recipientId={uid}&page=1&limit=50
```

### Search Messages
```http
GET /api/messages/search?q=hello&communityId={id}&page=1&limit=20
```

### Edit Message
```http
PUT /api/messages/{messageId}
Content-Type: application/json

{
  "content": {
    "text": "Updated message content"
  }
}
```

### Delete Message
```http
DELETE /api/messages/{messageId}
```

### Add Reaction
```http
POST /api/messages/{messageId}/reactions
Content-Type: application/json

{
  "emoji": "👍"
}
```

### Remove Reaction
```http
DELETE /api/messages/{messageId}/reactions
```

### Mark as Read
```http
POST /api/messages/{messageId}/read
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /api/notifications?page=1&limit=20
```

### Get Unread Count
```http
GET /api/notifications/unread-count
```

### Mark Notification as Read
```http
PUT /api/notifications/{notificationId}/read
```

### Mark All as Read
```http
PUT /api/notifications/read-all
```

### Delete Notification
```http
DELETE /api/notifications/{notificationId}
```

---

## 📎 File Upload Endpoints

### Upload Single File
```http
POST /api/upload
Content-Type: multipart/form-data

file: [binary file data]
```

### Upload Multiple Files
```http
POST /api/upload/multiple
Content-Type: multipart/form-data

files: [array of binary file data]
```

**Supported Types**: Images (jpg, png, gif), Documents (pdf, doc, txt), Media (mp4, mp3, wav)
**Max Size**: 10MB per file

### Send File Message
```http
POST /api/messages
Content-Type: application/json

{
  "content": {
    "text": "Check out this image!",
    "type": "image",
    "fileUrl": "/uploads/images/filename.jpg",
    "fileName": "photo.jpg",
    "fileSize": 1024000
  },
  "communityId": "community_id_here"
}
```

---

## 🚨 Report Endpoints

### Create Report
```http
POST /api/reports
Content-Type: application/json

{
  "reportedUserId": "firebase_uid",
  "messageId": "message_id",
  "communityId": "community_id",
  "type": "spam",
  "reason": "This user is posting spam messages"
}
```
**Report Types**: `spam`, `harassment`, `inappropriate_content`, `fake_profile`, `other`

### Get User's Reports
```http
GET /api/reports/my?page=1&limit=20
```

### Get All Reports (Admin)
```http
GET /api/reports?status=pending&type=spam&page=1&limit=20
```

### Update Report Status (Admin)
```http
PUT /api/reports/{reportId}/status
Content-Type: application/json

{
  "status": "resolved",
  "action": "warning"
}
```

---

## 🔌 WebSocket Events (Socket.IO)

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'firebase-id-token'
  }
});
```

### Client → Server Events

#### Join Communities
```javascript
socket.emit('join_communities', {
  communityIds: ['community1', 'community2']
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  content: {
    text: 'Hello everyone!',
    type: 'text'
  },
  communityId: 'community_id_here',
  mentions: ['user_uid1', 'user_uid2']
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  communityId: 'community_id_here'
  // OR recipientId: 'user_uid_here'
});

// Stop typing
socket.emit('typing_stop', {
  communityId: 'community_id_here'
});
```

#### Add Reaction
```javascript
socket.emit('add_reaction', {
  messageId: 'message_id',
  emoji: '😄'
});
```

#### Update Status
```javascript
socket.emit('update_status', {
  status: 'away'
});
```

### Server → Client Events

#### New Message
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

#### User Mentioned
```javascript
socket.on('mentioned', (data) => {
  console.log('You were mentioned by:', data.mentionedBy);
  console.log('Message:', data.message);
});
```

#### Typing Events
```javascript
socket.on('user_typing', (data) => {
  console.log(data.userName + ' is typing...');
});

socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing');
});
```

#### Reaction Added
```javascript
socket.on('reaction_added', (data) => {
  console.log('Reaction added:', data.emoji);
});
```

#### User Status Changed
```javascript
socket.on('user_status_changed', (data) => {
  console.log('User status changed:', data.userId, data.status);
});
```

#### Notification
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

---

## 📊 Data Models

### User Model
```javascript
{
  firebaseUid: String,
  displayName: String,
  email: String,
  photoURL: String,
  status: String, // 'online', 'offline', 'away', 'busy'
  bio: String,
  communities: [ObjectId],
  blockedUsers: [String],
  lastSeen: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Community Model
```javascript
{
  name: String,
  description: String,
  image: String,
  creator: String, // Firebase UID
  admins: [String],
  members: [{
    userId: String,
    joinedAt: Date,
    role: String // 'member', 'admin', 'moderator'
  }],
  tags: [String],
  isPrivate: Boolean,
  memberCount: Number,
  lastActivity: Date,
  settings: {
    allowMemberInvites: Boolean,
    allowFileSharing: Boolean,
    messageRetentionDays: Number
  },
  isActive: Boolean
}
```

### Message Model
```javascript
{
  messageId: String,
  senderId: String, // Firebase UID
  communityId: ObjectId,
  recipientId: String, // Firebase UID
  content: {
    text: String,
    type: String, // 'text', 'image', 'file', 'audio', 'video'
    fileUrl: String,
    fileName: String,
    fileSize: Number
  },
  mentions: [{
    userId: String,
    displayName: String
  }],
  replyTo: {
    messageId: String,
    senderId: String,
    preview: String
  },
  reactions: [{
    userId: String,
    emoji: String,
    timestamp: Date
  }],
  readBy: [{
    userId: String,
    readAt: Date
  }],
  edited: {
    isEdited: Boolean,
    editedAt: Date,
    originalContent: String
  },
  isDeleted: Boolean,
  deletedAt: Date,
  priority: String,
  createdAt: Date
}
```

---

## 🔒 Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Message Sending**: 30 messages per minute
- **Community Creation**: 5 communities per hour
- **File Uploads**: 20 uploads per 15 minutes

### Input Validation
- All request bodies are validated using Joi schemas
- File type and size validation
- XSS protection with input sanitization

### Authentication
- Firebase token verification on all routes
- WebSocket authentication middleware
- User authorization for community actions

---

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env` and configure:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/community-chat
NODE_ENV=development

# Firebase Config (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MongoDB
```bash
mongod
```

### 4. Run Server
```bash
# Development
npm run dev

# Production
npm start
```

### 5. Test API
Visit: http://localhost:3000/api-docs

---

## 🧪 Testing Examples

### Test User Authentication
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Test Message Sending
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {"text": "Hello world!", "type": "text"},
    "communityId": "COMMUNITY_ID"
  }'
```

### Test WebSocket Connection
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_FIREBASE_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected!');
  
  socket.emit('send_message', {
    content: { text: 'Hello from WebSocket!', type: 'text' },
    communityId: 'COMMUNITY_ID'
  });
});
```

---

## 📈 Performance & Scalability

### Database Indexes
- User firebaseUid indexed for fast lookups
- Message senderId and communityId indexed
- Community member userId indexed
- Text search indexes on names and content

### Caching Strategy
- User sessions cached in memory
- Connected users tracked for real-time features
- Community membership cached

### Monitoring
- Health check endpoint: `/health`
- Error logging and stack traces
- Performance metrics available

---

## 🔧 Customization

### Adding New Message Types
1. Update Message model content.type enum
2. Add validation in messageService
3. Handle in WebSocket events
4. Update client-side rendering

### Adding New User Roles
1. Update Community model role enum
2. Add role-based authorization middleware
3. Update community management endpoints

### Adding New Notification Types
1. Update Notification model type enum
2. Create notification service methods
3. Trigger from relevant events

---

This backend server provides everything needed for a WhatsApp-like community chat application with real-time features, comprehensive API documentation, and production-ready security measures!
