const Facility = require('../models/Facility');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

exports.registerFacility = async (req, res) => {
  try {
    const { hospitalName, password, location } = req.body;

    const facilityExists = await Facility.findOne({ hospitalName });
    if (facilityExists) {
      return res.status(400).json({ message: 'Hospital already registered' });
    }

    const facility = await Facility.create({
      hospitalName,
      password,
      location,
    });

    if (facility) {
      res.status(201).json({
        _id: facility._id,
        hospitalName: facility.hospitalName,
        location: facility.location,
        token: generateToken(facility._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid facility data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginFacility = async (req, res) => {
  try {
    const { hospitalName, password } = req.body;

    const facility = await Facility.findOne({ hospitalName });

    if (facility && (await facility.comparePassword(password))) {
      res.json({
        _id: facility._id,
        hospitalName: facility.hospitalName,
        location: facility.location,
        token: generateToken(facility._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid hospital name or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
