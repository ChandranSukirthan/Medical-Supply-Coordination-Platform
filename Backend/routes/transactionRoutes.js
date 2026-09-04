const express = require('express');
const router = express.Router();
const { getMyTransactions, getTransactionById, startTransaction, completeTransaction, cancelTransaction, createTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createTransaction); // For creation logic
router.get('/my', protect, getMyTransactions);
router.get('/:id', protect, getTransactionById);
router.patch('/:id/start', protect, startTransaction);
router.patch('/:id/complete', protect, completeTransaction);
router.patch('/:id/cancel', protect, cancelTransaction);

module.exports = router;
