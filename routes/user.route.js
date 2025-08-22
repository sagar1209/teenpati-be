const express = require('express');
const router = express.Router();
const { userController, paymentController } = require('../controllers');
const { auth } = require('../middlewares/authentication.middleware');
const { isAdmin, isUser } = require('../middlewares/authorization.middleware');

router.get('/get-all', auth, isAdmin, userController.getAllUsers);
router.get('/:id/get-all-transactions', auth, isAdmin, paymentController.getAllTransactionsByUserId);

module.exports = router;
