// controllers/offlinePaymentController.js
const {
    insertOfflinePayment,
    getOfflinePaymentsByProfileId,
    updatePaymentStatus,
    recordRenewalPayment,
    getOfflinePaymentById // ✅ needed for Option A (reset on verified)
} = require('../models/offlinePaymentModel');

const { getProfileStatus, updateProfileStatus } = require('../models/profileModel');
const { resetSharedContactsForProfile } = require('../models/contactDetailsModel'); // ✅ reset contact views after verified renewal

// Handle submission of offline payment details
const submitOfflinePayment = async (req, res) => {
    try {
        // Extract payment details from request body
        const {
            amount,
            payment_type,
            payment_mode,
            payment_method,
            payment_reference,
            payment_date,
            payment_time,
            phone_number,
            email,
            transactionDetails
        } = req.body;

        // Get profile_id from body or auth middleware
        const profile_id = req.body.profile_id || req.user?.profile_id || req.user?.id;

        console.log("🔄 profile_id from body:", req.body.profile_id);
        console.log("🔄 payment_type:", payment_type);

        // Validate required fields
        if (!amount || !payment_date || !payment_time || (!phone_number && !email)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment details. Please provide amount, payment date, time, and either phone or email.'
            });
        }

        // ✅ Gate: Recharge allowed ONLY for APPROVED profiles
        if (payment_type === 'ProfileRenewal') {
            let currentStatus = '';
            try {
                currentStatus = (await getProfileStatus(profile_id)) || '';
            } catch (e) {
                console.error("⚠️ Failed to fetch profile_status for renewal gating:", e.message);
                return res.status(500).json({
                    success: false,
                    message: 'Unable to validate profile status for renewal. Please try again later.'
                });
            }

            const statusU = currentStatus.toString().trim().toUpperCase();
            if (statusU !== 'APPROVED') {
                return res.status(403).json({
                    success: false,
                    message: 'Recharge is allowed only after your profile is approved.'
                });
            }

            console.log("🔄 Processing Profile Renewal payment for APPROVED profile:", profile_id);

            // ✅ IMPORTANT: Do NOT reset contacts here (Option A)
            // Record renewal payment as pending for admin verification
            const paymentResult = await recordRenewalPayment({
                profile_id,
                amount,
                payment_type,
                payment_mode,
                payment_method: payment_method || payment_mode,
                payment_reference,
                payment_date,
                payment_time,
                phone_number,
                email,
                transactionDetails: req.body.transactionDetails
            }, false);

            return res.status(201).json({
                success: true,
                message: 'Profile renewal payment submitted successfully. It will be applied after admin verification.',
                paymentId: paymentResult.paymentId,
                renewalProcessed: true,
                contactsReset: 0
            });
        }

        // -------------------------
        // Regular payment processing (Registration Fee / Donation type)
        // -------------------------
        const paymentId = await insertOfflinePayment({
            profile_id,
            amount,
            payment_type,
            payment_mode,
            payment_method: payment_method || payment_mode,
            payment_reference,
            payment_date,
            payment_time,
            phone_number,
            email,
            transactionDetails: req.body.transactionDetails
        });

        // ✅ Update profile status to PAYMENT_SUBMITTED (do not downgrade APPROVED)
        try {
            const current = (await getProfileStatus(profile_id)) || '';
            const currentU = current.toString().trim().toUpperCase();

            if (currentU !== 'APPROVED') {
                await updateProfileStatus(profile_id, 'PAYMENT_SUBMITTED');
                console.log(`✅ profile_status updated to PAYMENT_SUBMITTED for profile_id=${profile_id}`);
            } else {
                console.log(`ℹ️ profile_id=${profile_id} already APPROVED. Skipping status update.`);
            }
        } catch (e) {
            console.error('⚠️ Failed to update profile_status to PAYMENT_SUBMITTED:', e.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Offline payment record created successfully',
            paymentId
        });

    } catch (error) {
        console.error('❌ Error submitting offline payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process offline payment submission',
            error: error.message
        });
    }
};

// Get payment history for the logged-in user
const getUserOfflinePayments = async (req, res) => {
    try {
        const profileId = req.user?.profile_id || req.user?.id;

        const payments = await getOfflinePaymentsByProfileId(profileId);

        res.json({
            success: true,
            payments
        });
    } catch (error) {
        console.error('❌ Error fetching user payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment history',
            error: error.message
        });
    }
};

// Admin endpoint to update payment status
const updateOfflinePaymentStatus = async (req, res) => {
    try {
        const { paymentId, status, adminNotes } = req.body;

        // Validate input
        if (!paymentId || !status || !['pending', 'verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment ID or status. Status must be pending, verified, or rejected.'
            });
        }

        // Update payment status
        const updated = await updatePaymentStatus(paymentId, status, adminNotes || '');

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        // ✅ Option A: On VERIFIED, apply renewal effect (reset views) ONLY for ProfileRenewal
        if (status === 'verified') {
            try {
                const paymentRow = await getOfflinePaymentById(paymentId);

                if (paymentRow && paymentRow.payment_type === 'ProfileRenewal') {
                    // Recharge allowed only for APPROVED profiles already (submit gate),
                    // but we keep reset only here after admin verification.
                    const profile_id = paymentRow.profile_id;
                    await resetSharedContactsForProfile(profile_id);
                    console.log(`✅ Shared contact views reset after verified renewal for profile_id=${profile_id}`);
                }
            } catch (e) {
                console.error("⚠️ Verified update succeeded, but failed to apply renewal reset:", e.message);
                // Do not fail the status update; return success with a warning
                return res.json({
                    success: true,
                    message: `Payment status updated to ${status}, but renewal reset could not be applied. Please check logs.`,
                    warning: e.message
                });
            }
        }

        return res.json({
            success: true,
            message: `Payment status updated to ${status}`
        });

    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment status',
            error: error.message
        });
    }
};

module.exports = {
    submitOfflinePayment,
    getUserOfflinePayments,
    updateOfflinePaymentStatus
};
