// src/backend/models/InvitationModel.js

const pool = require("../config/db"); // Assuming your database connection pool is in config/db.js
const mysql = require('mysql2'); // For logging formatted queries

console.log("✅ InvitationModel.js loaded");

/**
 * Creates a new invitation record in the database.
 * @param {string} inviterProfileId - The profile_id of the user sending the invitation.
 * @param {string} inviteeProfileId - The profile_id of the user receiving the invitation.
 * @param {string|null} inviterMessage - Optional custom message from the inviter.
 * @returns {object} Result of the database insert operation.
 */
const createInvitation = async (inviterProfileId, inviteeProfileId, inviterMessage = null) => {
    const query = `
        INSERT INTO profile_invitations (inviter_profile_id, invitee_profile_id, inviter_message, status)
        VALUES (?, ?, ?, 'PENDING')
    `;
    const values = [inviterProfileId, inviteeProfileId, inviterMessage];

    try {
        console.log("🔍 SQL for createInvitation:", mysql.format(query, values));
        const [result] = await pool.execute(query, values);
        console.log("✅ Invitation created in DB:", result);
        return result;
    } catch (error) {
        console.error("❌ Error creating invitation in model:", error);
        throw error;
    }
};

/**
 * Retrieves all invitations received by a specific user.
 * Joins with the profile table to get inviter's name and other details.
 * @param {string} inviteeProfileId - The profile_id of the user whose invitations are being fetched.
 * @returns {Array<object>} List of received invitations with inviter's details.
 */
const getReceivedInvitations = async (inviteeProfileId) => {
    const query = `
        SELECT 
            pi.invitation_id,
            pi.inviter_profile_id,
            pi.invitee_profile_id,
            pi.status,
            pi.inviter_message,
            pi.sent_at,
            pi.viewed_at,
            p.name AS inviter_name,
            p.mother_tongue AS inviter_mother_tongue,
            p.current_age AS inviter_current_age,
            p.current_location AS inviter_current_location
            -- Add more inviter details as needed for display in the inbox
        FROM 
            profile_invitations pi
        JOIN 
            profile p ON pi.inviter_profile_id = p.profile_id
        WHERE 
            pi.invitee_profile_id = ?
        ORDER BY 
            pi.sent_at DESC;
    `;
    const values = [inviteeProfileId];

    try {
        console.log("🔍 SQL for getReceivedInvitations:", mysql.format(query, values));
        const [rows] = await pool.execute(query, values);
        console.log(`✅ Found ${rows.length} received invitations for ${inviteeProfileId}.`);
        return rows;
    } catch (error) {
        console.error("❌ Error fetching received invitations in model:", error);
        throw error;
    }
};

/**
 * Updates the status of an invitation.
 * @param {number} invitationId - The ID of the invitation to update.
 * @param {string} newStatus - The new status (e.g., 'VIEWED', 'ACCEPTED', 'REJECTED').
 * @returns {object} Result of the database update operation.
 */
const updateInvitationStatus = async (invitationId, newStatus) => {
    let query = `UPDATE profile_invitations SET status = ?`;
    const values = [newStatus];

    // If status is 'VIEWED', also update viewed_at timestamp
    if (newStatus === 'VIEWED') {
        query += `, viewed_at = CURRENT_TIMESTAMP`;
    }

    query += ` WHERE invitation_id = ?`;
    values.push(invitationId);

    try {
        console.log("🔍 SQL for updateInvitationStatus:", mysql.format(query, values));
        const [result] = await pool.execute(query, values);
        console.log(`✅ Invitation ${invitationId} status updated to ${newStatus}. Rows affected: ${result.affectedRows}`);
        return result;
    } catch (error) {
        console.error("❌ Error updating invitation status in model:", error);
        throw error;
    }
};

/**
 * Retrieves all invitations sent by a specific user.
 * Joins with the profile table to get invitee's name and other details.
 * @param {string} inviterProfileId - The profile_id of the user who sent the invitations.
 * @returns {Array<object>} List of sent invitations with invitee's details.
 */
const getSentInvitations = async (inviterProfileId) => {
    const query = `
        SELECT 
            pi.invitation_id,
            pi.inviter_profile_id,
            pi.invitee_profile_id,
            pi.status,
            pi.inviter_message,
            pi.sent_at,
            pi.viewed_at,
            p.name AS invitee_name,
            p.mother_tongue AS invitee_mother_tongue,
            p.current_age AS invitee_current_age,
            p.current_location AS invitee_current_location
            -- Add more invitee details as needed for display in the "Sent" inbox
        FROM 
            profile_invitations pi
        JOIN 
            profile p ON pi.invitee_profile_id = p.profile_id
        WHERE 
            pi.inviter_profile_id = ?
        ORDER BY 
            pi.sent_at DESC;
    `;
    const values = [inviterProfileId];

    try {
        console.log("🔍 SQL for getSentInvitations:", mysql.format(query, values));
        const [rows] = await pool.execute(query, values);
        console.log(`✅ Found ${rows.length} sent invitations for ${inviterProfileId}.`);
        return rows;
    } catch (error) {
        console.error("❌ Error fetching sent invitations in model:", error);
        throw error;
    }
};

module.exports = {
    createInvitation,
    getReceivedInvitations,
    updateInvitationStatus,
    getSentInvitations // <--- ADDED THIS EXPORT
};