const baseSocketHandler = require('./base.socket');
const roomSocketHandler = require('./room.socket');

const initializeSocketHandlers = (io) => {
  // Initialize base socket handler (handles authentication, common events)
  const baseHandler = baseSocketHandler(io);
  
  // Initialize room socket handler (handles room-specific notifications)
  const roomHandler = roomSocketHandler(io);
  
  // Store handlers globally for access from other parts of the application
  global.socketHandlers = {
    base: baseHandler,
    room: roomHandler
  };
  
  return {
    base: baseHandler,
    room: roomHandler
  };
};

module.exports = initializeSocketHandlers;
