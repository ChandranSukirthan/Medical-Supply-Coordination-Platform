const mongoose = require('mongoose');

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
