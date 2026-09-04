const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    stockId: { type: String, required: true, unique: true, trim: true },
    hospitalId: { type: String, required: true, ref: "Hospital", trim: true, index: true },
    medicine: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ["available", "unavailable"], default: "available", index: true },
  },
  { timestamps: true }
);

stockSchema.index({ status: 1, quantity: 1, expiryDate: 1 });

module.exports = mongoose.model("Stock", stockSchema);
