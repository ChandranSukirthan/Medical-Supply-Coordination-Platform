const Transaction = require('../models/Transaction');
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
