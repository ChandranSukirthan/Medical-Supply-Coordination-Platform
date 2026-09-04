const jwt = require('jsonwebtoken');
const Facility = require('../models/Facility');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.facility = await Facility.findById(decoded.id).select('-password');
      if (!req.facility) {
        return res.status(401).json({ message: 'Not authorized, facility not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
module.exports = { protect };
