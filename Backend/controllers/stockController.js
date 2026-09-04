const mongoose = require("mongoose");
const Hospital = require("../models/Hospital");
const Stock = require("../models/Stock");
const MedicineRequest = require("../models/MedicineRequest");
const { normalizeMedicine } = require("../utils/medicine");

const fail = (message, statusCode, error) => {
  const problem = new Error(message);
  problem.statusCode = statusCode;
  problem.error = error;
  return problem;
};

const stockData = (body, hospitalId) => ({
  stockId: typeof body.stockId === "string" ? body.stockId.trim() : body.stockId,
  hospitalId,
  medicine: normalizeMedicine(body.medicine),
  quantity: body.quantity,
  location: typeof body.location === "string" ? body.location.trim() : body.location,
  province: typeof body.province === "string" ? body.province.trim() : body.province,
  expiryDate: body.expiryDate,
  status: body.status || "available",
});

const validateStock = (body) => {
  if (!body.stockId || !body.medicine) throw fail("stockId and medicine are required", 400, "INVALID_STOCK");
  if (!Number.isFinite(Number(body.quantity)) || Number(body.quantity) < 0) throw fail("quantity cannot be negative", 400, "INVALID_QUANTITY");
  if (!body.location || !body.province) throw fail("location and province are required", 400, "INVALID_STOCK");
  if (!body.expiryDate || Number.isNaN(Date.parse(body.expiryDate))) throw fail("expiryDate must be a valid date", 400, "INVALID_EXPIRY_DATE");
  if (body.status && !["available", "unavailable"].includes(body.status)) throw fail("Invalid stock status", 400, "INVALID_STATUS");
};

const findStock = async (id) => {
  const byStockId = await Stock.findOne({ stockId: id });
  if (byStockId || !mongoose.isValidObjectId(id)) return byStockId;
  return Stock.findById(id);
};

const send = (res, statusCode, data, message = "Operation successful") =>
  res.status(statusCode).json({ success: true, data, message });

const createStock = async (req, res, next) => {
  try {
    const userHospitalId = req.user.hospitalId || req.body.hospitalId || "JF001";
    const body = { ...req.body, hospitalId: userHospitalId };
    validateStock(body);
    let hospital = await Hospital.findOne({ hospitalId: userHospitalId });
    if (!hospital) {
      hospital = await Hospital.create({
        hospitalId: userHospitalId,
        name: req.body.location ? `${req.body.location} Hospital` : "General Hospital",
        location: req.body.location || "Jaffna",
        province: req.body.province || "Northern"
      });
    }
    const stock = await Stock.create(stockData(body, userHospitalId));
    return send(res, 201, stock);
  } catch (error) { return next(error); }
};

const getMyStock = async (req, res, next) => {
  try { return send(res, 200, await Stock.find({ hospitalId: req.user.hospitalId }).sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
};

const getAvailableStock = async (req, res, next) => {
  try {
    return send(res, 200, await Stock.find({ status: "available", expiryDate: { $gte: new Date() }, $expr: { $gt: [{ $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] }, 0] } }).sort({ expiryDate: 1 }));
  } catch (error) { return next(error); }
};

const getStock = async (req, res, next) => {
  try {
    const stock = await findStock(req.params.id);
    if (!stock) throw fail("Stock not found", 404, "STOCK_NOT_FOUND");
    return send(res, 200, stock);
  } catch (error) { return next(error); }
};

const updateStock = async (req, res, next) => {
  try {
    const stock = await findStock(req.params.id);
    if (!stock) throw fail("Stock not found", 404, "STOCK_NOT_FOUND");
    if (stock.hospitalId !== req.user.hospitalId) throw fail("You are not authorized to modify this stock", 403, "STOCK_OWNERSHIP_DENIED");
    const body = { ...req.body, hospitalId: req.user.hospitalId, stockId: stock.stockId };
    validateStock(body);
    if (Number(body.quantity) < (stock.reservedQuantity || 0)) throw fail("Quantity cannot be lower than reserved stock", 409, "RESERVED_STOCK_CONFLICT");
    Object.assign(stock, stockData(body, req.user.hospitalId));
    await stock.save();
    return send(res, 200, stock);
  } catch (error) { return next(error); }
};

const updateStockStatus = async (req, res, next) => {
  try {
    const stock = await findStock(req.params.id);
    if (!stock) throw fail("Stock not found", 404, "STOCK_NOT_FOUND");
    if (stock.hospitalId !== req.user.hospitalId) throw fail("You are not authorized to modify this stock", 403, "STOCK_OWNERSHIP_DENIED");
    if (!["available", "unavailable"].includes(req.body.status)) throw fail("Invalid stock status", 400, "INVALID_STATUS");
    stock.status = req.body.status;
    await stock.save();
    return send(res, 200, stock);
  } catch (error) { return next(error); }
};

const deleteStock = async (req, res, next) => {
  try {
    const stock = await findStock(req.params.id);
    if (!stock) throw fail("Stock not found", 404, "STOCK_NOT_FOUND");
    if (stock.hospitalId !== req.user.hospitalId) throw fail("You are not authorized to modify this stock", 403, "STOCK_OWNERSHIP_DENIED");
    await stock.deleteOne();
    return send(res, 200, { stockId: stock.stockId }, "Stock deleted successfully");
  } catch (error) { return next(error); }
};

const transferStock = async (req, res, next) => {
  try {
    const stockId = req.params.id;
    const requestedQty = Number(req.body.quantity);

    if (!requestedQty || requestedQty <= 0) {
      throw fail("Transfer quantity must be greater than zero", 400, "INVALID_QUANTITY");
    }

    const stock = await findStock(stockId);
    if (!stock) {
      throw fail("Stock not found", 404, "STOCK_NOT_FOUND");
    }

    if (stock.hospitalId === req.user.hospitalId) {
      throw fail("You cannot request an allocation transfer from your own facility's stock", 400, "SELF_TRANSFER_NOT_ALLOWED");
    }

    if (stock.quantity < requestedQty) {
      throw fail(`Insufficient stock: requested ${requestedQty} units, but only ${stock.quantity} available`, 400, "INSUFFICIENT_STOCK");
    }

    // Deduct exact quantity from stock in MongoDB
    stock.quantity -= requestedQty;
    if (stock.quantity === 0) {
      stock.status = "unavailable";
    }
    await stock.save();

    // Create a record of the request in MongoDB
    const requestId = req.body.requestId || `REQ-TRF-${Date.now().toString().slice(-6)}`;
    const requesterHospital = await Hospital.findOne({ hospitalId: req.user.hospitalId });
    const request = await MedicineRequest.create({
      requestId,
      hospitalId: req.user.hospitalId,
      medicine: stock.medicine,
      quantity: requestedQty,
      urgency: req.body.urgency || "HIGH",
      location: requesterHospital?.location || req.body.location || "Hospital Node",
      province: requesterHospital?.province || req.body.province || "Northern",
      requiredBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "open"
    });

    return send(res, 200, {
      stock,
      request,
      deductedQuantity: requestedQty,
      remainingQuantity: stock.quantity
    }, `Successfully transferred ${requestedQty} units. ${stock.quantity} units remaining in MongoDB.`);
  } catch (error) {
    return next(error);
  }
};

module.exports = { createStock, getMyStock, getAvailableStock, getStock, updateStock, updateStockStatus, deleteStock, transferStock };

