const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    offerId: { type: String, required: true, unique: true, trim: true },
    requestId: { type: String, required: true, ref: "MedicineRequest", index: true },
    supplierHospitalId: { type: String, required: true, ref: "Hospital", index: true },
    medicine: { type: String, required: true, trim: true },
    quantityOffered: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    message: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true }
);

offerSchema.index({ requestId: 1, supplierHospitalId: 1, status: 1 });

module.exports = mongoose.model("Offer", offerSchema);
