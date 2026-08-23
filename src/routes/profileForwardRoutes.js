const express =
  require("express");

const {
  forwardProfileByEmail
} =
  require(
    "../controllers/profileForwardController"
  );

const {
  authenticate
} =
  require(
    "../middleware/authMiddleware"
  );

const requireApprovedProfile =
  require(
    "../middleware/requireApprovedProfile"
  );

const router =
  express.Router();


router.post(
  "/profile-forward",
  authenticate,
  requireApprovedProfile,
  forwardProfileByEmail
);


module.exports = router;