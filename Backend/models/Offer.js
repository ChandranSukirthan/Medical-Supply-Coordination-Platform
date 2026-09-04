const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerId: { type: String, required: true, unique: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
