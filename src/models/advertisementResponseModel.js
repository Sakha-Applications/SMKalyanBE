const db = require("../config/db");

class AdvertisementResponseModel {
  static async createResponse({
    advertisementId,
    responderProfileId,
    responseType,
    responderRemarks,
    connection = db
  }) {
    const normalizedType =
      String(responseType || "")
        .trim()
        .toUpperCase();

    if (
      !["INTEREST", "APPLY"].includes(
        normalizedType
      )
    ) {
      throw new Error(
        "Invalid advertisement response type"
      );
    }

    const [advertisementRows] =
      await connection.execute(
        `
          SELECT
            id,
            profile_id,
            status,
            preferred_flag
          FROM preferred_profiles
          WHERE id = ?
            AND status = 'active'
            AND preferred_flag = 1
          LIMIT 1
        `,
        [advertisementId]
      );

    if (
      advertisementRows.length === 0
    ) {
      throw new Error(
        "Published advertisement not found"
      );
    }

    const advertisement =
      advertisementRows[0];

    if (
      String(
        advertisement.profile_id
      ) ===
      String(responderProfileId)
    ) {
      throw new Error(
        "You cannot respond to your own advertisement"
      );
    }

    /*
     * A member may respond to an advertisement
     * only once.
     *
     * INTEREST and APPLY are alternative
     * responder actions, not separate responses.
     *
     * Example:
     * - If INTEREST already exists, APPLY is blocked.
     * - If APPLY already exists, INTEREST is blocked.
     */
    const [existingRows] =
      await connection.execute(
        `
          SELECT
            id,
            response_type,
            response_status
          FROM advertisement_responses
          WHERE advertisement_id = ?
            AND responder_profile_id = ?
          ORDER BY id DESC
          LIMIT 1
        `,
        [
          advertisementId,
          responderProfileId
        ]
      );

    if (
      existingRows.length > 0
    ) {
      return {
        duplicate: true,

        id:
          existingRows[0].id,

        existingResponseType:
          existingRows[0]
            .response_type,

        existingResponseStatus:
          existingRows[0]
            .response_status
      };
    }

    const [result] =
      await connection.execute(
        `
          INSERT INTO advertisement_responses (
            advertisement_id,
            owner_profile_id,
            responder_profile_id,
            response_type,
            response_status,
            responder_remarks
          )
          VALUES (
            ?, ?, ?, ?, 'NEW', ?
          )
        `,
        [
          advertisementId,
          advertisement.profile_id,
          responderProfileId,
          normalizedType,
          responderRemarks || null
        ]
      );

    return {
      duplicate: false,
      id: result.insertId
    };
  }


  static async getResponsesForOwner(
    ownerProfileId
  ) {
    const [rows] =
      await db.execute(
        `
          SELECT
            ar.id,
            ar.advertisement_id,
            ar.owner_profile_id,
            ar.responder_profile_id,
            ar.response_type,
            ar.response_status,
            ar.responder_remarks,
            ar.owner_remarks,
            pp.advertiser_convenient_time
              AS owner_convenient_time,
            ar.responder_convenient_time,
            ar.created_at,
            ar.updated_at,

            p.name AS responder_name,
            p.current_age,
            p.education,
            p.profession,
            p.designation,
            p.current_location,
            p.annual_income,
            p.gotra,
            p.mother_tongue

          FROM advertisement_responses ar

          LEFT JOIN profile p
            ON p.profile_id =
               ar.responder_profile_id

          LEFT JOIN preferred_profiles pp
            ON pp.id =
               ar.advertisement_id

          WHERE ar.owner_profile_id = ?

          ORDER BY
            ar.created_at DESC,
            ar.id DESC
        `,
        [ownerProfileId]
      );

    return rows;
  }

  static async getResponsesForResponder(
    responderProfileId
  ) {
    const [rows] =
      await db.execute(
        `
          SELECT
            ar.id,
            ar.advertisement_id,
            ar.owner_profile_id,
            ar.responder_profile_id,
            ar.response_type,
            ar.response_status,
            ar.responder_remarks,
            ar.owner_remarks,
            pp.advertiser_convenient_time
              AS owner_convenient_time,
            ar.responder_convenient_time,
            ar.created_at,
            ar.updated_at,

            p.name AS owner_name,
            p.current_age AS owner_current_age,
            p.education AS owner_education,
            p.profession AS owner_profession,
            p.designation AS owner_designation,
            p.current_location AS owner_current_location,
            p.annual_income AS owner_annual_income,
            p.gotra AS owner_gotra,
            p.mother_tongue AS owner_mother_tongue,

            pp.looking_for,
            pp.status AS advertisement_status

          FROM advertisement_responses ar

          LEFT JOIN profile p
            ON p.profile_id =
               ar.owner_profile_id

          LEFT JOIN preferred_profiles pp
            ON pp.id =
               ar.advertisement_id

          WHERE ar.responder_profile_id = ?

          ORDER BY
            ar.created_at DESC,
            ar.id DESC
        `,
        [responderProfileId]
      );

    return rows;
  }

  static async updateOwnerDecision({
    responseId,
    ownerProfileId,
    responseStatus,
    ownerRemarks,
    connection = db
  }) {
    const normalizedStatus =
      String(responseStatus || "")
        .trim()
        .toUpperCase();

    const allowedStatuses = [
      "MUTUAL",
      "SHORTLISTED",
      "HOLD",
      "NOT_INTERESTED"
    ];

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        "Invalid advertisement response status"
      );
    }

    /*
     * Confirm that the logged-in member
     * owns this advertisement response.
     */
    const [existingRows] =
      await connection.execute(
        `
          SELECT
            id,
            advertisement_id,
            owner_profile_id,
            responder_profile_id,
            response_type,
            response_status
          FROM advertisement_responses
          WHERE id = ?
            AND owner_profile_id = ?
          LIMIT 1
        `,
        [
          responseId,
          ownerProfileId
        ]
      );

    if (
      existingRows.length === 0
    ) {
      return null;
    }

    const response =
      existingRows[0];

    const currentStatus =
      String(
        response.response_status ||
        ""
      )
        .trim()
        .toUpperCase();

    const currentType =
      String(
        response.response_type ||
        ""
      )
        .trim()
        .toUpperCase();

    /*
     * Business lifecycle:
     *
     * INTEREST
     *   -> SHORTLISTED
     *   -> APPLIED
     *   -> MUTUAL
     *
     * Direct APPLY may move to MUTUAL
     * because the responder has already
     * explicitly chosen to proceed.
     */

    if (
      normalizedStatus ===
      "SHORTLISTED"
    ) {
      if (
        currentType !==
        "INTEREST"
      ) {
        throw new Error(
          "Only an interest response can be shortlisted."
        );
      }

      if (
        ![
          "NEW",
          "HOLD"
        ].includes(
          currentStatus
        )
      ) {
        throw new Error(
          "This interest has already progressed and cannot be shortlisted again."
        );
      }

      if (
        !String(
          ownerRemarks || ""
        ).trim()
      ) {
        throw new Error(
          "Please provide the clarification or additional information required before shortlisting this profile."
        );
      }
    }

    if (
      normalizedStatus ===
      "MUTUAL"
    ) {
      if (
        currentStatus !==
        "APPLIED"
      ) {
        throw new Error(
          "Mutual Interest can be confirmed only after the member has applied."
        );
      }
    }

    const storedStatus =
      normalizedStatus;

    await connection.execute(
      `
        UPDATE advertisement_responses
        SET
          response_status = ?,
          owner_remarks = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND owner_profile_id = ?
      `,
      [
        storedStatus,
        ownerRemarks || null,
        responseId,
        ownerProfileId
      ]
    );

    const [updatedRows] =
      await connection.execute(
        `
          SELECT
            id,
            advertisement_id,
            owner_profile_id,
            responder_profile_id,
            response_type,
            response_status,
            responder_remarks,
            owner_remarks,
            created_at,
            updated_at
          FROM advertisement_responses
          WHERE id = ?
          LIMIT 1
        `,
        [responseId]
      );

    return updatedRows.length > 0
      ? updatedRows[0]
      : null;
  }
  static async applyAfterShortlist({
    responseId,
    responderProfileId,
    responderRemarks,
    connection = db
  }) {
    const [existingRows] =
      await connection.execute(
        `
          SELECT
            id,
            advertisement_id,
            owner_profile_id,
            responder_profile_id,
            response_type,
            response_status,
            responder_remarks
          FROM advertisement_responses
          WHERE id = ?
            AND responder_profile_id = ?
          LIMIT 1
        `,
        [
          responseId,
          responderProfileId
        ]
      );

    if (
      existingRows.length === 0
    ) {
      return null;
    }

    const response =
      existingRows[0];

    const currentStatus =
      String(
        response.response_status ||
        ""
      )
        .trim()
        .toUpperCase();

    const currentType =
      String(
        response.response_type ||
        ""
      )
        .trim()
        .toUpperCase();

    if (
      currentType !==
      "INTEREST"
    ) {
      throw new Error(
        "Only a shortlisted interest can progress to Apply."
      );
    }

    if (
      currentStatus !==
      "SHORTLISTED"
    ) {
      throw new Error(
        "You can apply only after the advertisement owner has shortlisted your interest."
      );
    }

    const applicationRemarks =
      String(
        responderRemarks || ""
      ).trim();

    if (!applicationRemarks) {
      throw new Error(
        "Please provide your response to the clarification before applying."
      );
    }

    await connection.execute(
      `
        UPDATE advertisement_responses
        SET
          response_status = 'APPLIED',
          responder_remarks =
            CASE
              WHEN responder_remarks IS NULL
                OR TRIM(responder_remarks) = ''
              THEN ?
              ELSE CONCAT(
                responder_remarks,
                '\\n\\nApplication / Clarification Response: ',
                ?
              )
            END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND responder_profile_id = ?
      `,
      [
        applicationRemarks,
        applicationRemarks,
        responseId,
        responderProfileId
      ]
    );

    const [updatedRows] =
      await connection.execute(
        `
          SELECT
            id,
            advertisement_id,
            owner_profile_id,
            responder_profile_id,
            response_type,
            response_status,
            responder_remarks,
            owner_remarks,
            created_at,
            updated_at
          FROM advertisement_responses
          WHERE id = ?
          LIMIT 1
        `,
        [responseId]
      );

    return updatedRows.length > 0
      ? updatedRows[0]
      : null;
  }
  static async updateConvenientTime({
    responseId,
    profileId,
    convenientTime
  }) {
    const normalizedTime =
      String(
        convenientTime || ""
      ).trim();

    if (!normalizedTime) {
      throw new Error(
        "Convenient time is required."
      );
    }

    if (
      normalizedTime.length > 255
    ) {
      throw new Error(
        "Convenient time cannot exceed 255 characters."
      );
    }

    const [rows] =
      await db.execute(
        `
          SELECT
            id,
            advertisement_id,
            owner_profile_id,
            responder_profile_id
          FROM advertisement_responses
          WHERE id = ?
          LIMIT 1
        `,
        [
          responseId
        ]
      );

    if (rows.length === 0) {
      return null;
    }

    const response =
      rows[0];

    const isOwner =
      String(
        response.owner_profile_id
      ) ===
      String(profileId);

    const isResponder =
      String(
        response.responder_profile_id
      ) ===
      String(profileId);

    if (
      !isOwner &&
      !isResponder
    ) {
      const error =
        new Error(
          "You are not part of this advertisement response."
        );

      error.code =
        "FORBIDDEN_RESPONSE_ACCESS";

      throw error;
    }

    if (isOwner) {
      await db.execute(
        `
          UPDATE preferred_profiles
          SET
            advertiser_convenient_time = ?,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = ?
            AND profile_id = ?
        `,
        [
          normalizedTime,
          response.advertisement_id,
          profileId
        ]
      );
    } else {
      await db.execute(
        `
          UPDATE advertisement_responses
          SET
            responder_convenient_time = ?,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          normalizedTime,
          responseId
        ]
      );
    }

    const [updatedRows] =
      await db.execute(
        `
          SELECT
            id,
            advertisement_id,
            owner_profile_id,
            responder_profile_id,
            response_type,
            response_status,
            responder_remarks,
            owner_remarks,
            owner_convenient_time,
            responder_convenient_time,
            created_at,
            updated_at
          FROM advertisement_responses
          WHERE id = ?
          LIMIT 1
        `,
        [
          responseId
        ]
      );

    return updatedRows.length > 0
      ? updatedRows[0]
      : null;
  }


  static async hasMutualRelationship(
    firstProfileId,
    secondProfileId
  ) {
    const [rows] =
      await db.execute(
        `
          SELECT id
          FROM advertisement_responses
          WHERE response_status = 'MUTUAL'
            AND (
              (
                owner_profile_id = ?
                AND responder_profile_id = ?
              )
              OR
              (
                owner_profile_id = ?
                AND responder_profile_id = ?
              )
            )
          LIMIT 1
        `,
        [
          firstProfileId,
          secondProfileId,
          secondProfileId,
          firstProfileId
        ]
      );

    return rows.length > 0;
  }



  static async getResponseCounts(
    ownerProfileId
  ) {
    const [rows] =
      await db.execute(
        `
          SELECT
            COUNT(*) AS total_responses,

            SUM(
              CASE
                WHEN response_type =
                     'INTEREST'
                THEN 1
                ELSE 0
              END
            ) AS interest_count,

            SUM(
              CASE
                WHEN response_type =
                     'APPLY'
                THEN 1
                ELSE 0
              END
            ) AS application_count,

            SUM(
              CASE
                WHEN response_status =
                     'SHORTLISTED'
                THEN 1
                ELSE 0
              END
            ) AS shortlisted_count,

            SUM(
              CASE
                WHEN response_status =
                     'MUTUAL'
                THEN 1
                ELSE 0
              END
            ) AS mutual_count

          FROM advertisement_responses
          WHERE owner_profile_id = ?
        `,
        [ownerProfileId]
      );

    return rows[0] || {};
  }
}

module.exports =
  AdvertisementResponseModel;