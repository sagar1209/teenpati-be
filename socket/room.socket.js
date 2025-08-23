const { roomService } = require('../services');
const { db } = require('../config/database');
const { User, Room, RoomUser } = require('../config/database');
const logger = require('../utils/logger.util');

/**
 * Emit real-time update to specific user
 * @param {number} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  try {
    // Get user socket from base socket handler
    if (global.socketHandlers && global.socketHandlers.base) {
      const userSocket = global.socketHandlers.base.getUserSocket(userId);
      if (userSocket) {
        userSocket.emit(event, data);
        logger.info(`Emitted ${event} to user ${userId}`);
      } else {
        logger.warn(`User ${userId} not connected to socket`);
      }
    } else {
      logger.error('Base socket handler not available');
    }
  } catch (error) {
    logger.error(`Error emitting to user: ${error.message}`);
  }
};

/**
 * Emit real-time update to all users in a specific room using Socket.IO rooms
 * @param {number} roomId - Room ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToRoom = (roomId, event, data) => {
  try {
    if (global.io) {
      // Use Socket.IO's built-in room functionality
      global.io.to(`room_${roomId}`).emit(event, data);
      logger.info(`Emitted ${event} to room ${roomId} using Socket.IO rooms`);
    } else {
      logger.error('Socket.IO instance not available');
    }
  } catch (error) {
    logger.error(`Error emitting to room: ${error.message}`);
  }
};

/**
 * Notify when a room is created
 * @param {object} room - Room object
 * @param {object} creator - User who created the room
 */
const notifyRoomCreated = async (room, creator) => {
  try {
    const roomData = {
      id: room.id,
      type: room.type,
      current_players: room.current_players,
      max_players: room.max_players,
      pot_amount: room.pot_amount,
      created_by: creator.id,
      creator_username: creator.email,
      created_at: room.createdAt
    };
    
    // Get creator's socket from base socket handler
    if (global.socketHandlers && global.socketHandlers.base) {
      const creatorSocket = global.socketHandlers.base.getUserSocket(creator.id);
      if (creatorSocket) {
        // Automatically join the creator to Socket.IO room
        const roomName = `room_${room.id}`;
        creatorSocket.join(roomName);
        logger.info(`Room creator ${creator.email} automatically joined Socket.IO room: ${roomName}`);
        
        // Send confirmation to the creator
        creatorSocket.emit('room_joined_socket', {
          roomId: room.id,
          message: `Successfully joined Socket.IO room: ${roomName}`
        });
      }
    }
    
    // Notify creator specifically
    emitToUser(creator.id, 'room_created_success', {
      ...roomData,
      message: 'Room created successfully'
    });
    
    logger.info(`Room ${room.id} created by ${creator.email}`);
  } catch (error) {
    logger.error(`Error in notifyRoomCreated: ${error.message}`);
  }
};

/**
 * Notify when a user joins a room
 * @param {number} roomId - Room ID
 * @param {object} user - User joining
 * @param {object} room - Room object
 */
const notifyUserJoinedRoom = async (roomId, user, room) => {
  try {
    const joinData = {
      roomId,
      player: {
        id: user.id,
        username: user.email
      },
      room: {
        id: room.id,
        type: room.type,
        current_players: room.current_players,
        max_players: room.max_players,
        pot_amount: room.pot_amount
      },
      message: `${user.email} joined the room`
    };
    
    // Get user's socket from base socket handler
    if (global.socketHandlers && global.socketHandlers.base) {
      const userSocket = global.socketHandlers.base.getUserSocket(user.id);
      if (userSocket) {
        // Automatically join the user to Socket.IO room
        const roomName = `room_${roomId}`;
        userSocket.join(roomName);
        logger.info(`User ${user.email} automatically joined Socket.IO room: ${roomName}`);
        
        // Send confirmation to the joining user
        userSocket.emit('room_joined_socket', {
          roomId,
          message: `Successfully joined Socket.IO room: ${roomName}`
        });
      }
    }
    
    // Notify all users in the room about new player
    emitToRoom(roomId, 'player_joined', joinData);
    
    // Notify the joining user
    emitToUser(user.id, 'room_joined', {
      roomId,
      room: joinData.room,
      message: 'Successfully joined the room'
    });
    
    logger.info(`User ${user.email} joined room ${roomId}`);
  } catch (error) {
    logger.error(`Error in notifyUserJoinedRoom: ${error.message}`);
  }
};

/**
 * Notify when a user leaves a room
 * @param {number} roomId - Room ID
 * @param {object} user - User leaving
 * @param {object} room - Room object
 */
const notifyUserLeftRoom = async (roomId, user, room) => {
  try {
    const leaveData = {
      roomId,
      playerId: user.id,
      username: user.email,
      message: `${user.email} has left the room`,
      room: {
        id: room.id,
        type: room.type,
        current_players: room.current_players,
        max_players: room.max_players,
        pot_amount: room.pot_amount
      }
    };
    
    // Get user's socket from base socket handler
    if (global.socketHandlers && global.socketHandlers.base) {
      const userSocket = global.socketHandlers.base.getUserSocket(user.id);
      if (userSocket) {
        // Automatically leave the Socket.IO room
        const roomName = `room_${roomId}`;
        userSocket.leave(roomName);
        logger.info(`User ${user.email} automatically left Socket.IO room: ${roomName}`);
        
        // Send confirmation to the leaving user
        userSocket.emit('room_left_socket', {
          roomId,
          message: `Successfully left Socket.IO room: ${roomName}`
        });
      }
    }
    
    // Notify remaining users in the room
    emitToRoom(roomId, 'player_left', leaveData);
    
    // Notify the leaving user
    emitToUser(user.id, 'room_left', {
      roomId,
      message: 'Successfully left the room'
    });
    
    logger.info(`User ${user.email} left room ${roomId}`);
  } catch (error) {
    logger.error(`Error in notifyUserLeftRoom: ${error.message}`);
  }
};

const roomSocketHandler = (io) => {
  // Store io instance globally for use in utility functions
  global.io = io;
  
  // IMPORTANT: NO automatic connection handling here
  // Users are only connected to base socket when they authenticate
  // Room socket handler is only for utility functions, not for connections
  
  logger.info('Room socket handler initialized - NO automatic connections');
  
  // Return room-specific utility functions
  return {
    // Real-time notification functions
    notifyRoomCreated,
    notifyUserJoinedRoom,
    notifyUserLeftRoom,
    emitToUser,
    emitToRoom
  };
};

module.exports = roomSocketHandler;
