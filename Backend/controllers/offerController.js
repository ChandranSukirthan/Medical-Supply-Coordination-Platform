const Offer = require('../models/Offer');
const Request = require('../models/Request');
const { generateId } = require('../utils/helpers');

exports.createOffer = async (req, res) => {
  try {
    const { requestId, quantity } = req.body;
    const request = await Request.findById(requestId);
    if (!request || request.status !== 'OPEN') return res.status(400).json({ message: 'Invalid or closed request' });
    if (quantity <= 0) return res.status(400).json({ message: 'Invalid quantity' });
    
    const offerId = generateId('OFF');
    const offer = await Offer.create({ offerId, requestId, supplierId: req.facility._id, quantity });
    res.status(201).json(offer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ supplierId: req.facility._id }).populate('requestId');
    res.json(offers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOffersForRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    const offers = await Offer.find({ requestId: req.params.requestId }).populate('supplierId', '-password');
    res.json(offers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.acceptOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('requestId');
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.requestId.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    if (offer.status !== 'PENDING') return res.status(400).json({ message: 'Offer is not pending' });
    
    offer.status = 'ACCEPTED';
    await offer.save();
    res.json(offer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.rejectOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('requestId');
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.requestId.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    offer.status = 'REJECTED';
    await offer.save();
    res.json(offer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.cancelOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.supplierId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    offer.status = 'CANCELLED';
    await offer.save();
    res.json(offer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
