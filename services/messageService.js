const Message = require('../models/Message');
const Community = require('../models/Community');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class MessageService {
  // Send message
  static async sendMessage(senderUid, messageData) {
    try {
      const { content, communityId, recipientId, mentions, replyTo, priority } = messageData;

      // Validate message recipients
      if (communityId && recipientId) {
        throw new Error('Message cannot have both community and recipient');
      }

      if (!communityId && !recipientId) {
        throw new Error('Message must have either community or recipient');
      }

      // If community message, check membership
      if (communityId) {
        const community = await Community.findById(communityId);
        if (!community || !community.isActive) {
          throw new Error('Community not found');
        }

        const isMember = community.members.some(member => member.userId === senderUid);
        if (!isMember) {
          throw new Error('Not a member of this community');
        }

        // Update community last activity
        community.lastActivity = new Date();
        await community.save();
      }

      // If private message, check if users exist and not blocked
      if (recipientId) {
        const recipient = await User.findOne({ firebaseUid: recipientId });
        if (!recipient || !recipient.isActive) {
          throw new Error('Recipient not found');
        }

        // Check if recipient has blocked sender
        if (recipient.blockedUsers.includes(senderUid)) {
          throw new Error('Cannot send message to this user');
        }
      }

      // Handle reply
      let replyData = null;
      if (replyTo) {
        const originalMessage = await Message.findOne({ messageId: replyTo });
        if (originalMessage) {
          replyData = {
            messageId: replyTo,
            senderId: originalMessage.senderId,
            preview: originalMessage.content.text.substring(0, 100)
          };
        }
      }

      // Process mentions
      const processedMentions = [];
      if (mentions && mentions.length > 0) {
        for (const mentionedUid of mentions) {
          const mentionedUser = await User.findOne({ firebaseUid: mentionedUid });
          if (mentionedUser) {
            processedMentions.push({
              userId: mentionedUid,
              displayName: mentionedUser.displayName
            });
          }
        }
      }

      // Create message
      const message = new Message({
        messageId: uuidv4(),
        senderId: senderUid,
        communityId: communityId || null,
        recipientId: recipientId || null,
        content,
        mentions: processedMentions,
        replyTo: replyData,
        priority: priority || 'normal'
      });

      await message.save();

      // Populate sender info
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'firebaseUid displayName photoURL', 'User');

      return populatedMessage;
    } catch (error) {
      throw new Error(`Error sending message: ${error.message}`);
    }
  }

  // Get messages for community or private chat
  static async getMessages(userUid, { communityId, recipientId, page = 1, limit = 50 }) {
    try {
      const skip = (page - 1) * limit;
      let query = { isDeleted: false };

      if (communityId) {
        // Check community membership
        const community = await Community.findById(communityId);
        if (!community || !community.isActive) {
          throw new Error('Community not found');
        }

        const isMember = community.members.some(member => member.userId === userUid);
        if (!isMember) {
          throw new Error('Not a member of this community');
        }

        query.communityId = communityId;
      } else if (recipientId) {
        // Private chat messages
        query.$or = [
          { senderId: userUid, recipientId },
          { senderId: recipientId, recipientId: userUid }
        ];
      } else {
        throw new Error('Either communityId or recipientId is required');
      }

      const messages = await Message.find(query)
        .populate('senderId', 'firebaseUid displayName photoURL', 'User')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      throw new Error(`Error getting messages: ${error.message}`);
    }
  }

  // Edit message
  static async editMessage(messageId, userUid, newContent) {
    try {
      const message = await Message.findOne({ messageId });

      if (!message || message.isDeleted) {
        throw new Error('Message not found');
      }

      if (message.senderId !== userUid) {
        throw new Error('Only message sender can edit');
      }

      // Store original content for audit
      if (!message.edited.isEdited) {
        message.edited.originalContent = message.content.text;
      }

      message.content.text = newContent.text;
      message.edited.isEdited = true;
      message.edited.editedAt = new Date();

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'firebaseUid displayName photoURL', 'User');

      return populatedMessage;
    } catch (error) {
      throw new Error(`Error editing message: ${error.message}`);
    }
  }

  // Delete message
  static async deleteMessage(messageId, userUid) {
    try {
      const message = await Message.findOne({ messageId });

      if (!message || message.isDeleted) {
        throw new Error('Message not found');
      }

      // Check if user can delete (sender or community admin)
      let canDelete = message.senderId === userUid;

      if (!canDelete && message.communityId) {
        const community = await Community.findById(message.communityId);
        if (community && community.admins.includes(userUid)) {
          canDelete = true;
        }
      }

      if (!canDelete) {
        throw new Error('Not authorized to delete this message');
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      return { success: true, message: 'Message deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting message: ${error.message}`);
    }
  }

  // Add reaction to message
  static async addReaction(messageId, userUid, emoji) {
    try {
      const message = await Message.findOne({ messageId });

      if (!message || message.isDeleted) {
        throw new Error('Message not found');
      }

      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(reaction => reaction.userId !== userUid);

      // Add new reaction
      message.reactions.push({
        userId: userUid,
        emoji,
        timestamp: new Date()
      });

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'firebaseUid displayName photoURL', 'User');

      return populatedMessage;
    } catch (error) {
      throw new Error(`Error adding reaction: ${error.message}`);
    }
  }

  // Remove reaction from message
  static async removeReaction(messageId, userUid) {
    try {
      const message = await Message.findOne({ messageId });

      if (!message || message.isDeleted) {
        throw new Error('Message not found');
      }

      message.reactions = message.reactions.filter(reaction => reaction.userId !== userUid);
      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'firebaseUid displayName photoURL', 'User');

      return populatedMessage;
    } catch (error) {
      throw new Error(`Error removing reaction: ${error.message}`);
    }
  }

  // Mark message as read
  static async markAsRead(messageId, userUid) {
    try {
      const message = await Message.findOne({ messageId });

      if (!message || message.isDeleted) {
        throw new Error('Message not found');
      }

      // Check if already read by this user
      const existingRead = message.readBy.find(read => read.userId === userUid);
      if (!existingRead) {
        message.readBy.push({
          userId: userUid,
          readAt: new Date()
        });
        await message.save();
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Error marking message as read: ${error.message}`);
    }
  }

  // Search messages
  static async searchMessages(userUid, { query, communityId, page = 1, limit = 20 }) {
    try {
      const skip = (page - 1) * limit;
      let searchQuery = {
        isDeleted: false,
        'content.text': { $regex: query, $options: 'i' }
      };

      if (communityId) {
        // Check community membership
        const community = await Community.findById(communityId);
        if (!community || !community.isActive) {
          throw new Error('Community not found');
        }

        const isMember = community.members.some(member => member.userId === userUid);
        if (!isMember) {
          throw new Error('Not a member of this community');
        }

        searchQuery.communityId = communityId;
      } else {
        // Search in user's accessible messages (communities + private chats)
        const userCommunities = await Community.find({
          'members.userId': userUid,
          isActive: true
        }).select('_id');

        const communityIds = userCommunities.map(c => c._id);

        searchQuery.$or = [
          { communityId: { $in: communityIds } },
          { senderId: userUid },
          { recipientId: userUid }
        ];
      }

      const messages = await Message.find(searchQuery)
        .populate('senderId', 'firebaseUid displayName photoURL', 'User')
        .populate('communityId', 'name', 'Community')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return messages;
    } catch (error) {
      throw new Error(`Error searching messages: ${error.message}`);
    }
  }
}

module.exports = MessageService;
