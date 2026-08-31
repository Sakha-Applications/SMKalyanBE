const {
  ConsultationFollowupModel,
  ALLOWED_STATUSES
} =
  require(
    "../models/consultationFollowupModel"
  );


const listConsultationFollowups =
  async (
    req,
    res
  ) => {
    try {
      const rows =
        await ConsultationFollowupModel
          .getAll();

      return res.status(200).json({
        success: true,
        data: rows
      });

    } catch (error) {
      console.error(
        "[ConsultationFollowup] Unable to load follow-up queue:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load Mutual Pair follow-up queue."
      });
    }
  };


const getConsultationFollowup =
  async (
    req,
    res
  ) => {
    try {
      const responseId =
        Number(
          req.params.responseId
        );

      if (
        !Number.isInteger(
          responseId
        ) ||
        responseId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid advertisement response ID is required."
        });
      }

      const followup =
        await ConsultationFollowupModel
          .getByResponseId(
            responseId
          );

      if (!followup) {
        return res.status(404).json({
          success: false,
          message:
            "Mutual advertisement response was not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: followup
      });

    } catch (error) {
      console.error(
        "[ConsultationFollowup] Unable to load follow-up:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load consultation follow-up."
      });
    }
  };


const updateConsultationFollowup =
  async (
    req,
    res
  ) => {
    try {
      const responseId =
        Number(
          req.params.responseId
        );

      if (
        !Number.isInteger(
          responseId
        ) ||
        responseId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid advertisement response ID is required."
        });
      }

      const {
        consultationStatus,
        convenientTime,
        consultationRemarks,
        nextFollowUpAt
      } =
        req.body || {};

      const normalizedStatus =
        String(
          consultationStatus ||
          "PENDING"
        )
          .trim()
          .toUpperCase();

      if (
        !ALLOWED_STATUSES.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid consultation status.",
          allowedStatuses:
            ALLOWED_STATUSES
        });
      }

      /*
       * Use the same identity fallback
       * already used by advertisement
       * moderation.
       */
      const updatedBy =
        req.user?.email ||
        req.user?.userId ||
        req.user?.profile_id ||
        "SYSTEM";

      const followup =
        await ConsultationFollowupModel
          .save({
            advertisementResponseId:
              responseId,

            consultationStatus:
              normalizedStatus,

            convenientTime,

            consultationRemarks,

            nextFollowUpAt:
              nextFollowUpAt ||
              null,

            updatedBy
          });

      if (!followup) {
        return res.status(404).json({
          success: false,
          message:
            "Only a Mutual advertisement response can be added to consultation follow-up."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Consultation follow-up saved successfully.",
        data: followup
      });

    } catch (error) {
      console.error(
        "[ConsultationFollowup] Save failed:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to save consultation follow-up."
      });
    }
  };


module.exports = {
  listConsultationFollowups,
  getConsultationFollowup,
  updateConsultationFollowup
};