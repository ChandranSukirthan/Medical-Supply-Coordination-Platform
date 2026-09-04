const mongoose = require("mongoose");
const TransferRequest = require("../models/TransferRequest");
const Stock = require("../models/Stock");
const Hospital = require("../models/Hospital");
const MedicineRequest = require("../models/MedicineRequest");

const fail = (message, statusCode, error) => {
  const problem = new Error(message);
  problem.statusCode = statusCode;
  problem.error = error;
  return problem;
};

const send = (res, statusCode, data, message = "Operation successful") =>
  res.status(statusCode).json({ success: true, data, message });

// 1. Create a Provision / Transfer Request (Status: pending, Stock NOT deducted yet)
const requestTransfer = async (req, res, next) => {
  try {
    const { stockId, quantity, requestId, message } = req.body;
    const requestedQty = Number(quantity);

    if (!stockId || !requestedQty || requestedQty <= 0) {
      throw fail("Stock ID and positive quantity are required", 400, "INVALID_INPUT");
    }

    const stock = await Stock.findOne({ stockId });
    if (!stock) {
      throw fail("Stock record not found in MongoDB", 404, "STOCK_NOT_FOUND");
    }

    if (stock.hospitalId === req.user.hospitalId) {
      throw fail("You cannot request an allocation transfer from your own facility's stock", 400, "SELF_TRANSFER_NOT_ALLOWED");
    }

    if (stock.quantity < requestedQty) {
      throw fail(`Requested quantity (${requestedQty}) exceeds available stock (${stock.quantity})`, 400, "INSUFFICIENT_STOCK");
    }

    // Lookup hospital names
    const [requesterHosp, supplierHosp] = await Promise.all([
      Hospital.findOne({ hospitalId: req.user.hospitalId }),
      Hospital.findOne({ hospitalId: stock.hospitalId }),
    ]);

    const transferId = `TRF-${Date.now().toString().slice(-6)}`;
    const transfer = await TransferRequest.create({
      transferId,
      stockId: stock.stockId,
      requestId: requestId || "",
      medicine: stock.medicine,
      quantity: requestedQty,
      requesterHospitalId: req.user.hospitalId,
      requesterHospitalName: requesterHosp?.name || req.user.hospitalId,
      supplierHospitalId: stock.hospitalId,
      supplierHospitalName: supplierHosp?.name || stock.hospitalId,
      status: "pending",
      message: message || `Urgent provision request for ${requestedQty} units of ${stock.medicine}`,
    });

    return send(
      res,
      201,
      transfer,
      `Transfer request sent to ${supplierHosp?.name || stock.hospitalId}. Stock will be deducted upon their acceptance.`
    );
  } catch (error) {
    return next(error);
  }
};

// 2. Get Notifications (Pending incoming requests for the logged-in hospital)
const getNotifications = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    // Incoming pending requests where this hospital is the supplier
    const incomingPending = await TransferRequest.find({
      supplierHospitalId: hospitalId,
      status: "pending",
    }).sort({ createdAt: -1 });

    // Outgoing requests made by this hospital
    const outgoingRecent = await TransferRequest.find({
      requesterHospitalId: hospitalId,
    }).sort({ updatedAt: -1 }).limit(10);

    return send(res, 200, {
      incomingPending,
      outgoingRecent,
      unreadCount: incomingPending.length,
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Accept Transfer Request -> DEDUCT EXACT STOCK AMOUNT IN MONGODB
const acceptTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transfer = await TransferRequest.findOne({ transferId: id });
    if (!transfer) {
      throw fail("Transfer request not found", 404, "TRANSFER_NOT_FOUND");
    }

    if (transfer.supplierHospitalId !== req.user.hospitalId) {
      throw fail("Only the supplier facility can accept this transfer request", 403, "NOT_AUTHORIZED");
    }

    if (transfer.status !== "pending") {
      throw fail(`This transfer request is already ${transfer.status}`, 400, "INVALID_STATE");
    }

    // Find supplier's stock
    const stock = await Stock.findOne({ stockId: transfer.stockId });
    if (!stock) {
      throw fail("Original stock ledger not found in MongoDB", 404, "STOCK_NOT_FOUND");
    }

    if (stock.quantity < transfer.quantity) {
      throw fail(`Insufficient stock remaining: only ${stock.quantity} units available to transfer`, 400, "INSUFFICIENT_STOCK");
    }

    // DEDUCT THE EXACT AMOUNT FROM MONGODB
    stock.quantity -= transfer.quantity;
    if (stock.quantity === 0) {
      stock.status = "unavailable";
    }
    await stock.save();

    // Mark transfer as accepted
    transfer.status = "accepted";
    transfer.acceptedAt = new Date();
    await transfer.save();

    // If linked to a shortage request, update it
    if (transfer.requestId) {
      await MedicineRequest.updateOne(
        { requestId: transfer.requestId },
        { $set: { status: "accepted" } }
      );
    }

    return send(
      res,
      200,
      {
        transfer,
        remainingStock: stock.quantity,
      },
      `Transfer accepted! Deducted ${transfer.quantity} units of ${stock.medicine}. Remaining stock in MongoDB: ${stock.quantity} units.`
    );
  } catch (error) {
    return next(error);
  }
};

// 4. Reject Transfer Request -> NO stock deducted
const rejectTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transfer = await TransferRequest.findOne({ transferId: id });
    if (!transfer) {
      throw fail("Transfer request not found", 404, "TRANSFER_NOT_FOUND");
    }

    if (transfer.supplierHospitalId !== req.user.hospitalId) {
      throw fail("Only the supplier facility can reject this transfer request", 403, "NOT_AUTHORIZED");
    }

    if (transfer.status !== "pending") {
      throw fail(`This transfer request is already ${transfer.status}`, 400, "INVALID_STATE");
    }

    transfer.status = "rejected";
    await transfer.save();

    return send(res, 200, transfer, "Transfer request declined. Stock quantity unchanged.");
  } catch (error) {
    return next(error);
  }
};

// 5. Get All Transfers for Current Hospital
const getMyTransfers = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const transfers = await TransferRequest.find({
      $or: [{ supplierHospitalId: hospitalId }, { requesterHospitalId: hospitalId }],
    }).sort({ createdAt: -1 });

    return send(res, 200, transfers);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requestTransfer,
  getNotifications,
  acceptTransfer,
  rejectTransfer,
  getMyTransfers,
};
