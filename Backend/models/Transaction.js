const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, trim: true },
    requestId: { type: String, required: true, ref: "MedicineRequest", index: true },
    offerId: { type: String, required: true, ref: "Offer", unique: true, index: true },
    supplierHospitalId: { type: String, required: true, ref: "Hospital", index: true },
    recipientHospitalId: { type: String, required: true, ref: "Hospital", index: true },
    medicine: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending", "in_transfer", "completed", "cancelled"], default: "pending", index: true },
    completedAt: { type: Date, default: null },
    stockAllocations: [{ stockId: String, quantity: { type: Number, min: 1 } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);