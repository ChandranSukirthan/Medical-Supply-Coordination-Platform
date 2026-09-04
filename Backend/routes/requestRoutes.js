const express = require('express');
const router = express.Router();
const { createRequest, getOpenRequests, getMyRequests, getRequestById, updateRequest, cancelRequest } = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createRequest);
router.get('/open', protect, getOpenRequests);
router.get('/my', protect, getMyRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id', protect, updateRequest);
router.patch('/:id/cancel', protect, cancelRequest);

module.exports = router;
