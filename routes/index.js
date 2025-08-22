const authRoutes = require('./auth.route');
const paymentRoutes = require('./payment.route');
const roomRoutes = require('./room.route');
const userRoutes = require('./user.route');
const express = require('express');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/payment', paymentRoutes);
router.use('/room', roomRoutes);
router.use('/user', userRoutes);

module.exports = router;