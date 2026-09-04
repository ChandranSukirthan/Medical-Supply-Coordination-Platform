const mongoose = require("mongoose");

const medicineRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true, trim: true },
    hospitalId: { type: String, required: true, ref: "Hospital", trim: true, index: true },
    medicine: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    urgency: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    location: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    requiredBy: { type: Date, required: true },
    status: { type: String, enum: ["open", "accepted", "completed", "cancelled"], default: "open", index: true },
  },
  { timestamps: true }
);

medicineRequestSchema.index({ status: 1, requiredBy: 1 });

module.exports = mongoose.model("MedicineRequest", medicineRequestSchema);
