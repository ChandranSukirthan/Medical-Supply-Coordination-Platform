const Request = require('../models/Request');
const { generateId } = require('../utils/helpers');

exports.createRequest = async (req, res) => {
  try {
    const { medicine, quantity, urgency, location, province, requiredBy } = req.body;
    if (!medicine || quantity <= 0 || !['LOW', 'MEDIUM', 'HIGH'].includes(urgency) || !requiredBy) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    const requestId = generateId('REQ');
    const newReq = await Request.create({ requestId, hospitalId: req.facility._id, medicine, quantity, urgency, location, province, requiredBy });
    res.status(201).json(newReq);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOpenRequests = async (req, res) => {
  try {
    const requests = await Request.find({ status: 'OPEN' }).populate('hospitalId', '-password');
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ hospitalId: req.facility._id });
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    if (req.body.quantity !== undefined && req.body.quantity <= 0) return res.status(400).json({ message: 'Invalid quantity' });
    if (req.body.urgency && !['LOW', 'MEDIUM', 'HIGH'].includes(req.body.urgency)) return res.status(400).json({ message: 'Invalid urgency' });
    
    const updated = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    request.status = 'CANCELLED';
    await request.save();
    res.json(request);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
