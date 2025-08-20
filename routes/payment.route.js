const express = require('express');
const { createSingleImageUpload, multerErrorHandler } = require('../utils/multer.util');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

const uploadImage = createSingleImageUpload({
  uploadPath: 'payment',
  maxSize: 5 * 1024 * 1024
});

router.post('/upload', uploadImage, multerErrorHandler, paymentController.uploadImage);
router.get('/get-image', paymentController.getImage);

module.exports = router;
