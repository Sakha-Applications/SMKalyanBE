const express =
  require("express");

const router =
  express.Router();

const requireAuth =
  require(
    "../middleware/requireAuth"
  );

const isModeratorOrAdmin =
  require(
    "../middleware/isModeratorOrAdmin"
  );

const {
  listConsultationFollowups,
  getConsultationFollowup,
  updateConsultationFollowup
} =
  require(
    "../controllers/consultationFollowupController"
  );


router.get(
  "/moderator/consultation-followups",
  requireAuth,
  isModeratorOrAdmin,
  listConsultationFollowups
);


router.get(
  "/moderator/consultation-followups/:responseId",
  requireAuth,
  isModeratorOrAdmin,
  getConsultationFollowup
);


router.put(
  "/moderator/consultation-followups/:responseId",
  requireAuth,
  isModeratorOrAdmin,
  updateConsultationFollowup
);


module.exports =
  router;