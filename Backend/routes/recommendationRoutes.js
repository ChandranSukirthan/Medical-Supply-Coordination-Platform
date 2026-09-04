const express = require("express");
const controller = require("../controllers/recommendationController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.get("/requests/:requestId", controller.recommendSuppliers);
router.get("/stock/:stockId", controller.recommendRecipients);

module.exports = router;