const db = require("../config/db");

class AdvertisementResponseModel {
  static async createResponse({
    advertisementId,
    responderProfileId,
    responseType,
    responderRemarks
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
      await db.execute(
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

    const [existingRows] =
      await db.execute(
        `
          SELECT id
          FROM advertisement_responses
          WHERE advertisement_id = ?
            AND responder_profile_id = ?
            AND response_type = ?
          LIMIT 1
        `,
        [
          advertisementId,
          responderProfileId,
          normalizedType
        ]
      );

    if (
      existingRows.length > 0
    ) {
      return {
        duplicate: true,
        id:
          existingRows[0].id
      };
    }

    const [result] =
      await db.execute(
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
    ownerRemarks
  }) {
    const normalizedStatus =
      String(responseStatus || "")
        .trim()
        .toUpperCase();

    const allowedStatuses = [
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
      await db.execute(
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

    /*
     * The responder has already expressed
     * positive intent through this specific
     * INTEREST or APPLY response.
     *
     * When the advertisement owner shortlists
     * this response, both parties have expressed
     * positive intent for this response and it
     * becomes MUTUAL.
     *
     * Important:
     * update only the selected response.
     * INTEREST and APPLY are separate actions
     * and may legitimately have different
     * owner decisions.
     */
    const storedStatus =
      normalizedStatus === "SHORTLISTED"
        ? "MUTUAL"
        : normalizedStatus;

    await db.execute(
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