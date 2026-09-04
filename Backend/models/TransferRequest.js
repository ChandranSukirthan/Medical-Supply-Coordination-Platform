const mongoose = require("mongoose");

const transferRequestSchema = new mongoose.Schema(
  {
    transferId: { type: String, required: true, unique: true, trim: true },
    stockId: { type: String, required: true, trim: true, index: true },
    requestId: { type: String, trim: true, default: "" },
    medicine: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    requesterHospitalId: { type: String, required: true, trim: true, index: true },
    requesterHospitalName: { type: String, trim: true, default: "" },
    supplierHospitalId: { type: String, required: true, trim: true, index: true },
    supplierHospitalName: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    message: { type: String, default: "" },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TransferRequest", transferRequestSchema);
