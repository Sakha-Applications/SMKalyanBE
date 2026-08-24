const pool = require("../config/db");
console.log("✅ contactDetailsModel.js loaded");

const findContactDetails = async ({ profileId, profileFor, minAge, maxAge, gotra }) => {
    try {
        let query = `
            SELECT *
            FROM profile
            WHERE 1=1
        `;
        let values = [];

        if (profileId) {
            query += ` AND profile_id = ?`;
            values.push(profileId);
        }
        if (profileFor) {
            query += ` AND profile_for = ?`;
            values.push(profileFor);
        }
        if (minAge && maxAge) {
            query += ` AND current_age BETWEEN ? AND ?`;
            values.push(parseInt(minAge), parseInt(maxAge));
        } else if (minAge) {
            query += ` AND current_age >= ?`;
            values.push(parseInt(minAge));
        } else if (maxAge) {
            query += ` AND current_age <= ?`;
            values.push(parseInt(maxAge));
        }
        if (gotra) {
            query += ` AND gotra != ?`;
            values.push(gotra);
        }

        query += " ORDER BY current_age ASC";
        console.log("Executing query:", query, "with values:", values);

        const [rows] = await pool.execute(query, values);
        return rows;
    } catch (error) {
        console.error("❌ Error finding contact details in model:", error);
        throw error;
        }
};

const recordShare = async (shareData) => {
    try {
        const {
            shared_with_profile_id,
            shared_with_email,
            shared_profile_id,
            shared_profile_name,
            shared_at
        } = shareData;

        // Count how many times this user has shared contact details
        const countQuery = `
            SELECT COUNT(*) as shareCount
            FROM contact_details_shared
            WHERE shared_with_profile_id = ?
        `;
        const [countResult] = await pool.execute(countQuery, [shared_with_profile_id]);
        const currentCount = countResult[0]?.shareCount || 0;
        const newCount = currentCount + 1;

        const insertQuery = `
            INSERT INTO contact_details_shared
            (shared_with_profile_id, shared_with_email, shared_profile_id, shared_profile_name, shared_at, shared_count)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
            shared_with_profile_id,
            shared_with_email,
            shared_profile_id,
            shared_profile_name,
            shared_at,
            newCount
        ];
        const [result] = await pool.execute(insertQuery, insertValues);

        return result.affectedRows > 0;
    } catch (error) {
        console.error("❌ Error recording contact details share:", error);
        throw error;
    }
};

const countUniqueSharedContacts = async (userProfileId) => {
    try {
        const query = `
            SELECT MAX(shared_count) AS uniqueCount
            FROM contact_details_shared
            WHERE shared_with_profile_id = ?
        `;
        const values = [userProfileId];
        const [rows] = await pool.execute(query, values);
        return rows[0]?.uniqueCount || 0;
    } catch (error) {
        console.error("❌ Error counting unique shared contacts from shared_count:", error);
        throw error;
    }
};

const findExistingShare = async (userProfileId, sharedProfileId) => {
    try {
        const query = `
            SELECT *
            FROM contact_details_shared
            WHERE shared_with_profile_id = ? AND shared_profile_id = ?
        `;
        const values = [userProfileId, sharedProfileId];
        const [rows] = await pool.execute(query, values);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("❌ Error finding existing share:", error);
        throw error;
    }
};

// New function to reset shared contacts for a profile after renewal
const resetSharedContactsForProfile = async (profileId) => {
    try {
        console.log("🔄 Resetting shared contacts for profile:", profileId);
        const query = `
            DELETE FROM contact_details_shared
            WHERE shared_with_profile_id = ?
        `;
        const values = [profileId];
        const [result] = await pool.execute(query, values);
        
        console.log(`✅ Successfully deleted ${result.affectedRows} shared contact records for profile ${profileId}`);
        return result.affectedRows;
    } catch (error) {
        console.error("❌ Error resetting shared contacts for profile:", error);
        throw error;
    }
};

const findContactRequest = async (
    requesterProfileId,
    targetProfileId
) => {
    const query = `
        SELECT *
        FROM contact_requests
        WHERE requester_profile_id = ?
          AND target_profile_id = ?
        LIMIT 1
    `;

    const [rows] = await pool.execute(query, [
        requesterProfileId,
        targetProfileId
    ]);

    return rows.length > 0 ? rows[0] : null;
};


const createOrReopenContactRequest = async ({
    requesterProfileId,
    requesterEmail,
    targetProfileId,
    requesterMessage = ""
}) => {
    const existing = await findContactRequest(
        requesterProfileId,
        targetProfileId
    );

    if (existing) {
        const currentStatus = (
            existing.status || ""
        ).toUpperCase();

        if (currentStatus === "PENDING") {
            return existing;
        }

        if (currentStatus === "APPROVED") {
            return existing;
        }

        const query = `
            UPDATE contact_requests
            SET
                status = 'PENDING',
                requester_email = ?,
                requester_message = ?,
                moderator_remarks = NULL,
                reviewed_by = NULL,
                reviewed_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await pool.execute(query, [
            requesterEmail || null,
            requesterMessage || null,
            existing.id
        ]);

        const updated = await getContactRequestById(
            existing.id
        );

        return updated;
    }

    const query = `
        INSERT INTO contact_requests
        (
            requester_profile_id,
            requester_email,
            target_profile_id,
            status,
            requester_message
        )
        VALUES (?, ?, ?, 'PENDING', ?)
    `;

    const [result] = await pool.execute(query, [
        requesterProfileId,
        requesterEmail || null,
        targetProfileId,
        requesterMessage || null
    ]);

    return getContactRequestById(result.insertId);
};

const listContactRequestsForRequester = async (
    requesterProfileId
) => {
    const query = `
        SELECT
            cr.id,
            cr.requester_profile_id,
            cr.target_profile_id,
            cr.status,
            cr.requester_message,
            cr.moderator_remarks,
            cr.reviewed_by,
            cr.reviewed_at,
            cr.created_at,
            cr.updated_at,

            target.name AS target_name

        FROM contact_requests cr

        LEFT JOIN profile target
            ON target.profile_id =
               cr.target_profile_id

        WHERE cr.requester_profile_id = ?

        ORDER BY
            cr.updated_at DESC,
            cr.id DESC
    `;

    const [rows] = await pool.execute(
        query,
        [requesterProfileId]
    );

    return rows;
};

const listContactRequestsForMember = async (
    memberProfileId
) => {
    const query = `
        SELECT
            cr.id,
            cr.requester_profile_id,
            cr.target_profile_id,
            cr.status,
            cr.requester_message,
            cr.moderator_remarks,
            cr.reviewed_by,
            cr.reviewed_at,
            cr.created_at,
            cr.updated_at,

            CASE
                WHEN cr.requester_profile_id = ?
                    THEN cr.target_profile_id
                ELSE cr.requester_profile_id
            END AS other_profile_id,

            CASE
                WHEN cr.requester_profile_id = ?
                    THEN target.name
                ELSE requester.name
            END AS other_profile_name

        FROM contact_requests cr

        LEFT JOIN profile requester
            ON requester.profile_id =
               cr.requester_profile_id

        LEFT JOIN profile target
            ON target.profile_id =
               cr.target_profile_id

        WHERE
            cr.requester_profile_id = ?
            OR cr.target_profile_id = ?

        ORDER BY
            cr.updated_at DESC,
            cr.id DESC
    `;

    const [rows] =
        await pool.execute(
            query,
            [
                memberProfileId,
                memberProfileId,
                memberProfileId,
                memberProfileId
            ]
        );

    return rows;
};

const getContactRequestById = async (requestId) => {
    const query = `
        SELECT
            cr.*,

            requester.name AS requester_name,
            requester.email AS requester_profile_email,
            requester.phone AS requester_phone,

            target.name AS target_name,
            target.email AS target_email,
            target.phone AS target_phone

        FROM contact_requests cr

        LEFT JOIN profile requester
            ON requester.profile_id =
               cr.requester_profile_id

        LEFT JOIN profile target
            ON target.profile_id =
               cr.target_profile_id

        WHERE cr.id = ?
        LIMIT 1
    `;

    const [rows] = await pool.execute(
        query,
        [requestId]
    );

    return rows.length > 0 ? rows[0] : null;
};


const listContactRequests = async (
    status = "PENDING"
) => {
    let query = `
        SELECT
            cr.*,

            requester.name AS requester_name,
            requester.email AS requester_profile_email,
            requester.phone AS requester_phone,
            requester.profile_status
                AS requester_profile_status,

            target.name AS target_name,
            target.email AS target_email,
            target.phone AS target_phone,
            target.profile_status
                AS target_profile_status

        FROM contact_requests cr

        LEFT JOIN profile requester
            ON requester.profile_id =
               cr.requester_profile_id

        LEFT JOIN profile target
            ON target.profile_id =
               cr.target_profile_id

        WHERE 1 = 1
    `;

    const values = [];

    if (status) {
        query += `
            AND UPPER(cr.status) = UPPER(?)
        `;
        values.push(status);
    }

    query += `
        ORDER BY cr.created_at ASC, cr.id ASC
    `;

    const [rows] = await pool.execute(
        query,
        values
    );

    return rows;
};


const updateContactRequestStatus = async ({
    requestId,
    status,
    moderatorRemarks,
    reviewedBy
}) => {
    const query = `
        UPDATE contact_requests
        SET
            status = ?,
            moderator_remarks = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
        status,
        moderatorRemarks || null,
        reviewedBy || null,
        requestId
    ]);

    return result.affectedRows > 0;
};


const recordContactRequestHistory = async ({
    requestId,
    action,
    actionBy,
    remarks
}) => {
    const query = `
        INSERT INTO contact_request_history
        (
            contact_request_id,
            action,
            action_by,
            remarks
        )
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
        requestId,
        action,
        actionBy || null,
        remarks || null
    ]);

    return result.insertId;
};


const getContactRequestHistory = async (
    requestId
) => {
    const query = `
        SELECT *
        FROM contact_request_history
        WHERE contact_request_id = ?
        ORDER BY created_at ASC, id ASC
    `;

    const [rows] = await pool.execute(
        query,
        [requestId]
    );

    return rows;
};

module.exports = {
    findContactDetails,
    recordShare,
    countUniqueSharedContacts,
    findExistingShare,
    resetSharedContactsForProfile,

    findContactRequest,
    createOrReopenContactRequest,
    listContactRequestsForRequester,
    listContactRequestsForMember,
    getContactRequestById,
    listContactRequests,
    updateContactRequestStatus,
    recordContactRequestHistory,
    getContactRequestHistory
};