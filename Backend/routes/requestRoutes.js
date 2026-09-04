const express = require("express");
const requestController = require("../controllers/requestController");
const offerController = require("../controllers/offerController");
const { authenticate, requireHospitalOwnership } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.post("/", requireHospitalOwnership, requestController.createRequest);
router.get("/open", requestController.getOpenRequests);
router.get("/my", requestController.getMyRequests);
router.get("/:requestId/offers", offerController.getRequestOffers);
router.get("/:requestId/matches", offerController.getEligibleSuppliers);
router.get("/:id", requestController.getRequest);
router.put("/:id", requireHospitalOwnership, requestController.updateRequest);
router.patch("/:id/cancel", requireHospitalOwnership, requestController.cancelRequest);

module.exports = router;
