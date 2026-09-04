const Stock = require('../models/Stock');
const { generateId } = require('../utils/helpers');

exports.createStock = async (req, res) => {
  try {
    const { medicine, quantity, expiryDate, status } = req.body;
    if (quantity < 0) return res.status(400).json({ message: 'Negative stock not allowed' });
    if (!medicine || !expiryDate) return res.status(400).json({ message: 'Invalid medicine or date' });
    const stockId = generateId('STK');
    const stock = await Stock.create({ stockId, hospitalId: req.facility._id, medicine, quantity, expiryDate, status });
    res.status(201).json(stock);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyStock = async (req, res) => {
  try {
    const stocks = await Stock.find({ hospitalId: req.facility._id });
    res.json(stocks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAvailableStock = async (req, res) => {
  try {
    const stocks = await Stock.find({ status: 'AVAILABLE', quantity: { $gt: 0 }, expiryDate: { $gt: new Date() } }).populate('hospitalId', '-password');
    res.json(stocks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    if (stock.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized to modify this stock' });
    const { quantity } = req.body;
    if (quantity !== undefined && quantity < 0) return res.status(400).json({ message: 'Negative stock not allowed' });
    const updated = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStockStatus = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    if (stock.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    const { status } = req.body;
    if (!['AVAILABLE', 'UNAVAILABLE'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    stock.status = status;
    await stock.save();
    res.json(stock);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    if (stock.hospitalId.toString() !== req.facility._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stock deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
