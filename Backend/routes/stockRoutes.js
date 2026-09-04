const express = require('express');
const router = express.Router();
const { createStock, getMyStock, getAvailableStock, getStockById, updateStock, updateStockStatus, deleteStock } = require('../controllers/stockController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createStock);
router.get('/my', protect, getMyStock);
router.get('/available', protect, getAvailableStock);
router.get('/:id', protect, getStockById);
router.put('/:id', protect, updateStock);
router.patch('/:id/status', protect, updateStockStatus);
router.delete('/:id', protect, deleteStock);

module.exports = router;
