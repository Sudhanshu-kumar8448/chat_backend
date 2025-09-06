const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  senderId: {
    type: String, // Firebase UID
    required: true,
    ref: 'User'
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null // null for private messages
  },
  recipientId: {
    type: String, // Firebase UID for private messages
    ref: 'User',
    default: null
  },
  content: {
    text: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video'],
      default: 'text'
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: null
    }
  },
  mentions: [{
    userId: {
      type: String, // Firebase UID
      ref: 'User'
    },
    displayName: String
  }],
  replyTo: {
    messageId: {
      type: String,
      ref: 'Message'
    },
    senderId: {
      type: String,
      ref: 'User'
    },
    preview: String // First 100 chars of original message
  },
  reactions: [{
    userId: {
      type: String, // Firebase UID
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    userId: {
      type: String, // Firebase UID
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    originalContent: {
      type: String,
      default: null
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ communityId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ 'mentions.userId': 1 });
messageSchema.index({ messageId: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
