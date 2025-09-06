const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Community Chat Backend API',
      version: '1.0.0',
      description: `
        A comprehensive real-time community chat backend server with features like:
        
        ## Features
        - **User Management**: Firebase authentication, user profiles, status updates
        - **Community Management**: Create/join communities, member management, admin controls
        - **Real-time Messaging**: WebSocket-based chat with mentions, replies, reactions
        - **Private Chat**: Direct messaging between users
        - **File Sharing**: Upload and share images, documents, audio, and video files
        - **Notifications**: Real-time notifications for mentions, replies, and messages
        - **Moderation**: Reporting system, user blocking, admin controls
        - **Search**: Search users, communities, and messages
        
        ## Authentication
        All endpoints require Firebase authentication token in the Authorization header:
        \`Authorization: Bearer <firebase-token>\`
        
        ## WebSocket Events
        The server supports real-time communication via Socket.IO with the following events:
        - \`send_message\`: Send a new message
        - \`join_communities\`: Join community rooms
        - \`typing_start/stop\`: Typing indicators
        - \`add_reaction\`: Add emoji reactions
        - \`update_status\`: Update user online status
        
        ## Rate Limiting
        API endpoints are rate limited:
        - General API: 100 requests per 15 minutes
        - Message sending: 30 messages per minute
        - Community creation: 5 communities per hour
        - File uploads: 20 uploads per 15 minutes
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://your-production-domain.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase Authentication Token'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid or expired token'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Validation error'
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                          example: 'name'
                        },
                        message: {
                          type: 'string',
                          example: 'Name is required'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Too many requests, please try again later'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User management and profile operations'
      },
      {
        name: 'Communities',
        description: 'Community creation, management, and membership'
      },
      {
        name: 'Messages',
        description: 'Messaging functionality including sending, editing, and reactions'
      },
      {
        name: 'Notifications',
        description: 'User notifications and real-time updates'
      },
      {
        name: 'File Upload',
        description: 'File upload and media sharing'
      },
      {
        name: 'Reports',
        description: 'Reporting and moderation system'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = specs;
