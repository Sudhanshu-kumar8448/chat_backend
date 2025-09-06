# Community Chat Backend

A comprehensive real-time community chat backend server built with Node.js, Express, Socket.IO, and MongoDB. Features Firebase authentication, real-time messaging, file sharing, and community management.

## 🚀 Features

### Core Features
- **Firebase Authentication**: Secure user authentication with Firebase
- **Real-time Messaging**: WebSocket-based instant messaging
- **Community Management**: Create, join, and manage communities
- **Private Chat**: Direct messaging between users
- **File Sharing**: Upload and share images, documents, audio, and video
- **Message Features**: Mentions (@username), replies, reactions, editing
- **Notifications**: Real-time notifications for mentions, replies, and messages
- **User Management**: Profiles, status updates, blocking
- **Moderation**: Reporting system, admin controls
- **Search**: Search users, communities, and messages

### Technical Features
- **Rate Limiting**: Protection against spam and abuse
- **Input Validation**: Comprehensive request validation
- **API Documentation**: Auto-generated Swagger documentation
- **Error Handling**: Robust error handling and logging
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet.js security headers, CORS configuration

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **Firebase Project** with Authentication enabled
- **npm** or **yarn** package manager

## ⚙️ Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd chatting_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/community-chat
   
   # Firebase Configuration (Get these from Firebase Console > Project Settings > Service Accounts)
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   
   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   ```

## 🔥 Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with your preferred providers

2. **Generate Service Account**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

3. **Configure Environment Variables**
   - Extract values from the service account JSON
   - Add them to your `.env` file

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster

2. **Configure Database Access**
   - Go to Database Access → Add New Database User
   - Create username and password
   - Set permissions to "Read and write to any database"

3. **Configure Network Access**
   - Go to Network Access → Add IP Address
   - Add your current IP or use `0.0.0.0/0` for development (not recommended for production)

4. **Get Connection String**
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<username>` and `<password>` with your credentials
   - Add your database name at the end (e.g., `/community-chat`)

5. **Update Environment File**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/community-chat
   ```

### Option 2: Local MongoDB

1. **Install MongoDB**
   - Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)

2. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Use Local Connection**
   ```env
   MONGODB_URI=mongodb://localhost:27017/community-chat
   ```

**Note**: Database and collections will be created automatically when the server starts.

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 🔌 API Endpoints

### Authentication
All endpoints require Firebase authentication token in the Authorization header:
```
Authorization: Bearer <firebase-token>
```

### Core Endpoints

#### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users
- `POST /api/users/{userId}/block` - Block/unblock user
- `PUT /api/users/status` - Update user status

#### Communities
- `POST /api/communities` - Create community
- `GET /api/communities/search` - Search communities
- `GET /api/communities/my` - Get user's communities
- `GET /api/communities/{id}` - Get community details
- `PUT /api/communities/{id}` - Update community
- `POST /api/communities/{id}/join` - Join community
- `POST /api/communities/{id}/leave` - Leave community
- `PUT /api/communities/{id}/members/{userId}/role` - Update member role
- `DELETE /api/communities/{id}/members/{userId}` - Remove member

#### Messages
- `POST /api/messages` - Send message
- `GET /api/messages` - Get messages (community or private)
- `GET /api/messages/search` - Search messages
- `PUT /api/messages/{messageId}` - Edit message
- `DELETE /api/messages/{messageId}` - Delete message
- `POST /api/messages/{messageId}/reactions` - Add reaction
- `DELETE /api/messages/{messageId}/reactions` - Remove reaction
- `POST /api/messages/{messageId}/read` - Mark as read

#### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification

#### File Upload
- `POST /api/upload` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

#### Reports
- `POST /api/reports` - Create report
- `GET /api/reports/my` - Get user's reports
- `GET /api/reports` - Get all reports (admin)
- `PUT /api/reports/{id}/status` - Update report status (admin)

## 🌐 WebSocket Events

### Client → Server Events
- `join_communities` - Join community rooms
- `leave_community` - Leave community room
- `send_message` - Send a message
- `add_reaction` - Add emoji reaction
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `update_status` - Update online status
- `mark_read` - Mark message as read

### Server → Client Events
- `new_message` - New message received
- `mentioned` - User was mentioned
- `reaction_added` - Reaction added to message
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_status_changed` - User status updated
- `notification` - New notification
- `error` - Error occurred

## 📊 Rate Limits

- **General API**: 100 requests per 15 minutes
- **Message Sending**: 30 messages per minute
- **Community Creation**: 5 communities per hour
- **File Uploads**: 20 uploads per 15 minutes

## 🗂️ File Upload Support

Supported file types:
- **Images**: jpeg, jpg, png, gif
- **Documents**: pdf, doc, docx, txt
- **Media**: mp4, avi, mp3, wav

Maximum file size: 10MB per file

## 🛠️ Development

### Project Structure
```
chatting_backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # Firebase authentication
│   ├── rateLimiter.js       # Rate limiting
│   └── validation.js        # Request validation
├── models/
│   ├── User.js              # User model
│   ├── Community.js         # Community model
│   ├── Message.js           # Message model
│   ├── Notification.js      # Notification model
│   └── Report.js            # Report model
├── routes/
│   ├── users.js             # User routes
│   ├── communities.js       # Community routes
│   ├── messages.js          # Message routes
│   ├── notifications.js     # Notification routes
│   ├── upload.js            # File upload routes
│   └── reports.js           # Report routes
├── services/
│   ├── userService.js       # User business logic
│   ├── communityService.js  # Community business logic
│   ├── messageService.js    # Message business logic
│   ├── notificationService.js # Notification logic
│   ├── fileService.js       # File handling
│   └── reportService.js     # Report handling
├── socket/
│   └── socketHandler.js     # WebSocket event handling
├── docs/
│   └── swagger.js           # API documentation
└── server.js                # Main server file
```

### Adding New Features

1. **Create Model** (if needed) in `/models`
2. **Create Service** in `/services` for business logic
3. **Create Routes** in `/routes` for API endpoints
4. **Add Socket Events** in `/socket/socketHandler.js` (if real-time)
5. **Update Swagger Docs** with JSDoc comments

## 🧪 Testing

### Manual Testing
1. Use the Swagger UI at `/api-docs`
2. Test WebSocket connections with a Socket.IO client
3. Use Postman or similar tools for API testing

### Sample Requests

**Get User Profile:**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Send Message:**
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {"text": "Hello, world!", "type": "text"},
    "communityId": "community_id_here"
  }'
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper CORS origins
4. Configure file upload storage (consider cloud storage)

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db
FIREBASE_PROJECT_ID=your-production-project
# ... other Firebase configs
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env
   - Verify network connectivity

2. **Firebase Authentication Error**
   - Verify Firebase service account credentials
   - Check Firebase project configuration
   - Ensure authentication is enabled

3. **File Upload Error**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure supported file types

4. **Socket Connection Issues**
   - Check CORS configuration
   - Verify Firebase token in socket auth
   - Check network/firewall settings

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the troubleshooting section

---

**Happy Coding! 🎉**
