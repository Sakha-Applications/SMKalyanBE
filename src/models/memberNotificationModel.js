const db =
  require("../config/db");

class MemberNotificationModel {
  static async createNotification({
    profileId,
    notificationType,
    category = "SYSTEM",
    title,
    message,
    referenceType = null,
    referenceId = null,
    priority = 50,
    createdBy = "SYSTEM"
  }) {
    if (!profileId) {
      throw new Error(
        "Profile ID is required for member notification"
      );
    }

    const [result] =
      await db.execute(
        `
          INSERT INTO member_notifications (
            profile_id,
            notification_type,
            category,
            title,
            message,
            reference_type,
            reference_id,
            priority,
            is_read,
            created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `,
        [
          String(profileId),
          String(
            notificationType ||
            "SYSTEM_MESSAGE"
          ),
          String(
            category ||
            "SYSTEM"
          ),
          String(
            title ||
            "System Notification"
          ),
          String(
            message ||
            ""
          ),
          referenceType
            ? String(referenceType)
            : null,
          referenceId
            ? String(referenceId)
            : null,
          Number.isFinite(
            Number(priority)
          )
            ? Number(priority)
            : 50,
          createdBy
            ? String(createdBy)
            : "SYSTEM"
        ]
      );

    return {
      id:
        result.insertId,
      profile_id:
        String(profileId),
      notification_type:
        String(
          notificationType ||
          "SYSTEM_MESSAGE"
        ),
      category:
        String(
          category ||
          "SYSTEM"
        ),
      title:
        String(
          title ||
          "System Notification"
        ),
      message:
        String(
          message ||
          ""
        ),
      reference_type:
        referenceType ||
        null,
      reference_id:
        referenceId ||
        null,
      priority:
        Number(priority) || 50,
      is_read:
        0
    };
  }

  static async getByProfileId(
    profileId
  ) {
    const [rows] =
      await db.execute(
        `
          SELECT
            id,
            profile_id,
            notification_type,
            category,
            title,
            message,
            reference_type,
            reference_id,
            priority,
            is_read,
            created_by,
            created_at,
            read_at
          FROM member_notifications
          WHERE profile_id = ?
          ORDER BY
            is_read ASC,
            priority DESC,
            created_at DESC,
            id DESC
          LIMIT 100
        `,
        [
          String(profileId)
        ]
      );

    return rows;
  }

  static async markRead({
    notificationId,
    profileId
  }) {
    const [result] =
      await db.execute(
        `
          UPDATE member_notifications
          SET
            is_read = 1,
            read_at =
              CASE
                WHEN read_at IS NULL
                  THEN CURRENT_TIMESTAMP
                ELSE read_at
              END
          WHERE id = ?
            AND profile_id = ?
        `,
        [
          notificationId,
          String(profileId)
        ]
      );

    return (
      result.affectedRows > 0
    );
  }
}

module.exports =
  MemberNotificationModel;
