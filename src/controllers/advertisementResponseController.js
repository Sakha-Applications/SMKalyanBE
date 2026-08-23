const AdvertisementResponseModel =
  require(
    "../models/advertisementResponseModel"
  );

const getAuthenticatedProfileId = (
  req
) =>
  req.user?.profile_id ||
  req.user?.profileId ||
  req.user?.id ||
  null;


const createResponse = async (
  req,
  res
) => {
  try {
    const responderProfileId =
      getAuthenticatedProfileId(req);

    const {
      advertisementId
    } = req.params;

    const {
      responseType,
      remarks
    } = req.body || {};

    if (
      !responderProfileId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated profile is required"
      });
    }

    if (
      !advertisementId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Advertisement ID is required"
      });
    }

    const result =
      await AdvertisementResponseModel
        .createResponse({
          advertisementId,
          responderProfileId,
          responseType,
          responderRemarks:
            String(
              remarks || ""
            ).trim()
        });

    return res.status(
      result.duplicate
        ? 200
        : 201
    ).json({
      success: true,

      message:
        result.duplicate
          ? "You have already submitted this response."
          : responseType ===
              "APPLY"
          ? "Application submitted."
          : "Interest submitted.",

      data: result
    });
  } catch (error) {
    console.error(
      "[AdvertisementResponseController] createResponse:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to submit advertisement response"
    });
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


const updateAdvertisementResponse =
  async (
    req,
    res
  ) => {
    try {
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

      const updatedResponse =
        await AdvertisementResponseModel
          .updateOwnerDecision({
            responseId,
            ownerProfileId,
            responseStatus,
            ownerRemarks:
              String(
                remarks || ""
              ).trim()
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
        data: updatedResponse
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
  };
  
module.exports = {
  createResponse,
  getMyAdvertisementResponses,
  getMySentAdvertisementResponses,
  updateAdvertisementResponse
};
