const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization ? authorization.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

const requireHospitalOwnership = (req, res, next) => {
  const requestedHospitalId =
    req.params.hospitalId || req.body.hospitalId || req.query.hospitalId;

  if (requestedHospitalId && requestedHospitalId !== req.user.hospitalId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this hospital's data",
    });
  }

  return next();
};

module.exports = { authenticate, requireHospitalOwnership };
