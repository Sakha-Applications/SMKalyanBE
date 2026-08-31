const db =
  require("../config/db");

const ALLOWED_STATUSES = [
  "PENDING",
  "CONTACTED",
  "DISCUSSION_SCHEDULED",
  "COMPLETED",
  "NO_RESPONSE",
  "CLOSED"
];

const normalizeStatus = (
  value
) =>
  String(
    value || "PENDING"
  )
    .trim()
    .toUpperCase();

class ConsultationFollowupModel {

  static async getAll() {
    const [rows] =
      await db.execute(
        `
          SELECT
            ar.id
              AS advertisement_response_id,

            ar.advertisement_id,

            ar.owner_profile_id,
            ar.responder_profile_id,

            ar.response_type,
            ar.response_status,

            ar.responder_remarks,
            ar.owner_remarks,

            ar.created_at
              AS response_created_at,

            ar.updated_at
              AS response_updated_at,

            owner.name
              AS owner_name,

            owner.phone
              AS owner_phone,

            responder.name
              AS responder_name,

            responder.phone
              AS responder_phone,

            cf.id
              AS consultation_followup_id,

            COALESCE(
              cf.consultation_status,
              'PENDING'
            )
              AS consultation_status,

            cf.convenient_time,
            cf.consultation_remarks,
            cf.next_follow_up_at,
            cf.updated_by,

            cf.created_at
              AS consultation_created_at,

            cf.updated_at
              AS consultation_updated_at

          FROM advertisement_responses ar

          LEFT JOIN profile owner
            ON owner.profile_id =
               ar.owner_profile_id

          LEFT JOIN profile responder
            ON responder.profile_id =
               ar.responder_profile_id

          LEFT JOIN consultation_followups cf
            ON cf.advertisement_response_id =
               ar.id

          WHERE UPPER(
            IFNULL(
              ar.response_status,
              ''
            )
          ) = 'MUTUAL'

          ORDER BY
            CASE
              WHEN cf.next_follow_up_at
                   IS NULL
              THEN 1
              ELSE 0
            END,

            cf.next_follow_up_at ASC,

            ar.updated_at DESC,

            ar.id DESC
        `
      );

    return rows;
  }


  static async getByResponseId(
    advertisementResponseId
  ) {
    const [rows] =
      await db.execute(
        `
          SELECT
            ar.id
              AS advertisement_response_id,

            ar.advertisement_id,

            ar.owner_profile_id,
            ar.responder_profile_id,

            ar.response_type,
            ar.response_status,

            ar.responder_remarks,
            ar.owner_remarks,

            owner.name
              AS owner_name,

            owner.phone
              AS owner_phone,

            responder.name
              AS responder_name,

            responder.phone
              AS responder_phone,

            cf.id
              AS consultation_followup_id,

            COALESCE(
              cf.consultation_status,
              'PENDING'
            )
              AS consultation_status,

            cf.convenient_time,
            cf.consultation_remarks,
            cf.next_follow_up_at,
            cf.updated_by,

            cf.created_at
              AS consultation_created_at,

            cf.updated_at
              AS consultation_updated_at

          FROM advertisement_responses ar

          LEFT JOIN profile owner
            ON owner.profile_id =
               ar.owner_profile_id

          LEFT JOIN profile responder
            ON responder.profile_id =
               ar.responder_profile_id

          LEFT JOIN consultation_followups cf
            ON cf.advertisement_response_id =
               ar.id

          WHERE ar.id = ?
            AND UPPER(
              IFNULL(
                ar.response_status,
                ''
              )
            ) = 'MUTUAL'

          LIMIT 1
        `,
        [
          advertisementResponseId
        ]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }


  static async save({
    advertisementResponseId,
    consultationStatus,
    convenientTime,
    consultationRemarks,
    nextFollowUpAt,
    updatedBy
  }) {

    const normalizedStatus =
      normalizeStatus(
        consultationStatus
      );

    if (
      !ALLOWED_STATUSES.includes(
        normalizedStatus
      )
    ) {
      const error =
        new Error(
          "Invalid consultation status."
        );

      error.code =
        "INVALID_CONSULTATION_STATUS";

      throw error;
    }

    /*
     * Consultation records are allowed
     * only for advertisement responses
     * that have reached MUTUAL.
     */
    const [responseRows] =
      await db.execute(
        `
          SELECT
            id
          FROM advertisement_responses
          WHERE id = ?
            AND UPPER(
              IFNULL(
                response_status,
                ''
              )
            ) = 'MUTUAL'
          LIMIT 1
        `,
        [
          advertisementResponseId
        ]
      );

    if (
      responseRows.length === 0
    ) {
      return null;
    }

    await db.execute(
      `
        INSERT INTO
          consultation_followups (
            advertisement_response_id,
            consultation_status,
            convenient_time,
            consultation_remarks,
            next_follow_up_at,
            updated_by
          )
        VALUES (
          ?, ?, ?, ?, ?, ?
        )

        ON DUPLICATE KEY UPDATE
          consultation_status =
            VALUES(
              consultation_status
            ),

          convenient_time =
            VALUES(
              convenient_time
            ),

          consultation_remarks =
            VALUES(
              consultation_remarks
            ),

          next_follow_up_at =
            VALUES(
              next_follow_up_at
            ),

          updated_by =
            VALUES(
              updated_by
            ),

          updated_at =
            CURRENT_TIMESTAMP
      `,
      [
        advertisementResponseId,
        normalizedStatus,
        String(
          convenientTime || ""
        ).trim() || null,
        String(
          consultationRemarks || ""
        ).trim() || null,
        nextFollowUpAt || null,
        updatedBy || null
      ]
    );

    return this.getByResponseId(
      advertisementResponseId
    );
  }
}


module.exports = {
  ConsultationFollowupModel,
  ALLOWED_STATUSES
};