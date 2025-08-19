const authRoutes = require('./auth.route');

const express = require('express');

const router = express.Router();

router.use('/auth', authRoutes);

module.exports = router;