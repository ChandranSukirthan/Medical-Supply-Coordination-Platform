const mongoose = require("mongoose");
const MedicineRequest = require("../models/MedicineRequest");
const Stock = require("../models/Stock");
const { requestRecommendations } = require("../services/aiService");
const { buildSupplierPayload, buildRecipientPayload } = require("../services/aiDataAdapter");

const error = (message, statusCode, code) => Object.assign(new Error(message), { statusCode, error: code });
const unavailable = (res) => res.status(503).json({ success: false, recommendations: [], message: "AI recommendations are temporarily unavailable." });
const findByPublicId = async (Model, id, field) => {
  const record = await Model.findOne({ [field]: id });
  if (record || !mongoose.isValidObjectId(id)) return record;
  return Model.findById(id);
};
const limit = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? Math.min(Number(value), 50) : 5;

const recommendSuppliers = async (req, res, next) => {
  try {
    const request = await findByPublicId(MedicineRequest, req.params.requestId, "requestId");
    if (!request) throw error("Request not found", 404, "REQUEST_NOT_FOUND");
    if (request.hospitalId !== req.user.hospitalId) throw error("Only the requesting hospital can view recommendations", 403, "REQUEST_OWNERSHIP_DENIED");
    if (request.status !== "open") throw error("Only open requests can be recommended", 409, "REQUEST_NOT_OPEN");
    const stocks = await Stock.find({ hospitalId: { $ne: request.hospitalId }, status: "available", expiryDate: { $gte: new Date() }, medicine: request.medicine, $expr: { $gt: [{ $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] }, 0] } }).sort({ expiryDate: 1 });
    const result = await requestRecommendations("/api/v1/recommend/suppliers", buildSupplierPayload(request, stocks, limit(req.query.limit)));
    return res.json({ success: true, ...result });
  } catch (caught) {
    if (caught.code === "AI_SERVICE_UNAVAILABLE") return unavailable(res);
    return next(caught);
  }
};

const recommendRecipients = async (req, res, next) => {
  try {
    const stock = await findByPublicId(Stock, req.params.stockId, "stockId");
    if (!stock) throw error("Stock not found", 404, "STOCK_NOT_FOUND");
    if (stock.hospitalId !== req.user.hospitalId) throw error("Only the stock owner can view recipient recommendations", 403, "STOCK_OWNERSHIP_DENIED");
    if (stock.status !== "available" || stock.quantity - (stock.reservedQuantity || 0) <= 0 || new Date(stock.expiryDate) < new Date()) throw error("Stock is not available for recommendations", 409, "STOCK_NOT_AVAILABLE");
    const requests = await MedicineRequest.find({ status: "open", requiredBy: { $gte: new Date() }, medicine: stock.medicine, hospitalId: { $ne: stock.hospitalId } }).sort({ requiredBy: 1 });
    const result = await requestRecommendations("/api/v1/recommend/recipients", buildRecipientPayload(stock, requests, limit(req.query.limit)));
    return res.json({ success: true, ...result });
  } catch (caught) {
    if (caught.code === "AI_SERVICE_UNAVAILABLE") return unavailable(res);
    return next(caught);
  }
};

module.exports = { recommendSuppliers, recommendRecipients };