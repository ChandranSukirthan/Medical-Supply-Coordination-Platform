const express = require("express");
const {
  requestTransfer,
  getNotifications,
  acceptTransfer,
  rejectTransfer,
  getMyTransfers,
} = require("../controllers/transferController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);

router.post("/request", requestTransfer);
router.get("/notifications", getNotifications);
router.get("/my", getMyTransfers);
router.post("/:id/accept", acceptTransfer);
router.post("/:id/reject", rejectTransfer);

module.exports = router;
