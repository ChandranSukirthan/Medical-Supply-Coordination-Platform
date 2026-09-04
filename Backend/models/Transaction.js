const mongoose = require('mongoose');

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
