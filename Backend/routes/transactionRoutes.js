const express = require("express");
const controller = require("../controllers/transactionController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.get("/my", controller.getMyTransactions);
router.get("/:id", controller.getTransaction);
router.patch("/:id/start", controller.startTransaction);
router.patch("/:id/complete", controller.completeTransaction);
router.patch("/:id/cancel", controller.cancelTransaction);

module.exports = router;