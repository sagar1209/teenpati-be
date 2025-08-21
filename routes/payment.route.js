const express = require('express');
const { createSingleImageUpload, multerErrorHandler } = require('../utils/multer.util');
const { paymentController } = require('../controllers');
const { auth } = require('../middlewares/authentication.middleware');
const { isAdmin, isUser } = require('../middlewares/authorization.middleware');

const router = express.Router();

const uploadImage = createSingleImageUpload({
  uploadPath: 'payment',
  maxSize: 5 * 1024 * 1024
});

// Routes
router.post('/upload', auth, isAdmin, uploadImage, multerErrorHandler, paymentController.uploadImage);
router.get('/get-image', paymentController.getImage);
router.post('/deposit', auth, isUser, paymentController.deposit);
router.post('/withdraw', auth, isUser, paymentController.withdraw);
router.post('/approve-transaction/:id', auth, isAdmin, paymentController.approveTransaction);
router.post('/reject-transaction/:id', auth, isAdmin, paymentController.rejectTransaction);

router.get('/deposit-request', auth, isAdmin, paymentController.depositHistory);
router.get('/withdraw-request', auth, isAdmin, paymentController.withdrawHistory);

module.exports = router;
