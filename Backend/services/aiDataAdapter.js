const dateOnly = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const requestStatus = (status) => status === "open" ? "open" : "cancelled";
const stockStatus = (status) => status === "available" ? "available" : "unavailable";

const toAiRequest = (request) => ({
  requestId: request.requestId, hospitalId: request.hospitalId, medicine: request.medicine,
  quantity: request.quantity, urgency: request.urgency, location: request.location,
  province: request.province, requiredBy: dateOnly(request.requiredBy), status: requestStatus(request.status),
});

const toAiStock = (stock) => ({
  stockId: stock.stockId, hospitalId: stock.hospitalId, medicine: stock.medicine,
  quantity: stock.quantity - (stock.reservedQuantity || 0), location: stock.location,
  province: stock.province, expiryDate: dateOnly(stock.expiryDate), status: stockStatus(stock.status),
});

const buildSupplierPayload = (request, stocks, limit = 5) => ({ request: toAiRequest(request), availableStock: stocks.map(toAiStock), limit });
const buildRecipientPayload = (stock, requests, limit = 5) => ({ stock: toAiStock(stock), openRequests: requests.map(toAiRequest), limit });

module.exports = { toAiRequest, toAiStock, buildSupplierPayload, buildRecipientPayload, dateOnly };