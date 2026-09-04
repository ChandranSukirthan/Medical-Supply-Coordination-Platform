const mongoose = require("mongoose");
const Hospital = require("../models/Hospital");
const MedicineRequest = require("../models/MedicineRequest");
const { normalizeMedicine } = require("../utils/medicine");

const fail = (message, statusCode, error) => {
  const problem = new Error(message);
  problem.statusCode = statusCode;
  problem.error = error;
  return problem;
};

const requestData = (body, hospitalId) => ({
  requestId: typeof body.requestId === "string" ? body.requestId.trim() : body.requestId,
  hospitalId,
  medicine: normalizeMedicine(body.medicine),
  quantity: body.quantity,
  urgency: body.urgency,
  location: typeof body.location === "string" ? body.location.trim() : body.location,
  province: typeof body.province === "string" ? body.province.trim() : body.province,
  requiredBy: body.requiredBy,
  status: body.status || "open",
});

const validateRequest = (body) => {
  if (!body.requestId || !body.medicine) throw fail("requestId and medicine are required", 400, "INVALID_REQUEST");
  if (!Number.isInteger(Number(body.quantity)) || Number(body.quantity) <= 0) throw fail("quantity must be greater than zero", 400, "INVALID_QUANTITY");
  if (!["LOW", "MEDIUM", "HIGH"].includes(body.urgency)) throw fail("urgency must be LOW, MEDIUM or HIGH", 400, "INVALID_URGENCY");
  if (!body.location || !body.province) throw fail("location and province are required", 400, "INVALID_REQUEST");
  if (!body.requiredBy || Number.isNaN(Date.parse(body.requiredBy))) throw fail("requiredBy must be a valid date", 400, "INVALID_REQUIRED_BY");
  if (body.status && !["open", "cancelled"].includes(body.status)) throw fail("Invalid request status", 400, "INVALID_STATUS");
};

const findRequest = async (id) => {
  const byRequestId = await MedicineRequest.findOne({ requestId: id });
  if (byRequestId || !mongoose.isValidObjectId(id)) return byRequestId;
  return MedicineRequest.findById(id);
};

const send = (res, statusCode, data, message = "Operation successful") =>
  res.status(statusCode).json({ success: true, data, message });

const createRequest = async (req, res, next) => {
  try {
    const body = { ...req.body, hospitalId: req.user.hospitalId };
    validateRequest(body);
    if (!(await Hospital.exists({ hospitalId: req.user.hospitalId }))) throw fail("Hospital not found", 404, "HOSPITAL_NOT_FOUND");
    const request = await MedicineRequest.create(requestData(body, req.user.hospitalId));
    return send(res, 201, request);
  } catch (error) { return next(error); }
};

const getOpenRequests = async (req, res, next) => {
  try { return send(res, 200, await MedicineRequest.find({ status: "open", requiredBy: { $gte: new Date() } }).sort({ urgency: -1, requiredBy: 1 })); }
  catch (error) { return next(error); }
};

const getMyRequests = async (req, res, next) => {
  try { return send(res, 200, await MedicineRequest.find({ hospitalId: req.user.hospitalId }).sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
};

const getRequest = async (req, res, next) => {
  try {
    const request = await findRequest(req.params.id);
    if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");
    return send(res, 200, request);
  } catch (error) { return next(error); }
};

const updateRequest = async (req, res, next) => {
  try {
    const request = await findRequest(req.params.id);
    if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");
    if (request.hospitalId !== req.user.hospitalId) throw fail("You are not authorized to modify this request", 403, "REQUEST_OWNERSHIP_DENIED");
    if (request.status === "cancelled") throw fail("Cancelled requests cannot be edited", 409, "REQUEST_CANCELLED");
    const body = { ...req.body, hospitalId: req.user.hospitalId, requestId: request.requestId, status: "open" };
    validateRequest(body);
    Object.assign(request, requestData(body, req.user.hospitalId));
    await request.save();
    return send(res, 200, request);
  } catch (error) { return next(error); }
};

const cancelRequest = async (req, res, next) => {
  try {
    const request = await findRequest(req.params.id);
    if (!request) throw fail("Request not found", 404, "REQUEST_NOT_FOUND");
    if (request.hospitalId !== req.user.hospitalId) throw fail("You are not authorized to modify this request", 403, "REQUEST_OWNERSHIP_DENIED");
    request.status = "cancelled";
    await request.save();
    return send(res, 200, request, "Request cancelled successfully");
  } catch (error) { return next(error); }
};

module.exports = { createRequest, getOpenRequests, getMyRequests, getRequest, updateRequest, cancelRequest };
