const AdvertisementResponseModel =
  require(
    "../models/advertisementResponseModel"
  );
const db =
  require(
    "../config/db"
  );

const creditModel =
  require(
    "../models/creditModel"
  );

const getAuthenticatedProfileId = (
  req
) =>
  req.user?.profile_id ||
  req.user?.profileId ||
  req.user?.id ||
  null;


const createResponse =
  async (
    req,
    res
  ) => {
    const responderProfileId =
      getAuthenticatedProfileId(
        req
      );

    const {
      advertisementId
    } = req.params;

    const {
      responseType,
      remarks
    } = req.body || {};

    const normalizedResponseType =
      String(
        responseType || ""
      )
        .trim()
        .toUpperCase();

    const normalizedRemarks =
      String(
        remarks || ""
      ).trim();

    if (!responderProfileId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated profile is required"
      });
    }

    if (!advertisementId) {
      return res.status(400).json({
        success: false,
        message:
          "Advertisement ID is required"
      });
    }

    if (
      ![
        "INTEREST",
        "APPLY"
      ].includes(
        normalizedResponseType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement response type"
      });
    }

    if (
      !normalizedRemarks
    ) {
      return res.status(400).json({
        success: false,
        message:
          normalizedResponseType ===
          "INTEREST"
            ? "Please explain why you are interested and what clarification or additional information you need before applying."
            : "Please provide a genuine reason for your application."
      });
    }



    const connection =
      await db.getConnection();

    try {
      await connection
        .beginTransaction();

      const configuration =
        await creditModel
          .getCreditConfiguration();

      const actionCost =
        normalizedResponseType ===
        "APPLY"
          ? Number(
              configuration
                .directApplyCost || 0
            )
          : Number(
              configuration
                .showInterestCost || 0
            );

      /*
       * Create the response first inside
       * this uncommitted transaction.
       *
       * Duplicate response detection occurs
       * before any credit is debited.
       */
      const result =
        await AdvertisementResponseModel
          .createResponse({
            advertisementId,
            responderProfileId,
            responseType:
              normalizedResponseType,
            responderRemarks:
              normalizedRemarks,
            connection
          });

      if (result.duplicate) {
        await connection.rollback();

        const existingType =
          String(
            result
              .existingResponseType ||
            ""
          )
            .trim()
            .toUpperCase();

        const existingLabel =
          existingType ===
          "APPLY"
            ? "application"
            : "interest";

        return res.status(409).json({
          success: false,
          message:
            `You have already submitted an ${existingLabel} for this advertisement. Interest and Apply are alternative actions, so another response cannot be submitted.`,
          data: result
        });
      }

      const creditResult =
        await creditModel
          .debitCreditsWithConnection({
            connection,

            profileId:
              responderProfileId,

            transactionType:
              normalizedResponseType ===
              "APPLY"
                ? "ADVERTISEMENT_APPLY"
                : "ADVERTISEMENT_INTEREST",

            referenceType:
              "ADVERTISEMENT_RESPONSE",

            referenceId:
              result.id,

            credits:
              actionCost,

            description:
              normalizedResponseType ===
              "APPLY"
                ? `Direct Apply for advertisement ${advertisementId}`
                : `Show Interest for advertisement ${advertisementId}`
          });

      await connection.commit();

      return res.status(201).json({
        success: true,

        message:
          normalizedResponseType ===
          "APPLY"
            ? (
                actionCost > 0
                  ? `Application submitted. ${actionCost} credit points used.`
                  : "Application submitted."
              )
            : (
                actionCost > 0
                  ? `Interest submitted. ${actionCost} credit points used.`
                  : "Interest submitted."
              ),

        data: {
          ...result,

          credit: {
            cost:
              actionCost,

            debited:
              creditResult
                .debited,

            balanceBefore:
              creditResult
                .balanceBefore,

            balanceAfter:
              creditResult
                .balanceAfter,

            lowCredit:
              creditResult
                .balanceAfter <=
              configuration
                .lowCreditThreshold,

            lowCreditThreshold:
              configuration
                .lowCreditThreshold
          }
        }
      });

    } catch (error) {
      try {
        await connection
          .rollback();
      } catch {
        // Ignore rollback failure.
      }

      console.error(
        "[AdvertisementResponseController] createResponse:",
        error
      );

      if (
        error.code ===
        "INSUFFICIENT_CREDITS"
      ) {
        return res.status(402).json({
          success: false,

          code:
            "INSUFFICIENT_CREDITS",

          message:
            error.message,

          data: {
            requiredCredits:
              error
                .requiredCredits,

            availableBalance:
              error
                .availableBalance
          }
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to submit advertisement response"
      });

    } finally {
      connection.release();
    }
  };


const getMyAdvertisementResponses =
  async (
    req,
    res
  ) => {
    try {
      const ownerProfileId =
        getAuthenticatedProfileId(
          req
        );

      if (!ownerProfileId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated profile is required"
        });
      }

      const [
        responses,
        counts
      ] =
        await Promise.all([
          AdvertisementResponseModel
            .getResponsesForOwner(
              ownerProfileId
            ),

          AdvertisementResponseModel
            .getResponseCounts(
              ownerProfileId
            )
        ]);

      return res.status(200).json({
        success: true,
        data: responses,
        counts
      });
    } catch (error) {
      console.error(
        "[AdvertisementResponseController] getMyAdvertisementResponses:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load advertisement responses"
      });
    }
  };

const getMySentAdvertisementResponses =
  async (
    req,
    res
  ) => {
    try {
      const responderProfileId =
        getAuthenticatedProfileId(
          req
        );

      if (!responderProfileId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated profile is required"
        });
      }

      const responses =
        await AdvertisementResponseModel
          .getResponsesForResponder(
            responderProfileId
          );

      return res.status(200).json({
        success: true,
        data: responses
      });
    } catch (error) {
      console.error(
        "[AdvertisementResponseController] getMySentAdvertisementResponses:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load sent advertisement responses"
      });
    }
  };

const applyAfterShortlist =
  async (
    req,
    res
  ) => {
    const responderProfileId =
      getAuthenticatedProfileId(
        req
      );

    const {
      responseId
    } = req.params;

    const {
      remarks
    } = req.body || {};

    const normalizedRemarks =
      String(
        remarks || ""
      ).trim();

    if (!responderProfileId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated profile is required"
      });
    }

    if (!responseId) {
      return res.status(400).json({
        success: false,
        message:
          "Response ID is required"
      });
    }

    if (!normalizedRemarks) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide your response to the requested clarification before applying."
      });
    }

    const connection =
      await db.getConnection();

    try {
      await connection
        .beginTransaction();

      const configuration =
        await creditModel
          .getCreditConfiguration();

      const applyCost =
        Number(
          configuration
            .directApplyCost || 0
        );

      const updatedResponse =
        await AdvertisementResponseModel
          .applyAfterShortlist({
            responseId,
            responderProfileId,
            responderRemarks:
              normalizedRemarks,
            connection
          });

      if (!updatedResponse) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Advertisement response was not found."
        });
      }

      const creditResult =
        await creditModel
          .debitCreditsWithConnection({
            connection,

            profileId:
              responderProfileId,

            transactionType:
              "ADVERTISEMENT_APPLY",

            referenceType:
              "ADVERTISEMENT_RESPONSE",

            referenceId:
              responseId,

            credits:
              applyCost,

            description:
              `Apply after shortlist for advertisement response ${responseId}`
          });

      await connection.commit();

      return res.status(200).json({
        success: true,

        message:
          applyCost > 0
            ? `Application submitted. ${applyCost} credit points used.`
            : "Application submitted successfully.",

        data: {
          ...updatedResponse,

          credit: {
            cost:
              applyCost,

            debited:
              creditResult
                .debited,

            balanceBefore:
              creditResult
                .balanceBefore,

            balanceAfter:
              creditResult
                .balanceAfter,

            lowCredit:
              creditResult
                .balanceAfter <=
              configuration
                .lowCreditThreshold,

            lowCreditThreshold:
              configuration
                .lowCreditThreshold
          }
        }
      });

    } catch (error) {
      try {
        await connection
          .rollback();
      } catch {
        // Ignore rollback failure.
      }

      console.error(
        "[AdvertisementResponseController] applyAfterShortlist:",
        error
      );

      if (
        error.code ===
        "INSUFFICIENT_CREDITS"
      ) {
        return res.status(402).json({
          success: false,

          code:
            "INSUFFICIENT_CREDITS",

          message:
            error.message,

          data: {
            requiredCredits:
              error.requiredCredits,

            availableBalance:
              error.availableBalance
          }
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to submit application."
      });

    } finally {
      connection.release();
    }
  };
const updateConvenientTime =
  async (
    req,
    res
  ) => {
    try {
      const profileId =
        getAuthenticatedProfileId(
          req
        );

      const {
        responseId
      } =
        req.params;

      const {
        convenientTime
      } =
        req.body || {};

      if (!profileId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated profile is required"
        });
      }

      if (!responseId) {
        return res.status(400).json({
          success: false,
          message:
            "Response ID is required"
        });
      }

      const normalizedTime =
        String(
          convenientTime || ""
        ).trim();

      if (!normalizedTime) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide your convenient time to connect."
        });
      }

      const updatedResponse =
        await AdvertisementResponseModel
          .updateConvenientTime({
            responseId,
            profileId,
            convenientTime:
              normalizedTime
          });

      if (!updatedResponse) {
        return res.status(404).json({
          success: false,
          message:
            "Advertisement response was not found."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Convenient time updated successfully.",
        data:
          updatedResponse
      });

    } catch (error) {
      console.error(
        "[AdvertisementResponseController] updateConvenientTime:",
        error
      );

      if (
        error?.code ===
        "FORBIDDEN_RESPONSE_ACCESS"
      ) {
        return res.status(403).json({
          success: false,
          message:
            error.message
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to update convenient time."
      });
    }
  };



const updateAdvertisementResponse =
  async (
    req,
    res
  ) => {
    const ownerProfileId =
      getAuthenticatedProfileId(
        req
      );

    const {
      responseId
    } = req.params;

    const {
      responseStatus,
      remarks
    } = req.body || {};

    const normalizedStatus =
      String(
        responseStatus || ""
      )
        .trim()
        .toUpperCase();

    const normalizedRemarks =
      String(
        remarks || ""
      ).trim();

    if (!ownerProfileId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated profile is required"
      });
    }

    if (!responseId) {
      return res.status(400).json({
        success: false,
        message:
          "Response ID is required"
      });
    }

    /*
     * Chargeable/configurable lifecycle
     * actions use one atomic transaction.
     *
     * SHORTLISTED uses shortlistCost.
     * MUTUAL uses mutualInterestCost.
     *
     * HOLD and NOT_INTERESTED remain
     * normal non-credit status changes.
     */
    const usesCreditTransaction =
      [
        "SHORTLISTED",
        "MUTUAL"
      ].includes(
        normalizedStatus
      );

    if (
      !usesCreditTransaction
    ) {
      try {
        const updatedResponse =
          await AdvertisementResponseModel
            .updateOwnerDecision({
              responseId,
              ownerProfileId,
              responseStatus:
                normalizedStatus,
              ownerRemarks:
                normalizedRemarks
            });

        if (!updatedResponse) {
          return res.status(404).json({
            success: false,
            message:
              "Advertisement response was not found or does not belong to your advertisement"
          });
        }

        return res.status(200).json({
          success: true,
          message:
            "Advertisement response updated successfully",
          data:
            updatedResponse
        });

      } catch (error) {
        console.error(
          "[AdvertisementResponseController] updateAdvertisementResponse:",
          error
        );

        return res.status(400).json({
          success: false,
          message:
            error.message ||
            "Unable to update advertisement response"
        });
      }
    }

    /*
     * SHORTLIST:
     *
     * Status transition and credit debit
     * must succeed or fail together.
     */
    const connection =
      await db.getConnection();

    try {
      await connection
        .beginTransaction();

      const configuration =
        await creditModel
          .getCreditConfiguration();

      const actionCost =
        normalizedStatus ===
        "MUTUAL"
          ? Number(
              configuration
                .mutualInterestCost || 0
            )
          : Number(
              configuration
                .shortlistCost || 0
            );

      const updatedResponse =
        await AdvertisementResponseModel
          .updateOwnerDecision({
            responseId,
            ownerProfileId,
            responseStatus:
              normalizedStatus,
            ownerRemarks:
              normalizedRemarks,
            connection
          });

      if (!updatedResponse) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Advertisement response was not found or does not belong to your advertisement"
        });
      }

      const creditResult =
        await creditModel
          .debitCreditsWithConnection({
            connection,

            profileId:
              ownerProfileId,

            transactionType:
              normalizedStatus ===
              "MUTUAL"
                ? "ADVERTISEMENT_MUTUAL"
                : "ADVERTISEMENT_SHORTLIST",

            referenceType:
              "ADVERTISEMENT_RESPONSE",

            referenceId:
              responseId,

            credits:
              actionCost,

            description:
              normalizedStatus ===
              "MUTUAL"
                ? `Mutual Interest confirmed for advertisement response ${responseId}`
                : `Shortlisted advertisement response ${responseId}`
          });

      await connection.commit();

      const successMessage =
        normalizedStatus ===
        "MUTUAL"
          ? (
              actionCost > 0
                ? `Mutual Interest confirmed. ${actionCost} credit points used.`
                : "Mutual Interest confirmed."
            )
          : (
              actionCost > 0
                ? `Profile shortlisted. ${actionCost} credit points used. Clarification request sent to the member.`
                : "Profile shortlisted. Clarification request sent to the member."
            );

      return res.status(200).json({
        success: true,

        message:
          successMessage,

        data: {
          ...updatedResponse,

          credit: {
            cost:
              actionCost,

            debited:
              creditResult
                .debited,

            balanceBefore:
              creditResult
                .balanceBefore,

            balanceAfter:
              creditResult
                .balanceAfter,

            lowCredit:
              creditResult
                .balanceAfter <=
              configuration
                .lowCreditThreshold,

            lowCreditThreshold:
              configuration
                .lowCreditThreshold
          }
        }
      });

    } catch (error) {
      try {
        await connection
          .rollback();
      } catch {
        // Ignore rollback failure.
      }

      console.error(
        `[AdvertisementResponseController] ${normalizedStatus}:`,
        error
      );

      if (
        error.code ===
        "INSUFFICIENT_CREDITS"
      ) {
        return res.status(402).json({
          success: false,

          code:
            "INSUFFICIENT_CREDITS",

          message:
            error.message,

          data: {
            requiredCredits:
              error
                .requiredCredits,

            availableBalance:
              error
                .availableBalance
          }
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          (
            normalizedStatus ===
            "MUTUAL"
              ? "Unable to confirm Mutual Interest."
              : "Unable to shortlist this profile."
          )
      });

    } finally {
      connection.release();
    }
  };
  
module.exports = {
  createResponse,
  getMyAdvertisementResponses,
  applyAfterShortlist,
  getMySentAdvertisementResponses,
  updateConvenientTime,
  updateAdvertisementResponse
};

