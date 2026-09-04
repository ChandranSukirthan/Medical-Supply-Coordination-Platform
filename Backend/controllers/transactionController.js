const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Stock = require("../models/Stock");
const Offer = require("../models/Offer");
const MedicineRequest = require("../models/MedicineRequest");

const fail = (message, statusCode, error) => Object.assign(new Error(message), { statusCode, error });
const send = (res, statusCode, data, message = "Operation successful") => res.status(statusCode).json({ success: true, data, message });
const findTransaction = async (id, session) => {
  const query = Transaction.findOne({ transactionId: id });
  if (session) query.session(session);
  const transaction = await query;
  if (transaction || !mongoose.isValidObjectId(id)) return transaction;
  const byId = Transaction.findById(id);
  if (session) byId.session(session);
  return byId;
};

const ownedBy = (transaction, hospitalId) => transaction.supplierHospitalId === hospitalId || transaction.recipientHospitalId === hospitalId;

const getMyTransactions = async (req, res, next) => {
  try { return send(res, 200, await Transaction.find({ $or: [{ supplierHospitalId: req.user.hospitalId }, { recipientHospitalId: req.user.hospitalId }] }).sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
};

const getTransaction = async (req, res, next) => {
  try {
    const transaction = await findTransaction(req.params.id);
    if (!transaction) throw fail("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
    if (!ownedBy(transaction, req.user.hospitalId)) throw fail("You are not authorized to view this transaction", 403, "TRANSACTION_ACCESS_DENIED");
    return send(res, 200, transaction);
  } catch (error) { return next(error); }
};

const updateTransaction = (action) => async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const transaction = await findTransaction(req.params.id, session);
      if (!transaction) throw fail("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
      if (!ownedBy(transaction, req.user.hospitalId)) throw fail("You are not authorized to modify this transaction", 403, "TRANSACTION_ACCESS_DENIED");
      const allowed = action === "start"
        ? transaction.supplierHospitalId === req.user.hospitalId && transaction.status === "pending"
        : action === "complete"
          ? transaction.recipientHospitalId === req.user.hospitalId && transaction.status === "in_transfer"
          : (transaction.status === "pending" || transaction.status === "in_transfer") && (transaction.supplierHospitalId === req.user.hospitalId || transaction.recipientHospitalId === req.user.hospitalId);
      if (!allowed) throw fail("Invalid transaction state or authorization", 409, "INVALID_TRANSACTION_TRANSITION");

      if (action === "complete") {
        for (const allocation of transaction.stockAllocations) {
          const updated = await Stock.findOneAndUpdate(
            { stockId: allocation.stockId, hospitalId: transaction.supplierHospitalId, $expr: { $and: [{ $gte: ["$quantity", allocation.quantity] }, { $gte: [{ $ifNull: ["$reservedQuantity", 0] }, allocation.quantity] }] } },
            { $inc: { quantity: -allocation.quantity, reservedQuantity: -allocation.quantity } },
            { new: true, session }
          );
          if (!updated || updated.quantity < 0 || updated.reservedQuantity < 0) throw fail("Reserved stock is no longer available", 409, "STOCK_CONFLICT");
        }
        transaction.status = "completed";
        transaction.completedAt = new Date();
        await Offer.updateOne({ offerId: transaction.offerId }, { $set: { status: "completed" } }, { session });
        await MedicineRequest.updateOne({ requestId: transaction.requestId }, { $set: { status: "completed" } }, { session });
      } else if (action === "cancel") {
        for (const allocation of transaction.stockAllocations) {
          const released = await Stock.updateOne(
            { stockId: allocation.stockId, hospitalId: transaction.supplierHospitalId, $expr: { $gte: [{ $ifNull: ["$reservedQuantity", 0] }, allocation.quantity] } },
            { $inc: { reservedQuantity: -allocation.quantity } },
            { session }
          );
          if (released.modifiedCount !== 1) throw fail("Reserved stock could not be released", 409, "STOCK_CONFLICT");
        }
        transaction.status = "cancelled";
        await Offer.updateOne({ offerId: transaction.offerId }, { $set: { status: "cancelled" } }, { session });
        await MedicineRequest.updateOne({ requestId: transaction.requestId }, { $set: { status: "open" } }, { session });
      } else transaction.status = "in_transfer";
      await transaction.save({ session });
      result = transaction;
    });
    return send(res, 200, result, `Transaction ${action}ed successfully`);
  } catch (error) { return next(error); } finally { await session.endSession(); }
};

module.exports = { getMyTransactions, getTransaction, startTransaction: updateTransaction("start"), completeTransaction: updateTransaction("complete"), cancelTransaction: updateTransaction("cancel") };