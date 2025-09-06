require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

// Import configurations and middleware
const connectDB = require('./config/database');
const { initializeFirebase } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');
const swaggerSpecs = require('./docs/swagger');
const SocketHandler = require('./socket/socketHandler');

// Import routes
const userRoutes = require('./routes/users');
const communityRoutes = require('./routes/communities');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const reportRoutes = require('./routes/reports');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Firebase Admin SDK
initializeFirebase();

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
const socketHandler = new SocketHandler(server);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`,
        'https://your-flutter-web-app.com', // Add your Flutter web app domain
        /\.onrender\.com$/ // Allow all Render subdomains
      ]
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Community Chat Backend Server is running!',
    timestamp: new Date().toISOString(),
    connectedUsers: socketHandler.getConnectedUsersCount(),
    version: '1.0.0'
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Community Chat API Documentation'
}));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);

// Serve static files for uploads
app.use('/uploads', express.static(process.env.UPLOAD_PATH || './uploads'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: [
      'GET /health - Health check',
      'GET /api-docs - API documentation',
      'POST /api/users/profile - User profile',
      'GET /api/communities - Get communities',
      'POST /api/messages - Send message',
      'GET /api/notifications - Get notifications',
      'POST /api/upload - Upload file',
      'POST /api/reports - Create report'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(error.keyPattern)[0]
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`
🚀 Community Chat Backend Server Started Successfully!

📊 Server Information:
   • Port: ${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • MongoDB: ${process.env.MONGODB_URI ? '✅ Connected' : '❌ Not configured'}
   • Firebase: ${process.env.FIREBASE_PROJECT_ID ? '✅ Configured' : '❌ Not configured'}

📚 API Documentation: ${process.env.NODE_ENV === 'production' ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `http://localhost:${PORT}`}/api-docs
🔍 Health Check: ${process.env.NODE_ENV === 'production' ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `http://localhost:${PORT}`}/health
🌐 WebSocket: ${process.env.NODE_ENV === 'production' ? `wss://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `ws://localhost:${PORT}`}

📡 Available Endpoints:
   • Users: /api/users
   • Communities: /api/communities  
   • Messages: /api/messages
   • Notifications: /api/notifications
   • File Upload: /api/upload
   • Reports: /api/reports

🎯 Real-time Features:
   • WebSocket connections: Active
   • Message broadcasting: Enabled
   • Typing indicators: Enabled
   • Online status: Enabled
   • Notifications: Enabled

Ready to accept connections! 🎉
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
