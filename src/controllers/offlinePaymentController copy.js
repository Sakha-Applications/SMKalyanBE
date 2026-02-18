// controllers/offlinePaymentController.js
const { insertOfflinePayment, getOfflinePaymentsByProfileId, updatePaymentStatus, recordRenewalPayment } = require('../models/offlinePaymentModel');

// Handle submission of offline payment details
const submitOfflinePayment = async (req, res) => {
    try {
        // Extract payment details from request body
        const { 
            amount, 
            payment_type, 
            payment_mode,
            payment_method, // Added payment_method to match the table structure
            payment_reference, 
            payment_date,
            payment_time,
            phone_number,
            email,
            transactionDetails // Added email to match the table structure
        } = req.body;
        
        // Get user ID from authentication middleware
        const profile_id = req.body.profile_id || req.user?.profile_id || req.user?.id;

        console.log("🔄 profile_id from body:", req.body.profile_id);
        console.log("🔄 payment_type:", payment_type);
        
        // Validate required fields with updated requirements
        if (!amount || !payment_date || !payment_time || (!phone_number && !email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required payment details. Please provide amount, payment date, time, and either phone or email.' 
            });
        }

        let paymentResult;
        
        // Check if this is a renewal payment - if so, use special renewal function
        if (payment_type === 'ProfileRenewal') {
            console.log("🔄 Processing Profile Renewal payment for profile:", profile_id);
            
            paymentResult = await recordRenewalPayment({
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
            }, true); // true indicates to reset contacts
            
            // Return success response with additional info about contact reset
            return res.status(201).json({
                success: true,
                message: 'Profile renewal recorded successfully. Your shared contact history has been reset.',
                paymentId: paymentResult.paymentId,
                contactsReset: paymentResult.deletedContactRecords,
                renewalProcessed: true
            });
            
        } else {
            // Regular payment processing
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
const { getProfileStatus, updateProfileStatus } = require('../models/profileModel');

try {
  const current = (await getProfileStatus(profile_id)) || '';
  const currentU = current.toString().trim().toUpperCase();

  if (currentU !== 'APPROVED') {
    // Allow transition from DRAFT/SUBMITTED to PAYMENT_SUBMITTED
    await updateProfileStatus(profile_id, 'PAYMENT_SUBMITTED');
    console.log(`✅ profile_status updated to PAYMENT_SUBMITTED for profile_id=${profile_id}`);
  } else {
    console.log(`ℹ️ profile_id=${profile_id} already APPROVED. Skipping status update.`);
  }
} catch (e) {
  console.error('⚠️ Failed to update profile_status to PAYMENT_SUBMITTED:', e.message);
}

            // Return success response for regular payments
            return res.status(201).json({
                success: true,
                message: 'Offline payment record created successfully',
                paymentId
            });
        }
        
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
        
        // Validate input - using enum values from table structure
        if (!paymentId || !status || !['pending', 'verified', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid payment ID or status. Status must be pending, verified, or rejected.' 
            });
        }
        
        // Update payment status
        const updated = await updatePaymentStatus(paymentId, status, adminNotes || '');
        
        if (updated) {
            res.json({
                success: true,
                message: `Payment status updated to ${status}`
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }
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