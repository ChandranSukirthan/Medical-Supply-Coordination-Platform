const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stockId: { type: String, required: true, unique: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  medicine: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['AVAILABLE', 'UNAVAILABLE'], default: 'AVAILABLE' }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
