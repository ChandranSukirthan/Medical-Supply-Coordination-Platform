const Request = require('../models/Request');
const Stock = require('../models/Stock');
const aiAdapter = require('../utils/aiAdapter');

exports.getRecommendationsForRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Fetch available stocks for this medicine
    const availableStocks = await Stock.find({ medicine: request.medicine, status: 'AVAILABLE', quantity: { $gt: 0 }, expiryDate: { $gt: new Date() } }).populate('hospitalId');
    
    // Map to AI contract format
    const requestData = {
      id: request._id,
      medicine: request.medicine,
      quantity: request.quantity,
      urgency: request.urgency,
      location: request.location
    };
    const stocksData = availableStocks.map(s => ({
      stockId: s.stockId,
      hospitalId: s.hospitalId._id,
      hospitalName: s.hospitalId.hospitalName,
      location: s.hospitalId.location,
      quantity: s.quantity,
      expiryDate: s.expiryDate
    }));
    
    const recommendations = await aiAdapter.recommendSuppliers(requestData, stocksData);
    res.json(recommendations);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRecommendationsForStock = async (req, res) => {
  try {
    res.json({ message: 'Not implemented for stock recommendations yet, as primary flow is request->supplier' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
