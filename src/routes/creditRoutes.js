const express =
  require("express");

const {
  getMyCreditSummary
} =
  require(
    "../controllers/creditController"
  );

const requireAuth =
  require(
    "../middleware/requireAuth"
  );

const requireApprovedProfile =
  require(
    "../middleware/requireApprovedProfile"
  );

const router =
  express.Router();


router.get(
  "/me",
  requireAuth,
  requireApprovedProfile,
  getMyCreditSummary
);


module.exports = router;