# Teen Patti Real-time System

This document explains how to use the real-time Socket.IO system that has been integrated into your Teen Patti backend.

## 🚀 Features

- **Real-time Room Management**: Players can join/leave rooms in real-time
- **Live Chat System**: In-game chat functionality
- **Game Action Broadcasting**: Real-time game actions (bet, fold, call, raise)
- **Player Status Updates**: Live updates when players join/leave rooms
- **Room State Synchronization**: Automatic room updates across all connected players

## 📁 New Files Added

1. **`socket/room.socket.js`** - Main Socket.IO handler for room management
2. **`public/test-client.html`** - Test client to demonstrate real-time functionality
3. **`README-REALTIME.md`** - This documentation file

## 🔧 Setup Instructions

### 1. Install Dependencies
Socket.IO is already included in your `package.json`. If you need to reinstall:
```bash
npm install
```

### 2. Start the Server
```bash
npm run dev
```

The server will now run with both HTTP and WebSocket support on your configured port.

### 3. Test the Real-time System
Open your browser and navigate to:
```
http://localhost:3000/test/test-client.html
```

## 🔌 Socket.IO Events

### Client to Server Events

#### `join_room`
Join a specific room
```javascript
socket.emit('join_room', { roomId: 123 });
```

#### `leave_room`
Leave the current room
```javascript
socket.emit('leave_room', { roomId: 123 });
```

#### `chat_message`
Send a chat message to the room
```javascript
socket.emit('chat_message', { 
  roomId: 123, 
  message: "Hello everyone!" 
});
```

#### `game_action`
Send a game action to other players
```javascript
socket.emit('game_action', { 
  roomId: 123, 
  action: "bet", 
  data: "100" 
});
```

### Server to Client Events

#### `room_joined`
Confirmation that you've joined a room
```javascript
socket.on('room_joined', (data) => {
  console.log('Joined room:', data.room);
});
```

#### `player_joined`
Notification when another player joins the room
```javascript
socket.on('player_joined', (data) => {
  console.log('Player joined:', data.player);
});
```

#### `player_left`
Notification when a player leaves the room
```javascript
socket.on('player_left', (data) => {
  console.log('Player left:', data.playerId);
});
```

#### `room_created`
Notification when a new room is created
```javascript
socket.on('room_created', (data) => {
  console.log('New room created:', data.room);
});
```

#### `room_updated`
Notification when room status changes
```javascript
socket.on('room_updated', (data) => {
  console.log('Room updated:', data.room);
});
```

#### `game_action`
Receive game actions from other players
```javascript
socket.on('game_action', (data) => {
  console.log('Game action:', data.action, data.data);
});
```

#### `chat_message`
Receive chat messages from other players
```javascript
socket.on('chat_message', (data) => {
  console.log(`${data.username}: ${data.message}`);
});
```

## 🔐 Authentication

The Socket.IO system uses JWT tokens for authentication. When connecting:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

## 📱 Frontend Integration Example

Here's a basic example of how to integrate with your frontend:

```javascript
import { io } from 'socket.io-client';

class TeenPattiGame {
  constructor(token) {
    this.socket = io('http://localhost:3000', {
      auth: { token }
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to game server');
    });
    
    // Room events
    this.socket.on('room_joined', (data) => {
      this.onRoomJoined(data);
    });
    
    this.socket.on('player_joined', (data) => {
      this.onPlayerJoined(data);
    });
    
    this.socket.on('player_left', (data) => {
      this.onPlayerLeft(data);
    });
    
    // Game events
    this.socket.on('game_action', (data) => {
      this.onGameAction(data);
    });
    
    // Chat events
    this.socket.on('chat_message', (data) => {
      this.onChatMessage(data);
    });
  }
  
  joinRoom(roomId) {
    this.socket.emit('join_room', { roomId });
  }
  
  leaveRoom(roomId) {
    this.socket.emit('leave_room', { roomId });
  }
  
  sendChatMessage(roomId, message) {
    this.socket.emit('chat_message', { roomId, message });
  }
  
  sendGameAction(roomId, action, data) {
    this.socket.emit('game_action', { roomId, action, data });
  }
  
  // Event handlers
  onRoomJoined(data) {
    console.log('Joined room:', data.room);
    // Update UI to show room
  }
  
  onPlayerJoined(data) {
    console.log('Player joined:', data.player);
    // Update player list
  }
  
  onPlayerLeft(data) {
    console.log('Player left:', data.playerId);
    // Update player list
  }
  
  onGameAction(data) {
    console.log('Game action:', data);
    // Handle game logic
  }
  
  onChatMessage(data) {
    console.log(`${data.username}: ${data.message}`);
    // Display chat message
  }
}

// Usage
const game = new TeenPattiGame('your-jwt-token');
game.joinRoom(123);
```

## 🎮 Game Actions

The system supports these basic game actions:

- **`bet`** - Place a bet
- **`fold`** - Fold the current hand
- **`call`** - Call the current bet
- **`raise`** - Raise the current bet

You can extend this system by adding more actions specific to Teen Patti rules.

## 🔄 Real-time Updates

The system automatically handles:

- **Room Creation**: When a room is created via API, all connected clients receive a `room_created` event
- **Room Updates**: When players join/leave, all clients receive `room_updated` events
- **Player Status**: Real-time player join/leave notifications
- **Game State**: Synchronized game actions across all players in a room

## 🧪 Testing

1. **Start the server**: `npm run dev`
2. **Open test client**: Navigate to `http://localhost:3000/test/test-client.html`
3. **Get a JWT token**: Use your login API to get a valid token
4. **Connect**: Enter the token and click "Connect to Socket"
5. **Join a room**: Enter a room ID and click "Join Room"
6. **Test features**: Try sending chat messages and game actions

## 🚧 Next Steps

This is the foundation for your real-time Teen Patti game. You can now:

1. **Add Game Logic**: Implement Teen Patti card dealing and game rules
2. **Add Player States**: Track player hands, bets, and game progress
3. **Add Room Management**: Implement game start/stop, round management
4. **Add Spectator Mode**: Allow users to watch games without playing
5. **Add Notifications**: Push notifications for game events

## 🔍 Troubleshooting

### Common Issues

1. **Connection Failed**: Check if the server is running and the port is correct
2. **Authentication Error**: Ensure your JWT token is valid and not expired
3. **Room Not Found**: Verify the room ID exists in your database
4. **Events Not Working**: Check browser console for JavaScript errors

### Debug Mode

Enable debug logging by adding this to your server:
```javascript
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  debug: true
});
```

## 📞 Support

If you encounter any issues or need help extending the system, check:

1. Socket.IO documentation: https://socket.io/docs/
2. Your server logs for error messages
3. Browser console for client-side errors

---

**Happy Gaming! 🎉**
