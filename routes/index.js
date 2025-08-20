const authRoutes = require('./auth.route');
const paymentRoutes = require('./payment.route');

const express = require('express');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;