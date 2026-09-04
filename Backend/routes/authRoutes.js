const express = require("express");
const { register, login, me, getHospitals } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.get("/hospitals", getHospitals);

module.exports = router;
