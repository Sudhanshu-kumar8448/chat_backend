const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['message', 'mention', 'reply', 'community_invite', 'community_join', 'reaction'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    messageId: {
      type: String,
      ref: 'Message'
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    },
    senderId: {
      type: String, // Firebase UID
      ref: 'User'
    },
    senderName: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
