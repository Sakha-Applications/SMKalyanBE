const MemberNotificationModel =
  require(
    "../models/memberNotificationModel"
  );

const getAuthenticatedProfileId = (
  req
) =>
  req.user?.profile_id ||
  req.user?.profileId ||
  req.user?.id ||
  null;

const getMyNotifications =
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
            "Authenticated profile is required"
        });
      }

      const notifications =
        await MemberNotificationModel
          .getByProfileId(
            profileId
          );

      return res.status(200).json({
        success: true,
        data:
          notifications
      });
    } catch (error) {
      console.error(
        "[MemberNotificationController] Unable to load notifications:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load member notifications"
      });
    }
  };

const markNotificationRead =
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
        notificationId
      } = req.params;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated profile is required"
        });
      }

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message:
            "Notification ID is required"
        });
      }

      const updated =
        await MemberNotificationModel
          .markRead({
            notificationId,
            profileId
          });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Notification marked as read"
      });
    } catch (error) {
      console.error(
        "[MemberNotificationController] Unable to mark notification as read:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update member notification"
      });
    }
  };

module.exports = {
  getMyNotifications,
  markNotificationRead
};
