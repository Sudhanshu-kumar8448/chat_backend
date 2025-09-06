const User = require('../models/User');

class UserService {
  // Get or create user from Firebase UID
  static async getOrCreateUser(firebaseUser) {
    try {
      let user = await User.findOne({ firebaseUid: firebaseUser.uid });
      
      if (!user) {
        // Create new user if doesn't exist
        user = new User({
          firebaseUid: firebaseUser.uid,
          displayName: firebaseUser.name || firebaseUser.email,
          email: firebaseUser.email,
          photoURL: firebaseUser.picture || null
        });
        await user.save();
      } else {
        // Update user info if exists
        user.displayName = firebaseUser.name || user.displayName;
        user.email = firebaseUser.email;
        user.photoURL = firebaseUser.picture || user.photoURL;
        user.lastSeen = new Date();
        await user.save();
      }
      
      return user;
    } catch (error) {
      throw new Error(`Error getting or creating user: ${error.message}`);
    }
  }

  // Update user profile
  static async updateProfile(firebaseUid, updateData) {
    try {
      const user = await User.findOneAndUpdate(
        { firebaseUid },
        { ...updateData, lastSeen: new Date() },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

  // Get user by Firebase UID
  static async getUserByUid(firebaseUid) {
    try {
      const user = await User.findOne({ firebaseUid }).populate('communities', 'name description image');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error getting user: ${error.message}`);
    }
  }

  // Search users
  static async searchUsers(query, currentUserUid, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const users = await User.find({
        $and: [
          { firebaseUid: { $ne: currentUserUid } },
          { isActive: true },
          {
            $or: [
              { displayName: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      })
      .select('firebaseUid displayName email photoURL status bio')
      .skip(skip)
      .limit(limit);

      return users;
    } catch (error) {
      throw new Error(`Error searching users: ${error.message}`);
    }
  }

  // Block/Unblock user
  static async toggleBlockUser(currentUserUid, targetUserUid) {
    try {
      const user = await User.findOne({ firebaseUid: currentUserUid });
      
      if (!user) {
        throw new Error('User not found');
      }

      const isBlocked = user.blockedUsers.includes(targetUserUid);
      
      if (isBlocked) {
        user.blockedUsers = user.blockedUsers.filter(uid => uid !== targetUserUid);
      } else {
        user.blockedUsers.push(targetUserUid);
      }

      await user.save();
      return { blocked: !isBlocked };
    } catch (error) {
      throw new Error(`Error toggling block user: ${error.message}`);
    }
  }

  // Update user status
  static async updateStatus(firebaseUid, status) {
    try {
      const user = await User.findOneAndUpdate(
        { firebaseUid },
        { status, lastSeen: new Date() },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Error updating user status: ${error.message}`);
    }
  }

  // Get public user information (without sensitive data)
  static async getPublicUsers() {
    try {
      const users = await User.find({})
        .select('_id displayName photoURL status lastSeen')
        .sort({ lastSeen: -1 })
        .limit(100); // Limit to prevent performance issues

      return users;
    } catch (error) {
      throw new Error(`Error fetching public users: ${error.message}`);
    }
  }
}

module.exports = UserService;
