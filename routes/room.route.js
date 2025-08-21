const express = require('express');
const { roomController } = require('../controllers');
const { auth } = require('../middlewares/authentication.middleware');
const { isAdmin, isUser } = require('../middlewares/authorization.middleware');

const router = express.Router();

// Room creation and joining routes
router.post('/create-private-room', auth, isUser, roomController.createPrivateRoom);
router.post('/public-room', auth, isUser, roomController.createPublicRoom);
router.post('/join-private-room', auth, isUser, roomController.joinPrivateRoom);

// Room management routes
router.post('/leave-room', auth, isUser, roomController.leaveRoom);

module.exports = router;
