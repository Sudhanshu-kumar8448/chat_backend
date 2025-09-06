const Notification = require('../models/Notification');

class NotificationService {
  // Create notification
  static async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data
      });

      await notification.save();
      return notification;
    } catch (error) {
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ userId })
        .populate('data.communityId', 'name image', 'Community')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return notifications;
    } catch (error) {
      throw new Error(`Error getting notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ userId, isRead: false });
      return { unreadCount: count };
    } catch (error) {
      throw new Error(`Error getting unread count: ${error.message}`);
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return { success: true, message: 'Notification deleted' };
    } catch (error) {
      throw new Error(`Error deleting notification: ${error.message}`);
    }
  }

  // Helper methods for specific notification types
  static async notifyMention(mentionedUserId, senderName, messageContent, communityId = null) {
    return this.createNotification(
      mentionedUserId,
      'mention',
      'You were mentioned',
      `${senderName} mentioned you: ${messageContent.substring(0, 100)}`,
      { communityId, senderName }
    );
  }

  static async notifyReply(recipientUserId, senderName, messageContent, communityId = null) {
    return this.createNotification(
      recipientUserId,
      'reply',
      'New reply',
      `${senderName} replied to your message: ${messageContent.substring(0, 100)}`,
      { communityId, senderName }
    );
  }

  static async notifyNewMessage(recipientUserId, senderName, messageContent) {
    return this.createNotification(
      recipientUserId,
      'message',
      'New message',
      `${senderName}: ${messageContent.substring(0, 100)}`,
      { senderName }
    );
  }

  static async notifyCommunityJoin(communityMembers, newMemberName, communityId) {
    const promises = communityMembers.map(memberId =>
      this.createNotification(
        memberId,
        'community_join',
        'New member joined',
        `${newMemberName} joined the community`,
        { communityId, newMemberName }
      )
    );
    
    return Promise.all(promises);
  }
}

module.exports = NotificationService;
