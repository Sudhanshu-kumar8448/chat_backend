const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  image: {
    type: String,
    default: null
  },
  creator: {
    type: String, // Firebase UID
    required: true,
    ref: 'User'
  },
  admins: [{
    type: String, // Firebase UID
    ref: 'User'
  }],
  members: [{
    userId: {
      type: String, // Firebase UID
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'moderator'],
      default: 'member'
    }
  }],
  tags: [{
    type: String,
    lowercase: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  memberCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    messageRetentionDays: {
      type: Number,
      default: 365
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
communitySchema.index({ name: 'text', description: 'text', tags: 'text' });
communitySchema.index({ creator: 1 });
communitySchema.index({ 'members.userId': 1 });
communitySchema.index({ tags: 1 });
communitySchema.index({ lastActivity: -1 });

// Update member count before saving
communitySchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  next();
});

module.exports = mongoose.model('Community', communitySchema);
