const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String, // Firebase UID
    required: true,
    ref: 'User'
  },
  reportedUserId: {
    type: String, // Firebase UID
    ref: 'User'
  },
  messageId: {
    type: String,
    ref: 'Message'
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  },
  type: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: String, // Firebase UID
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  action: {
    type: String,
    enum: ['none', 'warning', 'temporary_ban', 'permanent_ban', 'content_removed'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
