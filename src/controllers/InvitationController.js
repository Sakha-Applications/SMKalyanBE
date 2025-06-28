// src/backend/controllers/InvitationController.js

const InvitationModel = require("../models/InvitationModel");
const modifyProfileModel = require("../models/modifyProfileModel");
const { sendEmailReport } = require('../services/emailService');

console.log("✅ InvitationController.js loaded");

/**
 * Handles sending a new profile invitation.
 */
const sendInvitationHandler = async (req, res) => {
    const { invitee_profile_id, inviter_message } = req.body;
    const inviter_profile_id = req.user?.profile_id;

    console.log(`🔍 Received invitation request from ${inviter_profile_id} to ${invitee_profile_id}`);

    if (!inviter_profile_id || !invitee_profile_id) {
        return res.status(400).json({ error: 'Inviter and Invitee profile IDs are required.' });
    }

    if (inviter_profile_id === invitee_profile_id) {
        return res.status(400).json({ error: 'You cannot invite yourself.' });
    }

    try {
        const existingInvitations = await InvitationModel.getReceivedInvitations(invitee_profile_id);
        const alreadyPending = existingInvitations.some(
            inv => inv.inviter_profile_id === inviter_profile_id && inv.status === 'PENDING'
        );

        if (alreadyPending) {
            console.log(`⚠️ Invitation from ${inviter_profile_id} to ${invitee_profile_id} already pending.`);
            return res.status(409).json({ message: 'Invitation already sent and is pending.' });
        }

        const invitationResult = await InvitationModel.createInvitation(inviter_profile_id, invitee_profile_id, inviter_message);
        if (!invitationResult || invitationResult.affectedRows === 0) {
            throw new Error("Failed to create invitation record.");
        }

        const inviterProfile = await modifyProfileModel.getProfileById(inviter_profile_id);
        const inviteeProfile = await modifyProfileModel.getProfileById(invitee_profile_id);
        
        if (!inviterProfile) {
            console.error(`❌ Inviter profile not found for ID: ${inviter_profile_id}`);
            return res.status(404).json({ error: 'Inviter profile not found.' });
        }
        if (!inviteeProfile || !inviteeProfile.email) {
            console.error(`❌ Invitee profile or email not found for ID: ${invitee_profile_id}`);
            return res.status(404).json({ error: 'Invitee profile or email not found.' });
        }
        
        const inviterName = inviterProfile.name || inviterProfile.profile_id;
        const inviteeEmail = inviteeProfile.email;

        const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
        const inviterProfileLink = `${frontendBaseUrl}/view-profile/${inviter_profile_id}`;

        const emailSubject = `Profile ${inviterName} has invited you to review their profile on SM Kalyana Sakha!`;
        
        let emailHtml = `
            <p>Hello,</p>
            <p>Profile <strong>${inviterName} (${inviter_profile_id})</strong> has invited you to review their profile on SM Kalyana Sakha.</p>
            <p>To view their profile, please click on the link below:</p>
            <p><a href="${inviterProfileLink}">View ${inviterName}'s Profile</a></p>
        `;

        if (inviter_message) {
            emailHtml += `<p>They also sent a personal message:</p><p><em>"${inviter_message}"</em></p>`;
        }

        emailHtml += `
            <p>Thank you,</p>
            <p>The SM Kalyana Sakha Team</p>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'SM Kalyana Sakha <smkalyanasakha@gmail.com>',
            to: inviteeEmail,
            subject: emailSubject,
            html: emailHtml,
        };

        const emailSendResult = await sendEmailReport(mailOptions);
        console.log("🟢 Email sent result:", emailSendResult);

        res.status(200).json({ message: 'Invitation sent successfully!', invitationId: invitationResult.insertId });

    } catch (error) {
        console.error("❌ Error sending invitation in controller:", error);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Handles retrieving invitations received by the logged-in user.
 */
const getReceivedInvitationsHandler = async (req, res) => {
    const invitee_profile_id = req.user?.profile_id;

    if (!invitee_profile_id) {
        return res.status(400).json({ error: 'Invitee profile ID not available from token.' });
    }

    try {
        const invitations = await InvitationModel.getReceivedInvitations(invitee_profile_id);

        const updatePromises = invitations.map(async (inv) => {
            if (inv.status === 'PENDING') {
                console.log(`Updating invitation ${inv.invitation_id} to VIEWED.`);
                return InvitationModel.updateInvitationStatus(inv.invitation_id, 'VIEWED');
            }
            return Promise.resolve();
        });
        await Promise.all(updatePromises);

        const updatedInvitations = await InvitationModel.getReceivedInvitations(invitee_profile_id);

        res.status(200).json(updatedInvitations);

    } catch (error) {
        console.error("❌ Error fetching received invitations in controller:", error);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * NEW: Handles retrieving invitations sent by the logged-in user.
 */
const getSentInvitationsHandler = async (req, res) => {
    const inviter_profile_id = req.user?.profile_id; // Logged-in user's profile_id

    if (!inviter_profile_id) {
        return res.status(400).json({ error: 'Inviter profile ID not available from token.' });
    }

    try {
        const sentInvitations = await InvitationModel.getSentInvitations(inviter_profile_id);
        
        console.log(`✅ Found ${sentInvitations.length} sent invitations for ${inviter_profile_id}.`);
        res.status(200).json(sentInvitations);

    } catch (error) {
        console.error("❌ Error fetching sent invitations in controller:", error);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


module.exports = { sendInvitationHandler, getReceivedInvitationsHandler, getSentInvitationsHandler }; // <-- UPDATED EXPORTS