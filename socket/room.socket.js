const logger = require("../utils/logger.util");
const { dealCards } = require("../utils/card.util");
const { roomService } = require("../services");
const { startGame, dealCardsToPlayers } = require("../controllers/room.controller");

// Store active countdown timers for rooms
const activeCountdowns = new Map();

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

  } catch (error) {
    logger.error(`Error in notifyUserLeftRoom: ${error.message}`);
  }
};

const notifyGameStarted = async (value) => {
  try {
    const { room, players } = value;
    const gameStartData = {
      room,
      players
    };
    // Notify all users in the room about game start
    emitToRoom(room.id, "collect_pot_amount", gameStartData);
    logger.info(`Game started in room ${room.id}`);
  } catch (error) {
    logger.error(`Error in notifyGameStarted: ${error.message}`);
  }
};

const startGameCountdown = async (roomId) => {
  try {
    // Clear any existing countdown for this room
    if (activeCountdowns.has(roomId)) {
      clearTimeout(activeCountdowns.get(roomId).timer);
      activeCountdowns.delete(roomId);
    }

    let countdown = 10;

    const countdownInterval = setInterval(async () => {
      countdown--;
      
      if (countdown > 0) {
        // Send countdown update - only room ID and countdown needed
        emitToRoom(roomId, "game_countdown_update", {
          room : {
            id : roomId,
          },
          countdown,
          message: `Game starting in ${countdown} seconds...`
        });
        logger.info(`Game countdown update for room ${roomId} - ${countdown} seconds remaining`);
      } else {
        // Countdown finished, start the game
        clearInterval(countdownInterval);
        activeCountdowns.delete(roomId);
        
        try {
          // Notify room that GAME STARTED
          emitToRoom(roomId, "game_started", {
            roomId,
            message: "Game started"
          });
          
          logger.info(`Game started successfully for room ${roomId}`);
          
          // Call startGame to collect pot amounts from players
          const mockReq = {
            body: { room_id: roomId }
          };
          const mockRes = {
            status: () => mockRes,
            json: () => mockRes
          };
          
          await startGame(mockReq, mockRes);
          logger.info(`Pot amounts collected successfully for room ${roomId}`);
          
          // After pot collection is complete, deal cards to all players
          await dealCardsToPlayers(roomId);
          
        } catch (gameStartError) {
          logger.error(`Failed to start game for room ${roomId}: ${gameStartError.message}`);
        }
      }
    }, 1000);

    // Store the countdown info
    activeCountdowns.set(roomId, {
      timer: countdownInterval,
      countdown,
    });

  } catch (error) {
    logger.error(`Error in startGameCountdown: ${error.message}`);
  }
};

const cancelGameCountdown = (roomId) => {
  try {
    if (activeCountdowns.has(roomId)) {
      const countdownInfo = activeCountdowns.get(roomId);
      clearTimeout(countdownInfo.timer);
      activeCountdowns.delete(roomId);
      
      logger.info(`Game countdown cancelled for room ${roomId}`);
    }
  } catch (error) {
    logger.error(`Error in cancelGameCountdown: ${error.message}`);
  }
};


const notifyWaitGame = async (value) => {
  try {
    const { room, players } = value;
    const waitData = {
      room,
      players,
      message: "Waiting for the game to start", 
    };

    // Notify all users in the room about wait for the game
    emitToRoom(room.id, "wait_for_game", waitData);
    logger.info(`Waiting for the game to start in room ${room.id}`);
  } catch (error) {
    logger.error(`Error in notifyWaitGame: ${error.message}`);
  }
};

const notifyDealCards = async (value) => {
  try {
    const { roomId, players } = value;
    const dealCardsData = {
      roomId,
      players,
      message: "Cards dealt successfully",
    };
    // Notify all users in the room about deal cards
    emitToRoom(roomId, "deal_cards", dealCardsData);
    logger.info(`Cards dealt successfully in room ${roomId}`);
  } catch (error) {
    logger.error(`Error in notifyDealCards: ${error.message}`);
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
    notifyGameStarted,
    emitToUser,
    emitToRoom,
    notifyWaitGame,
    startGameCountdown,
    cancelGameCountdown,
    notifyDealCards,
  };
};

module.exports = roomSocketHandler;
