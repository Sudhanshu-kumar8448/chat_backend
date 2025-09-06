const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  photoURL: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'online',
    enum: ['online', 'offline', 'away', 'busy']
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  communities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  blockedUsers: [{
    type: String, // Firebase UID
    ref: 'User'
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 });
userSchema.index({ displayName: 'text' });

module.exports = mongoose.model('User', userSchema);
