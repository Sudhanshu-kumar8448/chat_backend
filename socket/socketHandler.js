const { Server } = require('socket.io');
const { verifySocketToken } = require('../middleware/auth');
const UserService = require('../services/userService');
const MessageService = require('../services/messageService');
const NotificationService = require('../services/notificationService');

class SocketHandler {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Configure this for production
        methods: ["GET", "POST"]
      }
    });

    this.connectedUsers = new Map(); // Map of userId -> socketId
    this.userRooms = new Map(); // Map of userId -> Set of room names

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(verifySocketToken);
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.uid}`);
      
      // Store user connection
      this.connectedUsers.set(socket.user.uid, socket.id);
      this.userRooms.set(socket.user.uid, new Set());

      // Update user status to online
      UserService.updateStatus(socket.user.uid, 'online').catch(console.error);

      // Join user to their personal room for private messages
      socket.join(`user:${socket.user.uid}`);

      // Handle joining communities
      socket.on('join_communities', async (data) => {
        try {
          const { communityIds } = data;
          
          for (const communityId of communityIds) {
            socket.join(`community:${communityId}`);
            this.userRooms.get(socket.user.uid).add(`community:${communityId}`);
          }

          socket.emit('joined_communities', { 
            success: true, 
            communityIds 
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle leaving communities
      socket.on('leave_community', (data) => {
        const { communityId } = data;
        socket.leave(`community:${communityId}`);
        this.userRooms.get(socket.user.uid).delete(`community:${communityId}`);
        
        socket.emit('left_community', { 
          success: true, 
          communityId 
        });
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const message = await MessageService.sendMessage(socket.user.uid, data);
          
          // Emit to appropriate room
          if (message.communityId) {
            // Community message
            this.io.to(`community:${message.communityId}`).emit('new_message', message);
          } else if (message.recipientId) {
            // Private message
            this.io.to(`user:${message.recipientId}`).emit('new_message', message);
            this.io.to(`user:${message.senderId}`).emit('new_message', message);
            
            // Send notification to recipient if online
            if (this.connectedUsers.has(message.recipientId)) {
              await NotificationService.notifyNewMessage(
                message.recipientId,
                socket.user.name,
                message.content.text
              );
            }
          }

          // Handle mentions
          if (message.mentions && message.mentions.length > 0) {
            for (const mention of message.mentions) {
              if (this.connectedUsers.has(mention.userId)) {
                const mentionSocket = this.io.sockets.sockets.get(
                  this.connectedUsers.get(mention.userId)
                );
                if (mentionSocket) {
                  mentionSocket.emit('mentioned', {
                    message,
                    mentionedBy: socket.user.name
                  });
                }

                // Create mention notification
                await NotificationService.notifyMention(
                  mention.userId,
                  socket.user.name,
                  message.content.text,
                  message.communityId
                );
              }
            }
          }

          socket.emit('message_sent', { 
            success: true, 
            messageId: message.messageId 
          });
        } catch (error) {
          socket.emit('message_error', { 
            success: false, 
            message: error.message 
          });
        }
      });

      // Handle message reactions
      socket.on('add_reaction', async (data) => {
        try {
          const { messageId, emoji } = data;
          const message = await MessageService.addReaction(messageId, socket.user.uid, emoji);
          
          // Emit reaction to all users in the same room
          if (message.communityId) {
            this.io.to(`community:${message.communityId}`).emit('reaction_added', {
              messageId,
              userId: socket.user.uid,
              emoji,
              reactions: message.reactions
            });
          } else {
            this.io.to(`user:${message.recipientId}`).emit('reaction_added', {
              messageId,
              userId: socket.user.uid,
              emoji,
              reactions: message.reactions
            });
            this.io.to(`user:${message.senderId}`).emit('reaction_added', {
              messageId,
              userId: socket.user.uid,
              emoji,
              reactions: message.reactions
            });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { communityId, recipientId } = data;
        
        if (communityId) {
          socket.to(`community:${communityId}`).emit('user_typing', {
            userId: socket.user.uid,
            userName: socket.user.name,
            communityId
          });
        } else if (recipientId) {
          socket.to(`user:${recipientId}`).emit('user_typing', {
            userId: socket.user.uid,
            userName: socket.user.name
          });
        }
      });

      socket.on('typing_stop', (data) => {
        const { communityId, recipientId } = data;
        
        if (communityId) {
          socket.to(`community:${communityId}`).emit('user_stopped_typing', {
            userId: socket.user.uid,
            communityId
          });
        } else if (recipientId) {
          socket.to(`user:${recipientId}`).emit('user_stopped_typing', {
            userId: socket.user.uid
          });
        }
      });

      // Handle status updates
      socket.on('update_status', async (data) => {
        try {
          const { status } = data;
          await UserService.updateStatus(socket.user.uid, status);
          
          // Broadcast status update to user's communities
          const userRooms = this.userRooms.get(socket.user.uid);
          if (userRooms) {
            userRooms.forEach(room => {
              socket.to(room).emit('user_status_changed', {
                userId: socket.user.uid,
                status
              });
            });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle marking messages as read
      socket.on('mark_read', async (data) => {
        try {
          const { messageId } = data;
          await MessageService.markAsRead(messageId, socket.user.uid);
          
          socket.emit('marked_read', { 
            success: true, 
            messageId 
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.user.uid}`);
        
        // Remove from connected users
        this.connectedUsers.delete(socket.user.uid);
        this.userRooms.delete(socket.user.uid);
        
        // Update user status to offline
        try {
          await UserService.updateStatus(socket.user.uid, 'offline');
        } catch (error) {
          console.error('Error updating user status on disconnect:', error);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('error', { message: 'An error occurred' });
      });
    });
  }

  // Helper method to get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Helper method to check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Helper method to send notification to user if online
  async sendNotificationToUser(userId, notification) {
    if (this.connectedUsers.has(userId)) {
      const socketId = this.connectedUsers.get(userId);
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('notification', notification);
      }
    }
  }
}

module.exports = SocketHandler;
