const Facility = require('../models/Facility');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

exports.registerFacility = async (req, res) => {
  try {
    const { hospitalId, hospitalName, email, password, location, province } = req.body;
    const exists = await Facility.findOne({ $or: [{ hospitalId }, { email }] });
    if (exists) return res.status(400).json({ message: 'Hospital already registered (duplicate ID or email)' });
    
    const facility = await Facility.create({ hospitalId, hospitalName, email, password, location, province });
    res.status(201).json({
      _id: facility._id, hospitalId: facility.hospitalId, hospitalName: facility.hospitalName, email: facility.email, location: facility.location, province: facility.province, token: generateToken(facility._id)
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.loginFacility = async (req, res) => {
  try {
    const { hospitalId, password } = req.body;
    const facility = await Facility.findOne({ hospitalId });
    if (facility && (await facility.comparePassword(password))) {
      res.json({
        _id: facility._id, hospitalId: facility.hospitalId, hospitalName: facility.hospitalName, email: facility.email, location: facility.location, province: facility.province, token: generateToken(facility._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid hospital ID or password' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};
