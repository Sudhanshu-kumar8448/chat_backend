# 📱 Complete Flutter Integration Guide
## WhatsApp-like Community Chat Backend API

### 🔗 Base Configuration

```dart
// lib/config/api_config.dart
class ApiConfig {
  // Production Render URLs (Your deployed backend)
  static const String baseUrl = 'https://chat-backend-ehww.onrender.com/api';
  static const String websocketUrl = 'wss://chat-backend-ehww.onrender.com';
  static const String healthUrl = 'https://chat-backend-ehww.onrender.com/health';
  
  // For local development (uncomment when testing locally)
  // static const String baseUrl = 'http://localhost:3000/api';
  // static const String websocketUrl = 'ws://localhost:3000';
  
  static const String uploadUrl = '$baseUrl/upload';
  
  // Request timeout settings
  static const Duration requestTimeout = Duration(seconds: 30);
  static const Duration websocketTimeout = Duration(seconds: 10);
}
```

### 🛜 Network Security Configuration

Add network permissions for Android and iOS:

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Add these permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:label="your_app_name"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="true">
        <!-- Your existing configuration -->
    </application>
</manifest>
```

**iOS (ios/Runner/Info.plist):**
```xml
<dict>
    <!-- Add this for network access -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <!-- Your existing configuration -->
</dict>
```

---

## 🔐 Authentication Setup

### 1. Firebase Setup (Required)

First, ensure Firebase is properly configured in your Flutter app:

```dart
// lib/services/auth_service.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  static Future<String?> getIdToken() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        // Get fresh token (important for API calls)
        return await user.getIdToken(true);
      }
      return null;
    } catch (e) {
      print('Error getting ID token: $e');
      return null;
    }
  }
  
  static Map<String, String> getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
  
  static Future<Map<String, String>> getAuthHeadersWithToken() async {
    final token = await getIdToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  // Test authentication status
  static Future<bool> testAuth() async {
    try {
      final headers = await getAuthHeadersWithToken();
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/users/profile'),
        headers: headers,
      ).timeout(ApiConfig.requestTimeout);
      
      return response.statusCode == 200;
    } catch (e) {
      print('Auth test failed: $e');
      return false;
    }
  }
}
```

### 2. API Response Handler

```dart
// lib/services/api_response_handler.dart
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;
  final String? error;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
    this.error,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json, T? data) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      data: data,
      message: json['message'],
      statusCode: json['statusCode'],
      error: json['error'],
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  
  ApiException(this.message, [this.statusCode]);
  
  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}
```

---

## 👥 User Management APIs

### 1. Get All Users (Public - No Auth Required)

```dart
// lib/services/user_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class UserService {
  
  // GET /api/users - Get all users (public endpoint)
  static Future<ApiResponse<List<User>>> getAllUsers() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/users'),
        headers: AuthService.getAuthHeaders(),
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 200 && jsonData['success'] == true) {
        final userList = (jsonData['data'] as List)
            .map((user) => User.fromJson(user))
            .toList();
        
        return ApiResponse<List<User>>(
          success: true,
          data: userList,
          message: jsonData['message'],
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<List<User>>(
          success: false,
          error: jsonData['message'] ?? 'Failed to load users',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<List<User>>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }

  // GET /api/users/profile - Get current user profile (requires auth)
  static Future<ApiResponse<User>> getUserProfile() async {
    try {
      final headers = await AuthService.getAuthHeadersWithToken();
      
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/users/profile'),
        headers: headers,
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 200 && jsonData['success'] == true) {
        final user = User.fromJson(jsonData['data']);
        
        return ApiResponse<User>(
          success: true,
          data: user,
          message: jsonData['message'],
          statusCode: response.statusCode,
        );
      } else if (response.statusCode == 401) {
        return ApiResponse<User>(
          success: false,
          error: 'Authentication required. Please login again.',
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<User>(
          success: false,
          error: jsonData['message'] ?? 'Failed to load profile',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<User>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }

  // PUT /api/users/profile - Update user profile (requires auth)
  static Future<ApiResponse<User>> updateUserProfile({
    String? displayName,
    String? photoURL,
    String? status,
  }) async {
    try {
      final headers = await AuthService.getAuthHeadersWithToken();
      
      final body = <String, dynamic>{};
      if (displayName != null) body['displayName'] = displayName;
      if (photoURL != null) body['photoURL'] = photoURL;
      if (status != null) body['status'] = status;
      
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/users/profile'),
        headers: headers,
        body: json.encode(body),
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 200 && jsonData['success'] == true) {
        final user = User.fromJson(jsonData['data']);
        
        return ApiResponse<User>(
          success: true,
          data: user,
          message: jsonData['message'],
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<User>(
          success: false,
          error: jsonData['message'] ?? 'Failed to update profile',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<User>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }
}

// User model class
class User {
  final String id;
  final String firebaseUid;
  final String displayName;
  final String email;
  final String? photoURL;
  final String status;
  final DateTime? lastSeen;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.firebaseUid,
    required this.displayName,
    required this.email,
    this.photoURL,
    required this.status,
    this.lastSeen,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      firebaseUid: json['firebaseUid'],
      displayName: json['displayName'],
      email: json['email'],
      photoURL: json['photoURL'],
      status: json['status'] ?? 'offline',
      lastSeen: json['lastSeen'] != null ? DateTime.parse(json['lastSeen']) : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firebaseUid': firebaseUid,
      'displayName': displayName,
      'email': email,
      'photoURL': photoURL,
      'status': status,
      'lastSeen': lastSeen?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
```

### API Response Examples:

**Get All Users Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firebaseUid": "firebase_user_123",
      "displayName": "John Doe",
      "email": "john@example.com",
      "photoURL": "https://example.com/photo.jpg",
      "status": "online",
      "lastSeen": "2025-09-07T10:30:00.000Z",
      "createdAt": "2025-09-01T08:00:00.000Z",
      "updatedAt": "2025-09-07T10:30:00.000Z"
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

```dart
// lib/services/community_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class CommunityService {
  
  // GET /api/communities - Get all public communities (no auth required)
  static Future<ApiResponse<List<Community>>> getAllCommunities() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/communities'),
        headers: AuthService.getAuthHeaders(),
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 200 && jsonData['success'] == true) {
        final communityList = (jsonData['data'] as List)
            .map((community) => Community.fromJson(community))
            .toList();
        
        return ApiResponse<List<Community>>(
          success: true,
          data: communityList,
          message: jsonData['message'],
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<List<Community>>(
          success: false,
          error: jsonData['message'] ?? 'Failed to load communities',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<List<Community>>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }

  // GET /api/communities/:id - Get specific community (no auth required)
  static Future<ApiResponse<Community>> getCommunity(String communityId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/communities/$communityId'),
        headers: AuthService.getAuthHeaders(),
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 200 && jsonData['success'] == true) {
        final community = Community.fromJson(jsonData['data']);
        
        return ApiResponse<Community>(
          success: true,
          data: community,
          message: jsonData['message'],
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<Community>(
          success: false,
          error: jsonData['message'] ?? 'Community not found',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<Community>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }

  // POST /api/communities - Create new community (requires auth)
  static Future<ApiResponse<Community>> createCommunity({
    required String name,
    required String description,
    String? imageUrl,
    bool isPrivate = false,
    List<String>? tags,
  }) async {
    try {
      final headers = await AuthService.getAuthHeadersWithToken();
      
      final body = {
        'name': name,
        'description': description,
        if (imageUrl != null) 'imageUrl': imageUrl,
        'isPrivate': isPrivate,
        if (tags != null) 'tags': tags,
      };
      
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/communities'),
        headers: headers,
        body: json.encode(body),
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 201 && jsonData['success'] == true) {
        final community = Community.fromJson(jsonData['data']);
        
        return ApiResponse<Community>(
          success: true,
          data: community,
          message: jsonData['message'],
          statusCode: response.statusCode,
        );
      } else if (response.statusCode == 401) {
        return ApiResponse<Community>(
          success: false,
          error: 'Authentication required. Please login again.',
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<Community>(
          success: false,
          error: jsonData['message'] ?? 'Failed to create community',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<Community>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }

  // POST /api/communities/:id/join - Join community (requires auth)
  static Future<ApiResponse<Community>> joinCommunity(String communityId) async {
    try {
      final headers = await AuthService.getAuthHeadersWithToken();
      
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/communities/$communityId/join'),
        headers: headers,
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 200 && jsonData['success'] == true) {
        final community = Community.fromJson(jsonData['data']);
        
        return ApiResponse<Community>(
          success: true,
          data: community,
          message: jsonData['message'] ?? 'Successfully joined community',
          statusCode: response.statusCode,
        );
      } else if (response.statusCode == 401) {
        return ApiResponse<Community>(
          success: false,
          error: 'Authentication required. Please login again.',
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<Community>(
          success: false,
          error: jsonData['message'] ?? 'Failed to join community',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<Community>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }

  // POST /api/communities/:id/leave - Leave community (requires auth)
  static Future<ApiResponse<String>> leaveCommunity(String communityId) async {
    try {
      final headers = await AuthService.getAuthHeadersWithToken();
      
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/communities/$communityId/leave'),
        headers: headers,
      ).timeout(ApiConfig.requestTimeout);
      
      final jsonData = json.decode(response.body);
      
      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse<String>(
          success: true,
          data: 'Left community successfully',
          message: jsonData['message'],
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<String>(
          success: false,
          error: jsonData['message'] ?? 'Failed to leave community',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<String>(
        success: false,
        error: 'Network error: $e',
      );
    }
  }
}

// Community model class
class Community {
  final String id;
  final String name;
  final String description;
  final String? imageUrl;
  final String createdBy;
  final List<String> members;
  final List<String> admins;
  final bool isPrivate;
  final List<String>? tags;
  final DateTime createdAt;
  final DateTime updatedAt;

  Community({
    required this.id,
    required this.name,
    required this.description,
    this.imageUrl,
    required this.createdBy,
    required this.members,
    required this.admins,
    required this.isPrivate,
    this.tags,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Community.fromJson(Map<String, dynamic> json) {
    return Community(
      id: json['_id'],
      name: json['name'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      createdBy: json['createdBy'],
      members: List<String>.from(json['members'] ?? []),
      admins: List<String>.from(json['admins'] ?? []),
      isPrivate: json['isPrivate'] ?? false,
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'imageUrl': imageUrl,
      'createdBy': createdBy,
      'members': members,
      'admins': admins,
      'isPrivate': isPrivate,
      'tags': tags,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
  
  // Helper methods
  bool isMember(String userId) => members.contains(userId);
  bool isAdmin(String userId) => admins.contains(userId);
  int get memberCount => members.length;
}
```

### API Response Examples:

**Get All Communities Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Flutter Developers",
      "description": "A community for Flutter developers to share and learn",
      "imageUrl": "https://example.com/community-image.jpg",
      "createdBy": "user-id-123",
      "members": ["user-id-123", "user-id-456"],
      "admins": ["user-id-123"],
      "isPrivate": false,
      "tags": ["flutter", "mobile", "development"],
      "createdAt": "2025-09-01T08:00:00.000Z",
      "updatedAt": "2025-09-07T10:30:00.000Z"
    }
  ],
  "count": 1,
  "message": "Communities retrieved successfully"
}
```
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

### 1. Add Socket.IO Dependencies

Add to your `pubspec.yaml`:
```yaml
dependencies:
  socket_io_client: ^2.0.3+1
  # Other dependencies...
```

### 2. WebSocket Service Implementation

```dart
// lib/services/websocket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:async';

class WebSocketService {
  static IO.Socket? _socket;
  static bool _isConnected = false;
  
  // Stream controllers for real-time updates
  static final StreamController<Message> _messageController = StreamController<Message>.broadcast();
  static final StreamController<Map<String, dynamic>> _typingController = StreamController<Map<String, dynamic>>.broadcast();
  static final StreamController<Map<String, dynamic>> _userStatusController = StreamController<Map<String, dynamic>>.broadcast();
  static final StreamController<Notification> _notificationController = StreamController<Notification>.broadcast();
  
  // Getters for streams
  static Stream<Message> get messageStream => _messageController.stream;
  static Stream<Map<String, dynamic>> get typingStream => _typingController.stream;
  static Stream<Map<String, dynamic>> get userStatusStream => _userStatusController.stream;
  static Stream<Notification> get notificationStream => _notificationController.stream;
  
  static bool get isConnected => _isConnected;
  
  static Future<void> connect() async {
    try {
      final token = await AuthService.getIdToken();
      
      if (token == null) {
        print('❌ No Firebase token available for WebSocket connection');
        return;
      }
      
      _socket = IO.io(
        ApiConfig.websocketUrl, 
        IO.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .enableAutoConnect()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .setTimeout(ApiConfig.websocketTimeout.inMilliseconds)
          .build()
      );
      
      _setupEventListeners();
      
      _socket?.connect();
      
    } catch (e) {
      print('❌ WebSocket connection error: $e');
    }
  }
  
  static void _setupEventListeners() {
    _socket?.onConnect((_) {
      print('✅ Connected to WebSocket');
      _isConnected = true;
    });
    
    _socket?.onDisconnect((_) {
      print('❌ Disconnected from WebSocket');
      _isConnected = false;
    });
    
    _socket?.onConnectError((error) {
      print('❌ WebSocket connection error: $error');
      _isConnected = false;
    });
    
    _socket?.onError((error) {
      print('❌ WebSocket error: $error');
    });
    
    // Listen for new messages
    _socket?.on('new_message', (data) {
      try {
        final message = Message.fromJson(data);
        _messageController.add(message);
        print('📨 New message received: ${message.content}');
      } catch (e) {
        print('❌ Error parsing new message: $e');
      }
    });
    
    // Listen for message updates (edit, delete)
    _socket?.on('message_updated', (data) {
      try {
        final message = Message.fromJson(data);
        _messageController.add(message);
        print('📝 Message updated: ${message.id}');
      } catch (e) {
        print('❌ Error parsing message update: $e');
      }
    });
    
    // Listen for typing indicators
    _socket?.on('user_typing', (data) {
      try {
        _typingController.add(Map<String, dynamic>.from(data));
        print('⌨️ ${data['displayName']} is typing in ${data['communityId']}');
      } catch (e) {
        print('❌ Error parsing typing indicator: $e');
      }
    });
    
    // Listen for user online status changes
    _socket?.on('user_status_change', (data) {
      try {
        _userStatusController.add(Map<String, dynamic>.from(data));
        print('👤 ${data['userId']} is now ${data['status']}');
      } catch (e) {
        print('❌ Error parsing status change: $e');
      }
    });
    
    // Listen for new notifications
    _socket?.on('new_notification', (data) {
      try {
        final notification = Notification.fromJson(data);
        _notificationController.add(notification);
        print('🔔 New notification: ${notification.title}');
      } catch (e) {
        print('❌ Error parsing notification: $e');
      }
    });
    
    // Listen for community updates
    _socket?.on('community_updated', (data) {
      try {
        print('🏘️ Community updated: ${data['communityId']}');
        // Handle community updates (new members, etc.)
      } catch (e) {
        print('❌ Error parsing community update: $e');
      }
    });
  }
  
  // Join community rooms to receive messages
  static void joinCommunities(List<String> communityIds) {
    if (_isConnected && communityIds.isNotEmpty) {
      _socket?.emit('join_communities', {'communityIds': communityIds});
      print('🏠 Joined communities: ${communityIds.join(', ')}');
    }
  }
  
  // Leave community rooms
  static void leaveCommunities(List<String> communityIds) {
    if (_isConnected && communityIds.isNotEmpty) {
      _socket?.emit('leave_communities', {'communityIds': communityIds});
      print('🚪 Left communities: ${communityIds.join(', ')}');
    }
  }
  
  // Send typing indicator
  static void sendTypingIndicator(String communityId, bool isTyping) {
    if (_isConnected) {
      _socket?.emit('typing', {
        'communityId': communityId,
        'isTyping': isTyping
      });
    }
  }
  
  // Update user status
  static void updateUserStatus(String status) {
    if (_isConnected) {
      _socket?.emit('status_change', {'status': status});
      print('📱 Status updated to: $status');
    }
  }
  
  // Send private message notification
  static void sendPrivateMessage(String recipientId, String message) {
    if (_isConnected) {
      _socket?.emit('private_message', {
        'recipientId': recipientId,
        'message': message,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }
  
  // Disconnect from WebSocket
  static void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    print('🔌 WebSocket disconnected');
  }
  
  // Cleanup streams
  static void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _userStatusController.close();
    _notificationController.close();
  }
  
  // Reconnect if needed
  static Future<void> reconnect() async {
    if (!_isConnected) {
      disconnect();
      await Future.delayed(Duration(seconds: 2));
      await connect();
    }
  }
}
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

---

## 🧪 Testing Your Integration

### 1. Quick Integration Test

Create this test file to verify your backend connection:

```dart
// lib/test/integration_test.dart
class IntegrationTest {
  
  // Test 1: Backend Health Check
  static Future<bool> testBackendHealth() async {
    try {
      print('🏥 Testing backend health...');
      final response = await http.get(
        Uri.parse(ApiConfig.healthUrl),
        headers: {'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          print('✅ Backend is healthy: ${data['message']}');
          return true;
        }
      }
      print('❌ Backend health check failed');
      return false;
    } catch (e) {
      print('❌ Backend connection error: $e');
      return false;
    }
  }
  
  // Test 2: Public API Access
  static Future<bool> testPublicAPIs() async {
    try {
      print('🔓 Testing public APIs...');
      
      // Test communities endpoint
      final communitiesResponse = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/communities'),
        headers: AuthService.getAuthHeaders(),
      ).timeout(Duration(seconds: 10));
      
      if (communitiesResponse.statusCode == 200) {
        print('✅ Communities API working');
      } else {
        print('❌ Communities API failed: ${communitiesResponse.statusCode}');
        return false;
      }
      
      // Test users endpoint
      final usersResponse = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/users'),
        headers: AuthService.getAuthHeaders(),
      ).timeout(Duration(seconds: 10));
      
      if (usersResponse.statusCode == 200) {
        print('✅ Users API working');
        return true;
      } else {
        print('❌ Users API failed: ${usersResponse.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ Public API test error: $e');
      return false;
    }
  }
  
  // Test 3: Authentication
  static Future<bool> testAuthentication() async {
    try {
      print('🔐 Testing authentication...');
      
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No Firebase user logged in');
        return false;
      }
      
      final token = await user.getIdToken();
      if (token == null) {
        print('❌ Failed to get Firebase token');
        return false;
      }
      
      print('✅ Firebase token obtained');
      
      // Test protected endpoint
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/users/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        print('✅ Authentication working');
        return true;
      } else if (response.statusCode == 401) {
        print('❌ Authentication failed - token invalid');
        return false;
      } else {
        print('❌ Authentication test failed: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ Authentication test error: $e');
      return false;
    }
  }
  
  // Test 4: WebSocket Connection
  static Future<bool> testWebSocket() async {
    try {
      print('🌐 Testing WebSocket connection...');
      
      await WebSocketService.connect();
      
      // Wait for connection
      await Future.delayed(Duration(seconds: 3));
      
      if (WebSocketService.isConnected) {
        print('✅ WebSocket connected successfully');
        WebSocketService.disconnect();
        return true;
      } else {
        print('❌ WebSocket connection failed');
        return false;
      }
    } catch (e) {
      print('❌ WebSocket test error: $e');
      return false;
    }
  }
  
  // Run all tests
  static Future<void> runAllTests() async {
    print('\n🧪 FLUTTER INTEGRATION TEST SUITE');
    print('==================================');
    print('Testing backend: ${ApiConfig.baseUrl}');
    print('');
    
    final results = <String, bool>{};
    
    // Run tests
    results['Backend Health'] = await testBackendHealth();
    results['Public APIs'] = await testPublicAPIs();
    results['Authentication'] = await testAuthentication();
    results['WebSocket'] = await testWebSocket();
    
    // Show results
    print('\n📊 TEST RESULTS:');
    print('================');
    
    int passed = 0;
    results.forEach((testName, result) {
      final status = result ? '✅ PASS' : '❌ FAIL';
      print('$status $testName');
      if (result) passed++;
    });
    
    print('\n📈 SUMMARY: $passed/${results.length} tests passed');
    
    if (passed == results.length) {
      print('\n🎉 ALL TESTS PASSED!');
      print('✅ Your Flutter app is ready to use the backend!');
      print('🚀 You can now implement the UI and start building your chat app!');
    } else {
      print('\n⚠️  SOME TESTS FAILED');
      print('💡 Check the error messages above and fix the issues');
      print('📋 Common solutions:');
      print('   • Ensure you are logged in with Firebase');
      print('   • Check your internet connection');
      print('   • Verify the backend URLs are correct');
      print('   • Make sure the backend server is running');
    }
  }
}
```

### 2. How to Run the Test

Add this to your app's initialization:

```dart
// In your main app or a test screen
class TestScreen extends StatefulWidget {
  @override
  _TestScreenState createState() => _TestScreenState();
}

class _TestScreenState extends State<TestScreen> {
  bool _isRunningTest = false;
  
  void _runIntegrationTest() async {
    setState(() {
      _isRunningTest = true;
    });
    
    await IntegrationTest.runAllTests();
    
    setState(() {
      _isRunningTest = false;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Backend Integration Test')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Test your backend integration'),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isRunningTest ? null : _runIntegrationTest,
              child: _isRunningTest
                  ? CircularProgressIndicator()
                  : Text('Run Integration Test'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🚨 Troubleshooting Common Issues

### Issue 1: "Network Error" / Connection Refused
**Cause:** Backend server not accessible
**Solutions:**
- Check if your Render app is deployed and running
- Verify the `baseUrl` in `ApiConfig` is correct
- Test backend health: https://chat-backend-ehww.onrender.com/health

### Issue 2: "Authentication Failed" / 401 Errors
**Cause:** Firebase token issues
**Solutions:**
- Ensure user is logged in with Firebase
- Check Firebase configuration in your Flutter app
- Get fresh token: `await FirebaseAuth.instance.currentUser?.getIdToken(true)`
- Verify Firebase project settings match backend

### Issue 3: WebSocket Connection Fails
**Cause:** WebSocket authentication or network issues
**Solutions:**
- Ensure you have a valid Firebase token
- Check WebSocket URL: `wss://chat-backend-ehww.onrender.com`
- Add network permissions to Android/iOS
- Test WebSocket connection in browser console

### Issue 4: CORS Errors (Web only)
**Cause:** Cross-origin request blocked
**Solutions:**
- Backend already configured for CORS
- If testing locally, use device/emulator instead of web
- Check browser console for specific CORS error

### Issue 5: "Rate Limited" Errors
**Cause:** Too many requests
**Solutions:**
- Add delays between requests
- Implement exponential backoff
- Cache responses when possible

### Issue 6: File Upload Fails
**Cause:** File size or format issues
**Solutions:**
- Check file size (max 10MB)
- Ensure proper file permissions
- Use multipart/form-data format
- Verify auth token is included

---

## 📱 Ready-to-Use Flutter App Structure

```
lib/
├── config/
│   └── api_config.dart              # Backend URLs and configuration
├── models/
│   ├── user.dart                    # User data model
│   ├── community.dart               # Community data model
│   ├── message.dart                 # Message data model
│   └── notification.dart            # Notification data model
├── services/
│   ├── auth_service.dart            # Firebase authentication
│   ├── user_service.dart            # User API calls
│   ├── community_service.dart       # Community API calls
│   ├── message_service.dart         # Message API calls
│   ├── notification_service.dart    # Notification API calls
│   ├── upload_service.dart          # File upload API calls
│   └── websocket_service.dart       # Real-time messaging
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart        # Login with Firebase
│   │   └── register_screen.dart     # Registration
│   ├── communities/
│   │   ├── communities_screen.dart  # List all communities
│   │   ├── community_detail.dart    # Community details
│   │   └── create_community.dart    # Create new community
│   ├── chat/
│   │   ├── chat_screen.dart         # Community chat
│   │   └── private_chat.dart        # Private messaging
│   └── profile/
│       └── profile_screen.dart      # User profile
└── test/
    └── integration_test.dart         # Backend integration tests
```

---

## 🎯 Final Checklist

Before deploying your Flutter app:

### Backend Verification:
- [ ] ✅ Backend deployed on Render: https://chat-backend-ehww.onrender.com
- [ ] ✅ Health check works: https://chat-backend-ehww.onrender.com/health
- [ ] ✅ API documentation accessible: https://chat-backend-ehww.onrender.com/api-docs
- [ ] ✅ WebSocket connection working: wss://chat-backend-ehww.onrender.com

### Flutter App Setup:
- [ ] Firebase configuration added to Flutter app
- [ ] Network permissions added (Android/iOS)
- [ ] Socket.IO client dependency added
- [ ] API configuration updated with production URLs
- [ ] Error handling implemented for all API calls
- [ ] Integration tests pass

### Features Ready:
- [ ] User authentication with Firebase
- [ ] Community browsing and joining
- [ ] Real-time messaging
- [ ] File uploads
- [ ] Push notifications
- [ ] User profiles
- [ ] Community management

---

**🎉 Congratulations!** Your WhatsApp-like community chat backend is fully deployed and ready for Flutter integration. This guide provides everything you need to build a production-ready chat application!

Need help? Check the troubleshooting section or run the integration tests to identify any issues.
