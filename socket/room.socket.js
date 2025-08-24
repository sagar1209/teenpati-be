const { roomService } = require("../services");
const { db } = require("../config/database");
const { User, Room, RoomUser } = require("../config/database");
const logger = require("../utils/logger.util");

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
      logger.error("Base socket handler not available");
    }
  } catch (error) {
    logger.error(`Error emitting to user: ${error.message}`);
  }
};

const emitToRoom = (roomId, event, data) => {
  try {
    if (global.io) {
      // Use Socket.IO's built-in room functionality
      console.log("emitToRoom", event);
      global.io.to(`room_${roomId}`).emit(event, data);
      logger.info(`Emitted ${event} to room ${roomId} using Socket.IO rooms`);
    } else {
      logger.error("Socket.IO instance not available");
    }
  } catch (error) {
    logger.error(`Error emitting to room: ${error.message}`);
  }
};

const notifyRoomCreated = async (value) => {
  try {
    const { room, players, creator } = value;

    // Get creator's socket from base socket handler
    if (global.socketHandlers && global.socketHandlers.base) {
      const creatorSocket = global.socketHandlers.base.getUserSocket(
        creator.id
      );
      if (creatorSocket) {
        // Automatically join the creator to Socket.IO room
        const roomName = `room_${room.id}`;
        creatorSocket.join(roomName);
        logger.info(
          `Room creator ${creator.email} automatically joined Socket.IO room: ${roomName}`
        );

        // Send confirmation to the creator
        creatorSocket.emit("room_joined_socket", {
          roomId: room.id,
          message: `Successfully joined Socket.IO room: ${roomName}`,
        });
      }
    }

    // Notify creator specifically
    emitToUser(creator.id, "room_created", {
      room,
      players,
      message: "Room created successfully",
    });

    logger.info(`Room ${room.id} created by ${creator.email}`);
  } catch (error) {
    logger.error(`Error in notifyRoomCreated: ${error.message}`);
  }
};

const notifyUserJoinedRoom = async (value) => {
  try {
    console.log("notifyUserJoinedRoom", value);
    const { room, players, user } = value;
    const joinData = {
      room,
      players,
      message: `${user.email} joined the room`,
    };

    // Get user's socket from base socket handler
    if (global.socketHandlers && global.socketHandlers.base) {
      const userSocket = global.socketHandlers.base.getUserSocket(user.id);
      if (userSocket) {
        // Automatically join the user to Socket.IO room
        const roomName = `room_${room.id}`;
        userSocket.join(roomName);
        logger.info(
          `User ${user.email} automatically joined Socket.IO room: ${roomName}`
        );

        // Send confirmation to the joining user
        userSocket.emit("room_joined_socket", {
          roomId: room.id,
          message: `Successfully joined Socket.IO room: ${roomName}`,
        });
      }
    }

    // Notify all users in the room about new player
    emitToRoom(room.id, "player_joined", joinData);
    logger.info(`User ${user.email} joined room ${room.id}`);
  } catch (error) {
    logger.error(`Error in notifyUserJoinedRoom: ${error.message}`);
  }
};

const notifyUserLeftRoom = async (value) => {
  try {
    const { room, players, user } = value;
    const leaveData = {
      room,
      players,
      message: `${user.email} has left the room`,
    };

    // Get user's socket from base socket handler
    if (global.socketHandlers && global.socketHandlers.base) {
      const userSocket = global.socketHandlers.base.getUserSocket(user.id);
      if (userSocket) {
        // Automatically leave the Socket.IO room
        const roomName = `room_${room.id}`;
        userSocket.leave(roomName);
        logger.info(
          `User ${user.email} automatically left Socket.IO room: ${roomName}`
        );
      }
    }

    // Notify remaining users in the room
    emitToRoom(room.id, "player_left", leaveData);

    // Notify the leaving user
    emitToUser(user.id, "room_left", {
      room,
      message: "Successfully left the room",
    });

    logger.info(`User ${user.email} left room ${room.id}`);
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

  logger.info("Room socket handler initialized - NO automatic connections");

  // Return room-specific utility functions
  return {
    // Real-time notification functions
    notifyRoomCreated,
    notifyUserJoinedRoom,
    notifyUserLeftRoom,
    emitToUser,
    emitToRoom,
  };
};

module.exports = roomSocketHandler;
