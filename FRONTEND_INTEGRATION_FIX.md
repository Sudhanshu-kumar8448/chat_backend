# 📋 Frontend-Backend Integration Guide

## 🔄 **Message API Response Format**

### **Standardized Message Object Structure**

All message endpoints now return a consistent format with `sender` field:

```json
{
  "_id": "66dc5a8f123abc456def7890",
  "messageId": "uuid-message-id",
  "sender": {
    "_id": "66dc5a8f123abc456def1234",
    "firebaseUid": "dNXbNRSTuMV3m31P3W5w6cdfqTc2",
    "displayName": "chintu@gmail.com",
    "photoURL": "https://example.com/photo.jpg"
  },
  "communityId": "66dc5a8f123abc456def5678",
  "recipientId": null,
  "content": {
    "text": "Hello everyone! 👋",
    "type": "text",
    "fileUrl": null,
    "fileName": null,
    "fileSize": null
  },
  "mentions": [],
  "replyTo": null,
  "reactions": [],
  "readBy": [],
  "edited": {
    "isEdited": false,
    "editedAt": null,
    "originalContent": null
  },
  "priority": "normal",
  "isDeleted": false,
  "createdAt": "2025-09-07T10:30:00.000Z",
  "updatedAt": "2025-09-07T10:30:00.000Z"
}
```

## 🎯 **Frontend Integration Solutions**

### **Issue 1: Backend Response Parsing** ✅ FIXED
**Problem**: Frontend accessing `json['sender']` but backend returning `json['senderId']`

**Solution**: Backend now standardized to always return `sender` object:
```dart
// ✅ This will now work in Flutter
final senderName = messageJson['sender']['displayName'];
final senderPhoto = messageJson['sender']['photoURL'];
final senderUid = messageJson['sender']['firebaseUid'];
```

### **Issue 2: Local State Updates**
**Problem**: Messages not added to local state after successful API calls

**Frontend Solution**:
```dart
// After successful message send
final response = await apiService.sendMessage(messageData);
if (response['success']) {
  final newMessage = Message.fromJson(response['data']);
  
  // Add to local state immediately
  setState(() {
    _messages.add(newMessage);
    _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
  });
  
  // Clear text input
  _messageController.clear();
  
  // Scroll to bottom
  _scrollToBottom();
}
```

### **Issue 3: UI Message Filtering**
**Problem**: Chat screen showing all messages instead of filtering for current community

**Frontend Solution**:
```dart
// Filter messages for current community
List<Message> get communityMessages {
  return _allMessages.where((message) {
    return message.communityId == widget.communityId;
  }).toList();
}

// In your chat screen build method
ListView.builder(
  itemCount: communityMessages.length,
  itemBuilder: (context, index) {
    final message = communityMessages[index];
    return MessageWidget(message: message);
  },
)
```

## 📝 **Complete Flutter Integration Example**

### **Message Service (Updated)**
```dart
class MessageService {
  static const String baseUrl = 'https://chat-backend-ehww.onrender.com/api';
  
  // Send message to community
  static Future<Map<String, dynamic>> sendMessage({
    required String communityId,
    required String text,
    String type = 'text',
  }) async {
    final token = await ApiService.getFirebaseToken();
    
    final response = await http.post(
      Uri.parse('$baseUrl/messages'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'content': {
          'text': text,
          'type': type,
        },
        'communityId': communityId,
      }),
    );
    
    return jsonDecode(response.body);
  }
  
  // Get messages for community
  static Future<List<Message>> getCommunityMessages({
    required String communityId,
    int page = 1,
    int limit = 50,
  }) async {
    final token = await ApiService.getFirebaseToken();
    
    final response = await http.get(
      Uri.parse('$baseUrl/messages?communityId=$communityId&page=$page&limit=$limit'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    
    final data = jsonDecode(response.body);
    if (data['success']) {
      return (data['data'] as List)
          .map((json) => Message.fromJson(json))
          .toList();
    }
    
    throw Exception(data['message']);
  }
}
```

### **Message Model (Updated)**
```dart
class Message {
  final String id;
  final String messageId;
  final User sender; // ✅ Now using 'sender' instead of 'senderId'
  final String? communityId;
  final String? recipientId;
  final MessageContent content;
  final List<Mention> mentions;
  final ReplyInfo? replyTo;
  final List<Reaction> reactions;
  final EditInfo edited;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Message({
    required this.id,
    required this.messageId,
    required this.sender,
    this.communityId,
    this.recipientId,
    required this.content,
    this.mentions = const [],
    this.replyTo,
    this.reactions = const [],
    required this.edited,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'],
      messageId: json['messageId'],
      sender: User.fromJson(json['sender']), // ✅ Using 'sender' field
      communityId: json['communityId'],
      recipientId: json['recipientId'],
      content: MessageContent.fromJson(json['content']),
      mentions: (json['mentions'] as List?)
          ?.map((m) => Mention.fromJson(m))
          .toList() ?? [],
      replyTo: json['replyTo'] != null ? ReplyInfo.fromJson(json['replyTo']) : null,
      reactions: (json['reactions'] as List?)
          ?.map((r) => Reaction.fromJson(r))
          .toList() ?? [],
      edited: EditInfo.fromJson(json['edited']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}
```

### **Chat Screen (Updated)**
```dart
class ChatScreen extends StatefulWidget {
  final String communityId;
  final String communityName;
  
  ChatScreen({required this.communityId, required this.communityName});
  
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Message> _messages = [];
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadMessages();
  }
  
  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    
    try {
      final messages = await MessageService.getCommunityMessages(
        communityId: widget.communityId,
      );
      
      setState(() {
        _messages = messages;
        _isLoading = false;
      });
      
      _scrollToBottom();
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load messages: $e')),
      );
    }
  }
  
  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    try {
      final response = await MessageService.sendMessage(
        communityId: widget.communityId,
        text: text,
      );
      
      if (response['success']) {
        final newMessage = Message.fromJson(response['data']);
        
        setState(() {
          _messages.add(newMessage);
          _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        });
        
        _messageController.clear();
        _scrollToBottom();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    }
  }
  
  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.communityName),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadMessages,
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return MessageBubble(message: message);
                    },
                  ),
          ),
          // Message input
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                SizedBox(width: 8),
                IconButton(
                  onPressed: _sendMessage,
                  icon: Icon(Icons.send),
                  color: Colors.blue,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

## 🎉 **Summary of Fixes**

### ✅ **Backend Changes Applied:**
1. **Standardized Response Format**: All message endpoints now return `sender` instead of `senderId`
2. **Consistent Transformation**: Added helper methods to ensure uniform response structure
3. **ObjectId Mapping**: Proper Firebase UID → MongoDB ObjectId conversion

### 📱 **Frontend Changes Needed:**
1. **Update Message Model**: Use `sender` field instead of `senderId`
2. **Add Local State Updates**: Immediately add messages to local state after API success
3. **Implement Message Filtering**: Filter messages by `communityId` in chat screens
4. **Add Error Handling**: Proper error handling for failed API calls

### 🚀 **Ready for Testing:**
The backend is now deployed with all fixes. Update your Flutter app with the above changes and test:
1. Create communities ✅
2. Send messages ✅
3. Real-time chat functionality ✅
4. Proper message filtering ✅

**All ObjectId casting errors are resolved and response format is standardized!** 🎉
