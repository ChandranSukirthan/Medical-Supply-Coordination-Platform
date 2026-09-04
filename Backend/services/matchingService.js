const Stock = require("../models/Stock");
const { normalizeMedicine } = require("../utils/medicine");

const availableStockFilter = (request) => ({
  hospitalId: { $ne: request.hospitalId },
  status: "available",
  $expr: { $gt: [{ $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] }, 0] },
  expiryDate: { $gte: new Date() },
  medicine: normalizeMedicine(request.medicine),
});

const findEligibleSuppliers = async (request) => {
  const stocks = await Stock.find(availableStockFilter(request)).sort({ expiryDate: 1 });
  const suppliers = new Map();

  for (const stock of stocks) {
    const current = suppliers.get(stock.hospitalId) || {
      hospitalId: stock.hospitalId,
      availableQuantity: 0,
      stockIds: [],
    };
    current.availableQuantity += stock.quantity - (stock.reservedQuantity || 0);
    current.stockIds.push(stock.stockId);
    suppliers.set(stock.hospitalId, current);
  }

  return [...suppliers.values()];
};

const getAvailableQuantity = async (request, supplierHospitalId) => {
  const stocks = await Stock.find({
    ...availableStockFilter(request),
    hospitalId: supplierHospitalId,
  });
  return stocks.reduce((total, stock) => total + stock.quantity - (stock.reservedQuantity || 0), 0);
};

module.exports = { findEligibleSuppliers, getAvailableQuantity };
