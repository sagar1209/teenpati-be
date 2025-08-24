const express = require('express');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/database.js');
const { ENV_VARIABLE } = require('./constants/envVariable.constant');
const router = require('./routes');
const logger = require('./utils/logger.util.js');
const cors = require('cors');
const apiLogger = require('./middlewares/apiLogger.middleware');
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Configure this based on your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'], // Enable both WebSocket and polling
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());

app.use(express.json());
app.use(
  session({
    secret: ENV_VARIABLE.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(apiLogger);
app.use('/api/images', express.static('./images'));

// Serve test client HTML file
app.get('/test/test-client.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-client.html'));
});

app.use('/api', router);



// Initialize Socket.IO handlers
const initializeSocketHandlers = require('./socket');
const socketHandlers = initializeSocketHandlers(io);

// Make socket handlers available globally for controllers
global.socketHandlers = socketHandlers;

logger.info('Socket.IO handlers initialized successfully');

const PORT = ENV_VARIABLE.PORT; 

httpServer.listen(PORT, async () => {
  try {
    await connectDB();
    logger.info('server is running on port:' + PORT + ` ::URL:: http://localhost:${PORT}`);
    logger.info('Socket.IO server is ready for real-time connections');
  } catch (error) {
    logger.error('Error connecting to the database: ', error);
    process.exit(1);
  }
});


