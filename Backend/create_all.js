const fs = require('fs');
const path = require('path');

const files = {};

const mkdirs = [
  'models', 'controllers', 'routes', 'middleware', 'utils', 'scripts', 'tests', 'docs'
];
mkdirs.forEach(dir => fs.mkdirSync(path.join(__dirname, dir), { recursive: true }));

// server.js
files['server.js'] = `const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const stockRoutes = require('./routes/stockRoutes');
const requestRoutes = require('./routes/requestRoutes');
const offerRoutes = require('./routes/offerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_supply';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
    }
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

module.exports = app;
`;

// models/Facility.js
files['models/Facility.js'] = `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facilitySchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  hospitalName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  province: { type: String, required: true }
}, { timestamps: true });

facilitySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

facilitySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Facility', facilitySchema);
`;

// models/Stock.js
files['models/Stock.js'] = `const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stockId: { type: String, required: true, unique: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  medicine: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['AVAILABLE', 'UNAVAILABLE'], default: 'AVAILABLE' }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
`;

// models/Request.js
files['models/Request.js'] = `const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  medicine: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  urgency: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  location: { type: String, required: true },
  province: { type: String, required: true },
  requiredBy: { type: Date, required: true },
  status: { type: String, enum: ['OPEN', 'CANCELLED', 'FULFILLED'], default: 'OPEN' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
`;

// models/Offer.js
files['models/Offer.js'] = `const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerId: { type: String, required: true, unique: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
`;

// models/Transaction.js
files['models/Transaction.js'] = `const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  medicine: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
`;

// middleware/auth.js
files['middleware/auth.js'] = `const jwt = require('jsonwebtoken');
const Facility = require('../models/Facility');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.facility = await Facility.findById(decoded.id).select('-password');
      if (!req.facility) {
        return res.status(401).json({ message: 'Not authorized, facility not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
module.exports = { protect };
`;

// controllers/authController.js
files['controllers/authController.js'] = `const Facility = require('../models/Facility');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

exports.registerFacility = async (req, res) => {
  try {
    const { hospitalId, hospitalName, email, password, location, province } = req.body;
    const exists = await Facility.findOne({ $or: [{ hospitalId }, { email }] });
    if (exists) return res.status(400).json({ message: 'Hospital already registered (duplicate ID or email)' });
    
    const facility = await Facility.create({ hospitalId, hospitalName, email, password, location, province });
    res.status(201).json({
      _id: facility._id, hospitalId: facility.hospitalId, hospitalName: facility.hospitalName, email: facility.email, location: facility.location, province: facility.province, token: generateToken(facility._id)
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.loginFacility = async (req, res) => {
  try {
    const { hospitalId, password } = req.body;
    const facility = await Facility.findOne({ hospitalId });
    if (facility && (await facility.comparePassword(password))) {
      res.json({
        _id: facility._id, hospitalId: facility.hospitalId, hospitalName: facility.hospitalName, email: facility.email, location: facility.location, province: facility.province, token: generateToken(facility._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid hospital ID or password' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};
`;

// routes/authRoutes.js
files['routes/authRoutes.js'] = `const express = require('express');
const router = express.Router();
const { registerFacility, loginFacility } = require('../controllers/authController');

router.post('/register', registerFacility);
router.post('/login', loginFacility);

module.exports = router;
`;

// controllers/healthController.js
files['controllers/healthController.js'] = `exports.getHealth = (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
};
`;

// routes/healthRoutes.js
files['routes/healthRoutes.js'] = `const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/healthController');

router.get('/', getHealth);

module.exports = router;
`;

// controllers/stockController.js
files['controllers/stockController.js'] = `const Stock = require('../models/Stock');
const { generateId } = require('../utils/helpers');

exports.createStock = async (req, res) => {
  try {
    const { medicine, quantity, expiryDate, status } = req.body;
    if (quantity < 0) return res.status(400).json({ message: 'Negative stock not allowed' });
    if (!medicine || !expiryDate) return res.status(400).json({ message: 'Invalid medicine or date' });
    const stockId = generateId('STK');
    const stock = await Stock.create({ stockId, hospitalId: req.facility._id, medicine, quantity, expiryDate, status });
    res.status(201).json(stock);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyStock = async (req, res) => {
  try {
    const stocks = await Stock.find({ hospitalId: req.facility._id });
    res.json(stocks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAvailableStock = async (req, res) => {
  try {
    const stocks = await Stock.find({ status: 'AVAILABLE', quantity: { $gt: 0 }, expiryDate: { $gt: new Date() } }).populate('hospitalId', '-password');
    res.json(stocks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    if (stock.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized to modify this stock' });
    const { quantity } = req.body;
    if (quantity !== undefined && quantity < 0) return res.status(400).json({ message: 'Negative stock not allowed' });
    const updated = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStockStatus = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    if (stock.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    const { status } = req.body;
    if (!['AVAILABLE', 'UNAVAILABLE'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    stock.status = status;
    await stock.save();
    res.json(stock);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    if (stock.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stock deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
`;

// routes/stockRoutes.js
files['routes/stockRoutes.js'] = `const express = require('express');
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
`;

// controllers/requestController.js
files['controllers/requestController.js'] = `const Request = require('../models/Request');
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
`;

// routes/requestRoutes.js
files['routes/requestRoutes.js'] = `const express = require('express');
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
`;

// controllers/offerController.js
files['controllers/offerController.js'] = `const Offer = require('../models/Offer');
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
`;

// routes/offerRoutes.js
files['routes/offerRoutes.js'] = `const express = require('express');
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
`;

// controllers/transactionController.js
files['controllers/transactionController.js'] = `const Transaction = require('../models/Transaction');
const Offer = require('../models/Offer');
const Request = require('../models/Request');
const Stock = require('../models/Stock');
const { generateId } = require('../utils/helpers');

exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ senderId: req.facility._id }, { receiverId: req.facility._id }]
    });
    res.json(transactions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTransactionById = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.senderId.toString() !== req.facility._id.toString() && tx.receiverId.toString() !== req.facility._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(tx);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Creating a transaction is an internal logical step after offer is accepted, but let's make an endpoint if React needs to trigger it
exports.createTransaction = async (req, res) => {
  try {
    const { offerId } = req.body;
    const offer = await Offer.findById(offerId).populate('requestId');
    if (!offer || offer.status !== 'ACCEPTED') return res.status(400).json({ message: 'Valid accepted offer required' });
    
    // The receiver is the request's hospital, sender is the offer's supplier
    const txId = generateId('TXN');
    const tx = await Transaction.create({
      transactionId: txId,
      offerId: offer._id,
      requestId: offer.requestId._id,
      senderId: offer.supplierId,
      receiverId: offer.requestId.hospitalId,
      medicine: offer.requestId.medicine,
      quantity: offer.quantity
    });
    res.status(201).json(tx);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.startTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.senderId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Only sender can start transaction' });
    if (tx.status !== 'PENDING') return res.status(400).json({ message: 'Invalid state transition' });
    
    tx.status = 'IN_TRANSIT';
    await tx.save();
    res.json(tx);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.completeTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.receiverId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Only receiver can complete' });
    if (tx.status !== 'IN_TRANSIT') return res.status(400).json({ message: 'Invalid state transition' });
    
    // Decrement sender stock
    const stocks = await Stock.find({ hospitalId: tx.senderId, medicine: tx.medicine, status: 'AVAILABLE', quantity: { $gte: 1 } }).sort('expiryDate');
    let qtyToDeduct = tx.quantity;
    for (const st of stocks) {
      if (qtyToDeduct <= 0) break;
      if (st.quantity >= qtyToDeduct) {
        st.quantity -= qtyToDeduct;
        qtyToDeduct = 0;
        await st.save();
      } else {
        qtyToDeduct -= st.quantity;
        st.quantity = 0;
        await st.save();
      }
    }
    if (qtyToDeduct > 0) {
      return res.status(400).json({ message: 'Insufficient stock available in sender inventory' });
    }
    
    // Fulfill Request
    const reqDoc = await Request.findById(tx.requestId);
    if (reqDoc) {
      reqDoc.status = 'FULFILLED';
      await reqDoc.save();
    }
    
    tx.status = 'COMPLETED';
    await tx.save();
    res.json(tx);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.cancelTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.senderId.toString() !== req.facility._id.toString() && tx.receiverId.toString() !== req.facility._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (tx.status === 'COMPLETED' || tx.status === 'CANCELLED') return res.status(400).json({ message: 'Invalid state transition' });
    
    tx.status = 'CANCELLED';
    await tx.save();
    res.json(tx);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
`;

// routes/transactionRoutes.js
files['routes/transactionRoutes.js'] = `const express = require('express');
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
`;

// utils/helpers.js
files['utils/helpers.js'] = `exports.generateId = (prefix) => {
  return prefix + Math.floor(1000 + Math.random() * 9000).toString() + Date.now().toString().slice(-4);
};
`;

// utils/aiAdapter.js
files['utils/aiAdapter.js'] = `const axios = require('axios');

exports.recommendSuppliers = async (requestData, availableStocks) => {
  // Try to reach Python Service
  try {
    const response = await axios.post(process.env.PYTHON_AI_URL || 'http://localhost:8000/api/v1/recommend/suppliers', {
      request: requestData,
      stocks: availableStocks
    }, { timeout: 3000 });
    return response.data.recommendations;
  } catch (error) {
    // Fallback logic if AI is unavailable or timeout
    console.log("AI Service unavailable. Using fallback matching.");
    const filtered = availableStocks.filter(s => s.medicine === requestData.medicine && s.quantity >= requestData.quantity);
    return filtered.map(s => ({ stockId: s.stockId, hospitalId: s.hospitalId, score: 0.8, reason: 'Fallback match' }));
  }
};
`;

// controllers/recommendationController.js
files['controllers/recommendationController.js'] = `const Request = require('../models/Request');
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
`;

// routes/recommendationRoutes.js
files['routes/recommendationRoutes.js'] = `const express = require('express');
const router = express.Router();
const { getRecommendationsForRequest, getRecommendationsForStock } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

router.get('/requests/:requestId', protect, getRecommendationsForRequest);
router.get('/stock/:stockId', protect, getRecommendationsForStock);

module.exports = router;
`;

// Write files
Object.keys(files).forEach(filePath => {
  fs.writeFileSync(path.join(__dirname, filePath), files[filePath]);
});
console.log("Setup files written successfully!");
