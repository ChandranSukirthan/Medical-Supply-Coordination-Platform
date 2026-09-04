const crypto = require("crypto");
const mongoose = require("mongoose");
const Hospital = require("../models/Hospital");
const MedicineRequest = require("../models/MedicineRequest");
const Offer = require("../models/Offer");
const Stock = require("../models/Stock");
const Transaction = require("../models/Transaction");
const { normalizeMedicine } = require("../utils/medicine");
const { getAvailableQuantity, findEligibleSuppliers } = require("../services/matchingService");

const fail = (message, statusCode, error) => {
  const problem = new Error(message);
  problem.statusCode = statusCode;
  problem.error = error;
  return problem;
};

const send = (res, statusCode, data, message = "Operation successful") =>
  res.status(statusCode).json({ success: true, data, message });

const findRequest = async (id) => {
  const request = await MedicineRequest.findOne({ requestId: id });
  if (request || !mongoose.isValidObjectId(id)) return request;
  return MedicineRequest.findById(id);
};

const findOffer = async (id, session) => {
  const query = Offer.findOne({ offerId: id });
  if (session) query.session(session);
  const offer = await query;
  if (offer || !mongoose.isValidObjectId(id)) return offer;
  const byId = Offer.findById(id);
  if (session) byId.session(session);
  return byId;
};

const validateOffer = (body) => {
  if (!body.offerId || !body.requestId || !body.medicine) throw fail("offerId, requestId and medicine are required", 400, "INVALID_OFFER");
  if (!Number.isInteger(Number(body.quantityOffered)) || Number(body.quantityOffered) <= 0) throw fail("quantityOffered must be greater than zero", 400, "INVALID_QUANTITY");
  if (body.message !== undefined && typeof body.message !== "string") throw fail("message must be text", 400, "INVALID_MESSAGE");
};

const createOffer = async (req, res, next) => {
  try {
    validateOffer(req.body);
    const request = await findRequest(req.body.requestId);
    if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");
    if (request.status !== "open") throw fail("Only open requests can receive offers", 409, "REQUEST_NOT_OPEN");
    if (request.hospitalId === req.user.hospitalId) throw fail("You cannot offer on your own request", 403, "OWN_REQUEST");
    if (normalizeMedicine(req.body.medicine) !== normalizeMedicine(request.medicine)) throw fail("Offer medicine does not match the request", 400, "MEDICINE_MISMATCH");
    if (!(await Hospital.exists({ hospitalId: req.user.hospitalId }))) throw fail("Supplier hospital not found", 404, "HOSPITAL_NOT_FOUND");

    const quantityOffered = Number(req.body.quantityOffered);
    const availableQuantity = await getAvailableQuantity(request, req.user.hospitalId);
    if (availableQuantity < quantityOffered) throw fail("Insufficient available stock", 409, "INSUFFICIENT_STOCK");

    const offer = await Offer.create({
      offerId: req.body.offerId.trim(),
      requestId: request.requestId,
      supplierHospitalId: req.user.hospitalId,
      medicine: normalizeMedicine(request.medicine),
      quantityOffered,
      message: req.body.message || "",
      status: "pending",
    });
    return send(res, 201, offer, "Offer created successfully");
  } catch (error) { return next(error); }
};

const getMyOffers = async (req, res, next) => {
  try { return send(res, 200, await Offer.find({ supplierHospitalId: req.user.hospitalId }).sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
};

const getRequestOffers = async (req, res, next) => {
  try {
    const request = await findRequest(req.params.requestId);
    if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");
    if (request.hospitalId !== req.user.hospitalId) throw fail("Only the requesting hospital can view these offers", 403, "REQUEST_OWNERSHIP_DENIED");
    return send(res, 200, await Offer.find({ requestId: request.requestId }).sort({ createdAt: -1 }));
  } catch (error) { return next(error); }
};

const updateStatus = (status) => async (req, res, next) => {
  try {
    const offer = await findOffer(req.params.id);
    if (!offer) throw fail("Offer not found", 404, "OFFER_NOT_FOUND");
    const request = await MedicineRequest.findOne({ requestId: offer.requestId });
    if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");

    if (status === "cancelled") {
      if (offer.supplierHospitalId !== req.user.hospitalId) throw fail("Only the supplier can cancel this offer", 403, "OFFER_OWNERSHIP_DENIED");
    } else if (request.hospitalId !== req.user.hospitalId) {
      throw fail("Only the requesting hospital can change this offer", 403, "REQUEST_OWNERSHIP_DENIED");
    }
    if (offer.status !== "pending") throw fail("Only pending offers can be changed", 409, "OFFER_NOT_PENDING");
    offer.status = status;
    await offer.save();
    return send(res, 200, offer, `Offer ${status} successfully`);
  } catch (error) { return next(error); }
};

const getEligibleSuppliers = async (req, res, next) => {
  try {
    const request = await findRequest(req.params.requestId);
    if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");
    if (request.hospitalId !== req.user.hospitalId) throw fail("Only the requesting hospital can view matches", 403, "REQUEST_OWNERSHIP_DENIED");
    return send(res, 200, await findEligibleSuppliers(request));
  } catch (error) { return next(error); }
};

const acceptOffer = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let transaction;
    await session.withTransaction(async () => {
      const offer = await findOffer(req.params.id, session);
      if (!offer) throw fail("Offer not found", 404, "OFFER_NOT_FOUND");
      const request = await MedicineRequest.findOne({ requestId: offer.requestId }).session(session);
      if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");
      if (request.hospitalId !== req.user.hospitalId) throw fail("Only the requesting hospital can accept this offer", 403, "REQUEST_OWNERSHIP_DENIED");
      if (request.status !== "open") throw fail("This request is no longer open", 409, "REQUEST_NOT_OPEN");
      if (offer.status !== "pending") throw fail("Only pending offers can be accepted", 409, "OFFER_NOT_PENDING");

      const claimedRequest = await MedicineRequest.updateOne(
        { _id: request._id, status: "open" },
        { $set: { status: "accepted" } },
        { session }
      );
      if (claimedRequest.modifiedCount !== 1) throw fail("Another offer has already been accepted", 409, "REQUEST_ALREADY_ACCEPTED");

      let remaining = offer.quantityOffered;
      const stocks = await Stock.find({
        hospitalId: offer.supplierHospitalId,
        medicine: offer.medicine,
        status: "available",
        expiryDate: { $gte: new Date() },
        $expr: { $gt: [{ $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] }, 0] },
      }).sort({ expiryDate: 1 }).session(session);
      const allocations = [];
      for (const stock of stocks) {
        if (remaining <= 0) break;
        const available = stock.quantity - (stock.reservedQuantity || 0);
        const amount = Math.min(remaining, available);
        const reserved = await Stock.updateOne(
          { _id: stock._id, $expr: { $gte: [{ $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] }, amount] } },
          { $inc: { reservedQuantity: amount } },
          { session }
        );
        if (reserved.modifiedCount === 1) {
          allocations.push({ stockId: stock.stockId, quantity: amount });
          remaining -= amount;
        }
      }
      if (remaining > 0) throw fail("Insufficient current stock", 409, "INSUFFICIENT_STOCK");

      [transaction] = await Transaction.create([{
        transactionId: crypto.randomUUID(),
        requestId: request.requestId,
        offerId: offer.offerId,
        supplierHospitalId: offer.supplierHospitalId,
        recipientHospitalId: request.hospitalId,
        medicine: offer.medicine,
        quantity: offer.quantityOffered,
        status: "pending",
        stockAllocations: allocations,
      }], { session });
      await Offer.updateOne({ _id: offer._id, status: "pending" }, { $set: { status: "accepted" } }, { session });
      await Offer.updateMany({ requestId: request.requestId, _id: { $ne: offer._id }, status: "pending" }, { $set: { status: "cancelled" } }, { session });
    });
    return send(res, 201, transaction, "Offer accepted and transaction created");
  } catch (error) { return next(error); } finally { await session.endSession(); }
};

module.exports = { createOffer, getMyOffers, getRequestOffers, acceptOffer, rejectOffer: updateStatus("rejected"), cancelOffer: updateStatus("cancelled"), getEligibleSuppliers };
