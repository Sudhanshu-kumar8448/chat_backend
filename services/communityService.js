const Community = require('../models/Community');
const User = require('../models/User');
const Message = require('../models/Message');

class CommunityService {
  // Create new community
  static async createCommunity(creatorUid, communityData) {
    try {
      const community = new Community({
        ...communityData,
        creator: creatorUid,
        admins: [creatorUid],
        members: [{
          userId: creatorUid,
          role: 'admin',
          joinedAt: new Date()
        }]
      });

      await community.save();

      // Add community to user's communities list
      await User.findOneAndUpdate(
        { firebaseUid: creatorUid },
        { $addToSet: { communities: community._id } }
      );

      return await this.getCommunityById(community._id, creatorUid);
    } catch (error) {
      throw new Error(`Error creating community: ${error.message}`);
    }
  }

  // Get community by ID
  static async getCommunityById(communityId, userUid) {
    try {
      const community = await Community.findById(communityId);

      if (!community || !community.isActive) {
        throw new Error('Community not found');
      }

      // Check if user is a member
      const isMember = community.members.some(member => member.userId === userUid);
      if (community.isPrivate && !isMember) {
        throw new Error('Access denied to private community');
      }

      // Manually populate member information
      const populatedMembers = await Promise.all(
        community.members.map(async (member) => {
          const user = await User.findOne({ firebaseUid: member.userId })
            .select('displayName photoURL status');
          
          return {
            ...member.toObject(),
            userId: user ? {
              firebaseUid: member.userId,
              displayName: user.displayName,
              photoURL: user.photoURL,
              status: user.status
            } : {
              firebaseUid: member.userId,
              displayName: 'Unknown User',
              photoURL: null,
              status: 'offline'
            }
          };
        })
      );

      // Also populate creator information
      const creator = await User.findOne({ firebaseUid: community.creator })
        .select('displayName photoURL');

      return {
        ...community.toObject(),
        members: populatedMembers,
        creator: creator ? {
          firebaseUid: community.creator,
          displayName: creator.displayName,
          photoURL: creator.photoURL
        } : {
          firebaseUid: community.creator,
          displayName: 'Unknown User',
          photoURL: null
        }
      };
    } catch (error) {
      throw new Error(`Error getting community: ${error.message}`);
    }
  }

  // Get user's communities
  static async getUserCommunities(userUid) {
    try {
      const communities = await Community.find({
        'members.userId': userUid,
        isActive: true
      })
      .select('name description image memberCount lastActivity isPrivate')
      .sort({ lastActivity: -1 });

      return communities;
    } catch (error) {
      throw new Error(`Error getting user communities: ${error.message}`);
    }
  }

  // Search communities
  static async searchCommunities(query, userUid, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const communities = await Community.find({
        $and: [
          { isActive: true },
          { isPrivate: false }, // Only show public communities in search
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { tags: { $in: [new RegExp(query, 'i')] } }
            ]
          }
        ]
      })
      .select('name description image memberCount tags lastActivity')
      .sort({ memberCount: -1, lastActivity: -1 })
      .skip(skip)
      .limit(limit);

      return communities;
    } catch (error) {
      throw new Error(`Error searching communities: ${error.message}`);
    }
  }

  // Join community
  static async joinCommunity(communityId, userUid) {
    try {
      const community = await Community.findById(communityId);
      
      if (!community || !community.isActive) {
        throw new Error('Community not found');
      }

      // Check if already a member
      const isMember = community.members.some(member => member.userId === userUid);
      if (isMember) {
        throw new Error('Already a member of this community');
      }

      // Add member
      community.members.push({
        userId: userUid,
        role: 'member',
        joinedAt: new Date()
      });

      community.lastActivity = new Date();
      await community.save();

      // Add community to user's communities list
      await User.findOneAndUpdate(
        { firebaseUid: userUid },
        { $addToSet: { communities: community._id } }
      );

      return await this.getCommunityById(communityId, userUid);
    } catch (error) {
      throw new Error(`Error joining community: ${error.message}`);
    }
  }

  // Leave community
  static async leaveCommunity(communityId, userUid) {
    try {
      const community = await Community.findById(communityId);
      
      if (!community) {
        throw new Error('Community not found');
      }

      // Check if user is the creator
      if (community.creator === userUid) {
        throw new Error('Creator cannot leave community. Transfer ownership first.');
      }

      // Remove member
      community.members = community.members.filter(member => member.userId !== userUid);
      community.admins = community.admins.filter(admin => admin !== userUid);
      community.lastActivity = new Date();
      
      await community.save();

      // Remove community from user's communities list
      await User.findOneAndUpdate(
        { firebaseUid: userUid },
        { $pull: { communities: community._id } }
      );

      return { success: true, message: 'Left community successfully' };
    } catch (error) {
      throw new Error(`Error leaving community: ${error.message}`);
    }
  }

  // Update community
  static async updateCommunity(communityId, userUid, updateData) {
    try {
      const community = await Community.findById(communityId);
      
      if (!community) {
        throw new Error('Community not found');
      }

      // Check if user is admin
      if (!community.admins.includes(userUid)) {
        throw new Error('Only admins can update community');
      }

      Object.assign(community, updateData);
      community.lastActivity = new Date();
      
      await community.save();
      return await this.getCommunityById(communityId, userUid);
    } catch (error) {
      throw new Error(`Error updating community: ${error.message}`);
    }
  }

  // Manage member role
  static async updateMemberRole(communityId, adminUid, targetUserId, newRole) {
    try {
      const community = await Community.findById(communityId);
      
      if (!community) {
        throw new Error('Community not found');
      }

      // Check if user is admin
      if (!community.admins.includes(adminUid)) {
        throw new Error('Only admins can manage member roles');
      }

      // Find and update member
      const member = community.members.find(m => m.userId === targetUserId);
      if (!member) {
        throw new Error('User is not a member of this community');
      }

      member.role = newRole;

      // Update admins array if role is admin
      if (newRole === 'admin') {
        if (!community.admins.includes(targetUserId)) {
          community.admins.push(targetUserId);
        }
      } else {
        community.admins = community.admins.filter(admin => admin !== targetUserId);
      }

      community.lastActivity = new Date();
      await community.save();

      return await this.getCommunityById(communityId, adminUid);
    } catch (error) {
      throw new Error(`Error updating member role: ${error.message}`);
    }
  }

  // Remove member
  static async removeMember(communityId, adminUid, targetUserId) {
    try {
      const community = await Community.findById(communityId);
      
      if (!community) {
        throw new Error('Community not found');
      }

      // Check if user is admin
      if (!community.admins.includes(adminUid)) {
        throw new Error('Only admins can remove members');
      }

      // Cannot remove creator
      if (community.creator === targetUserId) {
        throw new Error('Cannot remove community creator');
      }

      // Remove member
      community.members = community.members.filter(member => member.userId !== targetUserId);
      community.admins = community.admins.filter(admin => admin !== targetUserId);
      community.lastActivity = new Date();
      
      await community.save();

      // Remove community from user's communities list
      await User.findOneAndUpdate(
        { firebaseUid: targetUserId },
        { $pull: { communities: community._id } }
      );

      return { success: true, message: 'Member removed successfully' };
    } catch (error) {
      throw new Error(`Error removing member: ${error.message}`);
    }
  }

  // Get public communities (non-private communities)
  static async getPublicCommunities() {
    try {
      const communities = await Community.find({
        isPrivate: false,
        isActive: true
      })
      .select('_id name description image tags memberCount createdAt creator')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to prevent performance issues

      // Manually populate creator information using Firebase UID
      const populatedCommunities = await Promise.all(
        communities.map(async (community) => {
          const creator = await User.findOne({ firebaseUid: community.creator })
            .select('displayName photoURL');
          
          return {
            ...community.toObject(),
            creator: creator ? {
              _id: creator._id,
              displayName: creator.displayName,
              photoURL: creator.photoURL
            } : null
          };
        })
      );

      return populatedCommunities;
    } catch (error) {
      throw new Error(`Error fetching public communities: ${error.message}`);
    }
  }
}

module.exports = CommunityService;
