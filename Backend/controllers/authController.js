const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Hospital = require("../models/Hospital");
const User = require("../models/User");

const requiredFields = ["hospitalId", "name", "location", "province", "email", "password"];

const validateRegistration = (body) => {
  const missingFields = requiredFields.filter(
    (field) => typeof body[field] !== "string" || !body[field].trim()
  );

  if (missingFields.length) {
    const error = new Error(`Missing required fields: ${missingFields.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (body.password.length < 6) {
    const error = new Error("Password must be at least 6 characters long");
    error.statusCode = 400;
    throw error;
  }

  if (!/^\S+@\S+\.\S+$/.test(body.email)) {
    const error = new Error("A valid email address is required");
    error.statusCode = 400;
    throw error;
  }
};

const publicHospital = (hospital) => ({
  hospitalId: hospital.hospitalId,
  name: hospital.name,
  location: hospital.location,
  province: hospital.province,
});

const publicUser = (user, hospital) => ({
  userId: user.userId,
  hospitalId: user.hospitalId,
  name: hospital ? hospital.name : user.hospitalId,
  email: user.email,
  role: user.role,
  location: hospital ? hospital.location : "",
  province: hospital ? hospital.province : "",
  hospital: hospital ? publicHospital(hospital) : null,
});

const register = async (req, res, next) => {
  try {
    validateRegistration(req.body);

    const hospitalId = req.body.hospitalId.trim();
    const email = req.body.email.trim().toLowerCase();
    const [existingHospital, existingUser] = await Promise.all([
      Hospital.findOne({ hospitalId }),
      User.findOne({ email }),
    ]);

    if (existingHospital) {
      return res.status(409).json({ success: false, message: "Hospital ID is already registered" });
    }

    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const hospital = await Hospital.create({
      hospitalId,
      name: req.body.name.trim(),
      location: req.body.location.trim(),
      province: req.body.province.trim(),
    });

    try {
      const passwordHash = await bcrypt.hash(req.body.password, 12);
      const user = await User.create({
        userId: crypto.randomUUID(),
        hospitalId: hospital.hospitalId,
        email,
        passwordHash,
        role: "hospital_admin",
      });

      return res.status(201).json({
        success: true,
        user: publicUser(user, hospital),
      });
    } catch (error) {
      await Hospital.deleteOne({ _id: hospital._id });
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const hospital = await Hospital.findOne({ hospitalId: user.hospitalId });
    const token = jwt.sign(
      { userId: user.userId, hospitalId: user.hospitalId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      user: publicUser(user, hospital),
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    const hospital = await Hospital.findOne({ hospitalId: req.user.hospitalId });
    if (!user || !hospital) {
      return res.status(404).json({ success: false, message: "Authenticated user was not found" });
    }

    return res.json({ success: true, user: publicUser(user, hospital) });
  } catch (error) {
    return next(error);
  }
};

const getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({}).sort({ name: 1 });
    return res.json({ success: true, hospitals });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, me, getHospitals };
