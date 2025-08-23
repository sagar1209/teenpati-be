const jwt = require('jsonwebtoken');
const { ENV_VARIABLE } = require('../constants/envVariable.constant');
const { authService } = require('../services');
const logger = require('../utils/logger.util');
const { auth } = require('../middlewares/authentication.middleware');
const { db } = require('../config/database');
const { Role } = db;

// Store active socket connections globally
const globalActiveConnections = new Map(); // userId -> socket

/**
 * Authenticate socket connection using existing auth middleware pattern
 * @param {string} token - JWT token from client
 * @returns {object|null} - User object or null if invalid
 */
const authenticateSocket = async (token) => {
  try {
    if (!token) {
      logger.error('No token provided for socket authentication');
      return null;
    }

    // Verify JWT token (same as auth middleware)
    let decoded;
    try {
      decoded = jwt.verify(token, ENV_VARIABLE.JWT_SECRET);
    } catch (error) {
      logger.error(`Invalid token for socket: ${error.message}`);
      return null;
    }

    // Get user details with role information (same as auth middleware)
    const foundUser = await authService.findUser({
      where: { id: decoded.userId },
      attributes: ['id', 'email', 'role_id', 'balance'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name'],
        },
      ],
    });

    if (!foundUser) {
      logger.error(`User not found for ID: ${decoded.userId}`);
      return null;
    }

    return foundUser;
  } catch (error) {
    logger.error(`Socket authentication error: ${error.message}`);
    return null;
  }
};

/**
 * Base socket handler with common functionality
 * @param {object} io - Socket.IO server instance
 * @returns {object} - Base socket handler with utility functions
 */
const baseSocketHandler = (io) => {
  // Global middleware for all socket connections
  io.use(async (socket, next) => {
    try {
      logger.info(`Socket attempting connection: ${socket.id}`);
      
      // Extract token from auth or headers (same as auth middleware)
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        logger.error(`No token provided for socket: ${socket.id}`);
        return next(new Error('Authentication token required'));
      }
      
      logger.info(`Token received for socket: ${socket.id}, attempting verification...`);
      
      // Use the same authentication logic as auth middleware
      const user = await authenticateSocket(token);
      if (!user) {
        logger.error(`Authentication failed for socket: ${socket.id}`);
        return next(new Error('Authentication failed'));
      }
      
      // Attach user info to socket (same structure as auth middleware)
      socket.userId = user.id;
      socket.user = user;
      socket.userRole = user.role_id;
      
      // Store in global connections
      globalActiveConnections.set(user.id, socket);
      
      logger.info(`Base socket authenticated successfully: ${socket.id} for user: ${user.email}`);
      next();
    } catch (error) {
      logger.error(`Socket authentication error for ${socket.id}: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  });

  // Handle base connection events
  io.on('connection', (socket) => {
    logger.info(`Base socket connected: ${socket.id} for user: ${socket.user.email}`);
    
    // Handle basic ping/pong for connection testing
    socket.on('ping', (data) => {
      try {
        logger.info(`Ping received from ${socket.user.email}: ${JSON.stringify(data)}`);
        socket.emit('pong', {
          message: 'Pong from server!',
          timestamp: new Date().toISOString(),
          echo: data,
          userId: socket.userId,
          username: socket.user.email
        });
      } catch (error) {
        logger.error(`Error handling ping: ${error.message}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      try {
        logger.info(`Base socket disconnected: ${socket.id} for user: ${socket.user.email}, reason: ${reason}`);
        
        // Remove from global connections
        globalActiveConnections.delete(socket.userId);
        
        // Socket.IO automatically handles room cleanup when user disconnects
        logger.info(`User ${socket.user.email} disconnected - Socket.IO will handle room cleanup automatically`);
      } catch (error) {
        logger.error(`Error handling disconnect: ${error.message}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}: ${error.message}`);
    });
  });

  // Return utility functions
  return {
    // Get all active connections
    getAllConnections: () => globalActiveConnections,
    
    // Get connection count
    getConnectionCount: () => globalActiveConnections.size,
    
    // Get user's socket by ID
    getUserSocket: (userId) => globalActiveConnections.get(userId),
    
    // Check if user is online
    isUserOnline: (userId) => globalActiveConnections.has(userId),
    
    // Emit to specific user
    emitToUser: (userId, event, data) => {
      const userSocket = globalActiveConnections.get(userId);
      if (userSocket) {
        userSocket.emit(event, data);
      }
    },
    
    // Emit to all users
    emitToAll: (event, data) => {
      io.emit(event, data);
    }
  };
};

module.exports = baseSocketHandler;
