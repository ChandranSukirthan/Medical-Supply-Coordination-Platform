const express = require('express');
const router = express.Router();
const { getRecommendationsForRequest, getRecommendationsForStock } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

router.get('/requests/:requestId', protect, getRecommendationsForRequest);
router.get('/stock/:stockId', protect, getRecommendationsForStock);

module.exports = router;
