const express = require("express");
const stockController = require("../controllers/stockController");
const { authenticate, requireHospitalOwnership } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.post("/", requireHospitalOwnership, stockController.createStock);
router.get("/my", stockController.getMyStock);
router.get("/available", stockController.getAvailableStock);
router.get("/:id", stockController.getStock);
router.put("/:id", requireHospitalOwnership, stockController.updateStock);
router.patch("/:id/status", requireHospitalOwnership, stockController.updateStockStatus);
router.delete("/:id", stockController.deleteStock);

module.exports = router;
