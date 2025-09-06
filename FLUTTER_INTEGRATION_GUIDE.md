# 📱 Complete Flutter Integration Guide
## WhatsApp-like Community Chat Backend API

### 🔗 Base Configuration

```dart
// lib/config/api_config.dart
class ApiConfig {
  // Update with your Render URL after deployment
  static const String baseUrl = 'http://localhost:3000/api'; // Local development
  // static const String baseUrl = 'https://your-app-name.onrender.com/api'; // Production
  
  static const String websocketUrl = 'ws://localhost:3000'; // Local
  // static const String websocketUrl = 'wss://your-app-name.onrender.com'; // Production
  
  static const String uploadUrl = '$baseUrl/upload';
}
```

---

## 🔐 Authentication Setup

### 1. Get Firebase ID Token (Required for Protected Routes)

```dart
// lib/services/auth_service.dart
import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  static Future<String?> getIdToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      return await user.getIdToken();
    }
    return null;
  }
  
  static Map<String, String> getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  static Future<Map<String, String>> getAuthHeadersWithToken() async {
    final token = await getIdToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
```

---

## 👥 User Management APIs

### 1. Get All Users (Public - No Auth Required)

```dart
// GET /api/users
Future<List<User>> getAllUsers() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/users'),
    headers: AuthService.getAuthHeaders(),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List).map((user) => User.fromJson(user)).toList();
  }
  throw Exception('Failed to load users');
}

// Response Example:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "displayName": "John Doe",
      "photoURL": "https://example.com/photo.jpg",
      "status": "online",
      "lastSeen": "2025-09-07T10:30:00.000Z"
    }
  ],
  "count": 1,
  "message": "Users retrieved successfully"
}
```

### 2. Get User Profile (Protected - Requires Auth)

```dart
// GET /api/users/profile
Future<User> getUserProfile() async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/users/profile'),
    headers: headers,
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return User.fromJson(data['data']);
  } else if (response.statusCode == 401) {
    throw Exception('Authentication required');
  }
  throw Exception('Failed to load profile');
}

// Response Example:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firebaseUid": "firebase-uid-123",
    "displayName": "John Doe",
    "email": "john@example.com",
    "photoURL": "https://example.com/photo.jpg",
    "status": "online",
    "bio": "Hello there!",
    "communities": ["community-id-1", "community-id-2"],
    "lastSeen": "2025-09-07T10:30:00.000Z",
    "createdAt": "2025-09-01T10:30:00.000Z"
  }
}
```

### 3. Update User Profile (Protected)

```dart
// PUT /api/users/profile
Future<User> updateUserProfile({
  String? displayName,
  String? bio,
  String? photoURL,
  String? status,
}) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final body = <String, dynamic>{};
  if (displayName != null) body['displayName'] = displayName;
  if (bio != null) body['bio'] = bio;
  if (photoURL != null) body['photoURL'] = photoURL;
  if (status != null) body['status'] = status; // online, offline, away, busy
  
  final response = await http.put(
    Uri.parse('${ApiConfig.baseUrl}/users/profile'),
    headers: headers,
    body: json.encode(body),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return User.fromJson(data['data']);
  }
  throw Exception('Failed to update profile');
}

// Request Body Example:
{
  "displayName": "John Doe Updated",
  "bio": "New bio message",
  "status": "online"
}
```

### 4. Search Users (Protected)

```dart
// GET /api/users/search?q=search_term
Future<List<User>> searchUsers(String searchTerm) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/users/search?q=$searchTerm'),
    headers: headers,
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List).map((user) => User.fromJson(user)).toList();
  }
  throw Exception('Failed to search users');
}
```

---

## 🏘️ Community Management APIs

### 1. Get All Public Communities (No Auth Required)

```dart
// GET /api/communities
Future<List<Community>> getAllCommunities() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/communities'),
    headers: AuthService.getAuthHeaders(),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List).map((community) => Community.fromJson(community)).toList();
  }
  throw Exception('Failed to load communities');
}

// Response Example:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Flutter Developers",
      "description": "Community for Flutter developers",
      "image": "https://example.com/community.jpg",
      "tags": ["flutter", "mobile", "development"],
      "memberCount": 150,
      "createdAt": "2025-09-01T10:30:00.000Z",
      "creator": {
        "displayName": "Admin User",
        "photoURL": "https://example.com/admin.jpg"
      }
    }
  ],
  "count": 1,
  "message": "Public communities retrieved successfully"
}
```

### 2. Create Community (Protected)

```dart
// POST /api/communities
Future<Community> createCommunity({
  required String name,
  required String description,
  String? image,
  List<String>? tags,
  bool isPrivate = false,
}) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final body = {
    'name': name,
    'description': description,
    'isPrivate': isPrivate,
    if (image != null) 'image': image,
    if (tags != null) 'tags': tags,
  };
  
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/communities'),
    headers: headers,
    body: json.encode(body),
  );
  
  if (response.statusCode == 201) {
    final data = json.decode(response.body);
    return Community.fromJson(data['data']);
  } else if (response.statusCode == 429) {
    throw Exception('Rate limit exceeded. Please try again later.');
  }
  throw Exception('Failed to create community');
}

// Request Body Example:
{
  "name": "React Native Developers",
  "description": "Community for React Native enthusiasts",
  "tags": ["react-native", "mobile", "javascript"],
  "isPrivate": false
}

// Response Example:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "React Native Developers",
    "description": "Community for React Native enthusiasts",
    "creator": "firebase-uid-123",
    "admins": ["firebase-uid-123"],
    "members": [
      {
        "userId": "firebase-uid-123",
        "role": "admin",
        "joinedAt": "2025-09-07T10:30:00.000Z"
      }
    ],
    "tags": ["react-native", "mobile", "javascript"],
    "isPrivate": false,
    "isActive": true,
    "memberCount": 1,
    "createdAt": "2025-09-07T10:30:00.000Z"
  },
  "message": "Community created successfully"
}
```

### 3. Get My Communities (Protected)

```dart
// GET /api/communities/my
Future<List<Community>> getMyCommunities() async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/communities/my'),
    headers: headers,
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List).map((community) => Community.fromJson(community)).toList();
  }
  throw Exception('Failed to load my communities');
}
```

### 4. Get Community Details (Protected)

```dart
// GET /api/communities/{id}
Future<Community> getCommunityDetails(String communityId) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/communities/$communityId'),
    headers: headers,
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return Community.fromJson(data['data']);
  } else if (response.statusCode == 403) {
    throw Exception('Access denied to private community');
  }
  throw Exception('Failed to load community details');
}
```

### 5. Join Community (Protected)

```dart
// POST /api/communities/{id}/join
Future<bool> joinCommunity(String communityId) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/communities/$communityId/join'),
    headers: headers,
  );
  
  if (response.statusCode == 200) {
    return true;
  } else if (response.statusCode == 400) {
    final data = json.decode(response.body);
    throw Exception(data['message']);
  }
  throw Exception('Failed to join community');
}

// Response Example:
{
  "success": true,
  "message": "Successfully joined community"
}
```

### 6. Leave Community (Protected)

```dart
// POST /api/communities/{id}/leave
Future<bool> leaveCommunity(String communityId) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/communities/$communityId/leave'),
    headers: headers,
  );
  
  if (response.statusCode == 200) {
    return true;
  }
  throw Exception('Failed to leave community');
}
```

### 7. Search Communities (Protected)

```dart
// GET /api/communities/search?q=search_term&tags=tag1,tag2
Future<List<Community>> searchCommunities({
  String? searchTerm,
  List<String>? tags,
}) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final queryParams = <String, String>{};
  if (searchTerm != null) queryParams['q'] = searchTerm;
  if (tags != null && tags.isNotEmpty) queryParams['tags'] = tags.join(',');
  
  final uri = Uri.parse('${ApiConfig.baseUrl}/communities/search')
      .replace(queryParameters: queryParams);
  
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List).map((community) => Community.fromJson(community)).toList();
  }
  throw Exception('Failed to search communities');
}
```

---

## 💬 Message APIs

### 1. Get Community Messages (Protected)

```dart
// GET /api/messages?communityId={id}&page=1&limit=50
Future<MessageResponse> getCommunityMessages({
  required String communityId,
  int page = 1,
  int limit = 50,
}) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final queryParams = {
    'communityId': communityId,
    'page': page.toString(),
    'limit': limit.toString(),
  };
  
  final uri = Uri.parse('${ApiConfig.baseUrl}/messages')
      .replace(queryParameters: queryParams);
  
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return MessageResponse.fromJson(data);
  }
  throw Exception('Failed to load messages');
}

// Response Example:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "communityId": "507f1f77bcf86cd799439012",
      "senderId": "firebase-uid-123",
      "content": "Hello everyone!",
      "messageType": "text",
      "replyTo": null,
      "mentions": [],
      "attachments": [],
      "editedAt": null,
      "createdAt": "2025-09-07T10:30:00.000Z",
      "sender": {
        "displayName": "John Doe",
        "photoURL": "https://example.com/photo.jpg"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalMessages": 250,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Send Message (Protected)

```dart
// POST /api/messages
Future<Message> sendMessage({
  required String communityId,
  required String content,
  String messageType = 'text',
  String? replyTo,
  List<String>? mentions,
  List<String>? attachments,
}) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final body = {
    'communityId': communityId,
    'content': content,
    'messageType': messageType, // text, image, file, audio, video
    if (replyTo != null) 'replyTo': replyTo,
    if (mentions != null) 'mentions': mentions,
    if (attachments != null) 'attachments': attachments,
  };
  
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/messages'),
    headers: headers,
    body: json.encode(body),
  );
  
  if (response.statusCode == 201) {
    final data = json.decode(response.body);
    return Message.fromJson(data['data']);
  }
  throw Exception('Failed to send message');
}

// Request Body Example:
{
  "communityId": "507f1f77bcf86cd799439012",
  "content": "Hello @john, check this out!",
  "messageType": "text",
  "mentions": ["firebase-uid-456"]
}
```

### 3. Edit Message (Protected)

```dart
// PUT /api/messages/{id}
Future<Message> editMessage(String messageId, String newContent) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final body = {'content': newContent};
  
  final response = await http.put(
    Uri.parse('${ApiConfig.baseUrl}/messages/$messageId'),
    headers: headers,
    body: json.encode(body),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return Message.fromJson(data['data']);
  } else if (response.statusCode == 403) {
    throw Exception('Only message sender can edit this message');
  }
  throw Exception('Failed to edit message');
}
```

### 4. Delete Message (Protected)

```dart
// DELETE /api/messages/{id}
Future<bool> deleteMessage(String messageId) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.delete(
    Uri.parse('${ApiConfig.baseUrl}/messages/$messageId'),
    headers: headers,
  );
  
  if (response.statusCode == 200) {
    return true;
  } else if (response.statusCode == 403) {
    throw Exception('Only message sender can delete this message');
  }
  throw Exception('Failed to delete message');
}
```

---

## 📁 File Upload API

### Upload File (Protected)

```dart
// POST /api/upload
import 'package:http/http.dart' as http;
import 'dart:io';

Future<String> uploadFile(File file) async {
  final token = await AuthService.getIdToken();
  
  final request = http.MultipartRequest(
    'POST',
    Uri.parse(ApiConfig.uploadUrl),
  );
  
  // Add authorization header
  if (token != null) {
    request.headers['Authorization'] = 'Bearer $token';
  }
  
  // Add file
  request.files.add(await http.MultipartFile.fromPath('file', file.path));
  
  final response = await request.send();
  
  if (response.statusCode == 200) {
    final responseData = await response.stream.bytesToString();
    final data = json.decode(responseData);
    return data['data']['url']; // File URL
  } else if (response.statusCode == 413) {
    throw Exception('File too large. Maximum size is 10MB.');
  }
  throw Exception('Failed to upload file');
}

// Response Example:
{
  "success": true,
  "data": {
    "url": "https://your-app-name.onrender.com/uploads/1694123456789-image.jpg",
    "filename": "1694123456789-image.jpg",
    "originalName": "image.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg"
  },
  "message": "File uploaded successfully"
}
```

---

## 🔔 Notifications API

### 1. Get User Notifications (Protected)

```dart
// GET /api/notifications?page=1&limit=20&unreadOnly=false
Future<NotificationResponse> getNotifications({
  int page = 1,
  int limit = 20,
  bool unreadOnly = false,
}) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final queryParams = {
    'page': page.toString(),
    'limit': limit.toString(),
    'unreadOnly': unreadOnly.toString(),
  };
  
  final uri = Uri.parse('${ApiConfig.baseUrl}/notifications')
      .replace(queryParameters: queryParams);
  
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return NotificationResponse.fromJson(data);
  }
  throw Exception('Failed to load notifications');
}

// Response Example:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "userId": "firebase-uid-123",
      "type": "mention",
      "title": "You were mentioned",
      "message": "John mentioned you in Flutter Developers",
      "data": {
        "communityId": "507f1f77bcf86cd799439012",
        "messageId": "507f1f77bcf86cd799439014"
      },
      "isRead": false,
      "createdAt": "2025-09-07T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalNotifications": 50,
    "unreadCount": 15
  }
}
```

### 2. Mark Notification as Read (Protected)

```dart
// PUT /api/notifications/{id}/read
Future<bool> markNotificationAsRead(String notificationId) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.put(
    Uri.parse('${ApiConfig.baseUrl}/notifications/$notificationId/read'),
    headers: headers,
  );
  
  return response.statusCode == 200;
}
```

### 3. Mark All Notifications as Read (Protected)

```dart
// PUT /api/notifications/read-all
Future<bool> markAllNotificationsAsRead() async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final response = await http.put(
    Uri.parse('${ApiConfig.baseUrl}/notifications/read-all'),
    headers: headers,
  );
  
  return response.statusCode == 200;
}
```

---

## 🚨 Report API

### Create Report (Protected)

```dart
// POST /api/reports
Future<bool> createReport({
  required String type, // message, user, community
  required String targetId,
  required String reason,
  String? description,
}) async {
  final headers = await AuthService.getAuthHeadersWithToken();
  
  final body = {
    'type': type,
    'targetId': targetId,
    'reason': reason,
    if (description != null) 'description': description,
  };
  
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/reports'),
    headers: headers,
    body: json.encode(body),
  );
  
  if (response.statusCode == 201) {
    return true;
  }
  throw Exception('Failed to create report');
}

// Request Body Example:
{
  "type": "message",
  "targetId": "507f1f77bcf86cd799439014",
  "reason": "spam",
  "description": "This message contains spam content"
}
```

---

## 🌐 WebSocket (Real-time) Integration

### Setup WebSocket Connection

```dart
// lib/services/websocket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebSocketService {
  static IO.Socket? _socket;
  
  static Future<void> connect() async {
    final token = await AuthService.getIdToken();
    
    _socket = IO.io(ApiConfig.websocketUrl, 
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setExtraHeaders({'Authorization': 'Bearer $token'})
        .build()
    );
    
    _socket?.onConnect((_) {
      print('Connected to WebSocket');
    });
    
    _socket?.onDisconnect((_) {
      print('Disconnected from WebSocket');
    });
    
    // Listen for new messages
    _socket?.on('new_message', (data) {
      // Handle new message received
      final message = Message.fromJson(data);
      // Update your UI
    });
    
    // Listen for typing indicators
    _socket?.on('user_typing', (data) {
      // Handle typing indicator
      print('${data['username']} is typing...');
    });
    
    // Listen for user online status
    _socket?.on('user_status_change', (data) {
      // Handle user status change
      print('${data['userId']} is now ${data['status']}');
    });
  }
  
  // Join community rooms
  static void joinCommunities(List<String> communityIds) {
    _socket?.emit('join_communities', {'communityIds': communityIds});
  }
  
  // Send typing indicator
  static void sendTypingIndicator(String communityId, bool isTyping) {
    _socket?.emit('typing', {
      'communityId': communityId,
      'isTyping': isTyping
    });
  }
  
  // Disconnect
  static void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
```

---

## 🔍 Health Check & System Info

### Health Check (No Auth Required)

```dart
// GET /health
Future<Map<String, dynamic>> getHealthStatus() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl.replaceAll('/api', '')}/health'),
    headers: AuthService.getAuthHeaders(),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  }
  throw Exception('Server health check failed');
}

// Response Example:
{
  "success": true,
  "message": "Community Chat Backend Server is running!",
  "timestamp": "2025-09-07T10:30:00.000Z",
  "connectedUsers": 25,
  "version": "1.0.0"
}
```

---

## 📊 Error Handling

### Common HTTP Status Codes

```dart
class ApiService {
  static void handleError(http.Response response) {
    switch (response.statusCode) {
      case 400:
        final data = json.decode(response.body);
        throw Exception('Bad Request: ${data['message']}');
      case 401:
        throw Exception('Authentication required. Please login again.');
      case 403:
        throw Exception('Access denied. Insufficient permissions.');
      case 404:
        throw Exception('Resource not found.');
      case 429:
        throw Exception('Rate limit exceeded. Please try again later.');
      case 500:
        throw Exception('Server error. Please try again later.');
      default:
        throw Exception('Unknown error occurred: ${response.statusCode}');
    }
  }
}
```

---

## 🎯 Complete Usage Example

```dart
// lib/services/chat_service.dart
class ChatService {
  // Initialize user and connect to WebSocket
  static Future<void> initializeUser() async {
    try {
      // Get user profile (creates user if doesn't exist)
      final user = await getUserProfile();
      
      // Get user's communities
      final communities = await getMyCommunities();
      
      // Connect to WebSocket
      await WebSocketService.connect();
      
      // Join community rooms
      WebSocketService.joinCommunities(
        communities.map((c) => c.id).toList()
      );
      
      print('User initialized successfully');
    } catch (e) {
      print('Failed to initialize user: $e');
      rethrow;
    }
  }
  
  // Send a message and get real-time updates
  static Future<void> sendChatMessage(String communityId, String content) async {
    try {
      // Send message via API
      final message = await sendMessage(
        communityId: communityId,
        content: content,
      );
      
      // Message will be received via WebSocket by all community members
      print('Message sent: ${message.id}');
    } catch (e) {
      print('Failed to send message: $e');
      rethrow;
    }
  }
}
```

This comprehensive guide shows you exactly how to integrate every API endpoint with your Flutter app. Each example includes the exact request format, response structure, and error handling you'll need for your WhatsApp-like community chat application! 🚀
