const express = require('express');
const { roomController } = require('../controllers');
const { auth } = require('../middlewares/authentication.middleware');
const { isAdmin, isUser } = require('../middlewares/authorization.middleware');

const router = express.Router();

// Room creation and joining routes
router.post('/create-private-room', auth, isUser, roomController.createPrivateRoom);
router.post('/public-room', auth, isUser, roomController.createPublicRoom);
router.post('/join-private-room', auth, isUser, roomController.joinPrivateRoom);

// Game management routes
router.post('/start-game', auth, isUser, roomController.startGame);

// Room management routes
router.get('/get-all', auth, isAdmin, roomController.getAllRooms);
router.get('/:id', auth, roomController.getRoomById);
router.post('/leave-room', auth, isUser, roomController.leaveRoom);

module.exports = router;
