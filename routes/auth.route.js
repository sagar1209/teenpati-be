const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { auth } = require('../middlewares/authentication.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);


router.get('/profile', auth, authController.getProfile);
router.patch('/profile', auth, authController.updateProfile);
router.patch('/change-password', auth, authController.changePassword);

module.exports = router;
