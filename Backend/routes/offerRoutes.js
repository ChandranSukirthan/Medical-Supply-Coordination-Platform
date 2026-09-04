const express = require('express');
const router = express.Router();
const { createOffer, getMyOffers, getOffersForRequest, acceptOffer, rejectOffer, cancelOffer } = require('../controllers/offerController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createOffer);
router.get('/my', protect, getMyOffers);
router.get('/requests/:requestId/offers', protect, getOffersForRequest);
router.patch('/:id/accept', protect, acceptOffer);
router.patch('/:id/reject', protect, rejectOffer);
router.patch('/:id/cancel', protect, cancelOffer);

module.exports = router;
