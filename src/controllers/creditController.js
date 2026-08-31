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


const getMyCreditSummary =
  async (
    req,
    res
  ) => {
    try {
      const profileId =
        getAuthenticatedProfileId(
          req
        );

      if (!profileId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated profile is required."
        });
      }

      const summary =
        await creditModel
          .getBalanceSummary(
            profileId
          );

      const configuration =
        summary.configuration ||
        {};

      return res.status(200).json({
        success: true,

        data: {
          balance:
            Number(
              summary.balance ||
              0
            ),

          lowCreditThreshold:
            Number(
              summary
                .lowCreditThreshold ||
              0
            ),

          lowCredit:
            Boolean(
              summary.lowCredit
            ),

          recharge: {
            baseAmount:
              Number(
                configuration
                  .rechargeAmount ||
                0
              ),

            baseCredits:
              Number(
                configuration
                  .rechargeCreditPoints ||
                0
              )
          },

          actionCosts: {
            showInterest:
              Number(
                configuration
                  .showInterestCost ||
                0
              ),

            shortlist:
              Number(
                configuration
                  .shortlistCost ||
                0
              ),

            directApply:
              Number(
                configuration
                  .directApplyCost ||
                0
              ),

            mutualInterest:
              Number(
                configuration
                  .mutualInterestCost ||
                0
              ),

            contactView:
              Number(
                configuration
                  .contactViewCost ||
                0
              )
          }
        }
      });

    } catch (error) {
      console.error(
        "[CreditController] getMyCreditSummary:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to load credit information."
      });
    }
  };


module.exports = {
  getMyCreditSummary
};