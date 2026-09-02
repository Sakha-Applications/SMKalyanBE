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
  getMyNotifications,
  markNotificationRead
} =
  require(
    "../controllers/memberNotificationController"
  );

router.get(
  "/",
  requireAuth,
  requireApprovedProfile,
  getMyNotifications
);

router.put(
  "/:notificationId/read",
  requireAuth,
  requireApprovedProfile,
  markNotificationRead
);

module.exports = router;
