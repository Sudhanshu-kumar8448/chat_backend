# 🔗 API Endpoints Quick Reference

## Base URL
- **Local Development:** `http://localhost:3000/api`
- **Production:** `https://your-app-name.onrender.com/api`

---

## 👥 USER ENDPOINTS

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/users` | ❌ No | Get all users (public info) |
| `GET` | `/users/profile` | ✅ Yes | Get current user profile |
| `PUT` | `/users/profile` | ✅ Yes | Update user profile |
| `GET` | `/users/search?q={term}` | ✅ Yes | Search users by name |

---

## 🏘️ COMMUNITY ENDPOINTS

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/communities` | ❌ No | Get all public communities |
| `POST` | `/communities` | ✅ Yes | Create new community |
| `GET` | `/communities/my` | ✅ Yes | Get user's communities |
| `GET` | `/communities/search` | ✅ Yes | Search communities |
| `GET` | `/communities/{id}` | ✅ Yes | Get community details |
| `POST` | `/communities/{id}/join` | ✅ Yes | Join community |
| `POST` | `/communities/{id}/leave` | ✅ Yes | Leave community |
| `PUT` | `/communities/{id}` | ✅ Yes | Update community (admin only) |

---

## 💬 MESSAGE ENDPOINTS

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/messages?communityId={id}` | ✅ Yes | Get community messages |
| `POST` | `/messages` | ✅ Yes | Send message |
| `PUT` | `/messages/{id}` | ✅ Yes | Edit message (sender only) |
| `DELETE` | `/messages/{id}` | ✅ Yes | Delete message (sender only) |

---

## 🔔 NOTIFICATION ENDPOINTS

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/notifications` | ✅ Yes | Get user notifications |
| `PUT` | `/notifications/{id}/read` | ✅ Yes | Mark notification as read |
| `PUT` | `/notifications/read-all` | ✅ Yes | Mark all notifications as read |

---

## 📁 FILE UPLOAD ENDPOINTS

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/upload` | ✅ Yes | Upload file (multipart/form-data) |

---

## 🚨 REPORT ENDPOINTS

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/reports` | ✅ Yes | Report user/message/community |

---

## 🔍 SYSTEM ENDPOINTS

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/health` | ❌ No | Server health check |
| `GET` | `/api-docs` | ❌ No | API documentation (Swagger) |

---

## 🌐 WEBSOCKET EVENTS

### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `join_communities` | `{communityIds: []}` | Join community rooms |
| `leave_community` | `{communityId: ""}` | Leave community room |
| `typing` | `{communityId: "", isTyping: true}` | Send typing indicator |
| `user_status` | `{status: "online"}` | Update user status |

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `new_message` | `Message object` | New message received |
| `message_edited` | `Message object` | Message was edited |
| `message_deleted` | `{messageId: ""}` | Message was deleted |
| `user_typing` | `{userId: "", communityId: "", isTyping: true}` | User typing indicator |
| `user_status_change` | `{userId: "", status: "online"}` | User status changed |
| `community_updated` | `Community object` | Community info updated |
| `notification` | `Notification object` | New notification |

---

## 🔐 AUTHENTICATION

### Required Headers for Protected Routes:
```
Authorization: Bearer {firebase_id_token}
Content-Type: application/json
```

### Getting Firebase ID Token (Flutter):
```dart
final user = FirebaseAuth.instance.currentUser;
final idToken = await user?.getIdToken();
```

---

## 📊 RESPONSE FORMAT

### Success Response:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

---

## 🚦 HTTP STATUS CODES

| Code | Meaning | When it occurs |
|------|---------|----------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Access denied |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

---

## 📝 EXAMPLE REQUESTS

### Create Community:
```bash
POST /api/communities
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Flutter Developers",
  "description": "Community for Flutter enthusiasts",
  "tags": ["flutter", "mobile", "dart"],
  "isPrivate": false
}
```

### Send Message:
```bash
POST /api/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "communityId": "507f1f77bcf86cd799439012",
  "content": "Hello everyone! 👋",
  "messageType": "text"
}
```

### Upload File:
```bash
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
```

---

## 🔄 PAGINATION

### Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Response Format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🎯 RATE LIMITS

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Community Creation | 5 requests | 1 hour |
| File Upload | 20 requests | 15 minutes |
| Message Sending | 50 requests | 1 minute |

---

This quick reference guide gives you all the essential information to integrate your Flutter app with the backend! 🚀
