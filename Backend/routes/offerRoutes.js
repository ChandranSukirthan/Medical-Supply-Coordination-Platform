const express = require("express");
const offerController = require("../controllers/offerController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.post("/", offerController.createOffer);
router.get("/my", offerController.getMyOffers);
router.patch("/:id/accept", offerController.acceptOffer);
router.patch("/:id/reject", offerController.rejectOffer);
router.patch("/:id/cancel", offerController.cancelOffer);

module.exports = router;
