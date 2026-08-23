const express =
  require("express");

const router =
  express.Router();

const requireAuth =
  require(
    "../middleware/requireAuth"
  );

const requireApprovedProfile =
  require(
    "../middleware/requireApprovedProfile"
  );

const {
  createResponse,
  getMyAdvertisementResponses,
  getMySentAdvertisementResponses,
  updateAdvertisementResponse
} =
  require(
    "../controllers/advertisementResponseController"
  );


router.post(
  "/:advertisementId/respond",
  requireAuth,
  requireApprovedProfile,
  createResponse
);


router.get(
  "/my-responses",
  requireAuth,
  requireApprovedProfile,
  getMyAdvertisementResponses
);


router.get(
  "/sent",
  requireAuth,
  requireApprovedProfile,
  getMySentAdvertisementResponses
);


router.put(
  "/:responseId/status",
  requireAuth,
  requireApprovedProfile,
  updateAdvertisementResponse
);


module.exports = router;