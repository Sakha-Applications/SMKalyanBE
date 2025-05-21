// controllers/offlinePaymentController.js
const { insertOfflinePayment, getOfflinePaymentsByProfileId, updatePaymentStatus } = require('../models/offlinePaymentModel');

// Handle submission of offline payment details
const submitOfflinePayment = async (req, res) => {
    try {
        // Extract payment details from request body
        const { 
            amount, 
            payment_type, 
            payment_mode, 
            payment_reference, 
            payment_date,
            payment_time,
            phone_number
        } = req.body;
        
        // Get user ID from authentication middleware
        const profile_id = req.body.profile_id || req.user?.id;
        console.log("🔄 profile_id from body:", req.body.profile_id);
        
        // Validate required fields
        if (!amount || !payment_type || !payment_mode || !payment_date || !payment_time || !phone_number) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required payment details' 
            });
        }
        
        // Insert payment record
        const paymentId = await insertOfflinePayment({
            profile_id,
            amount,
            payment_type,
            payment_mode,
            payment_reference,
            payment_date,
            payment_time,
            phone_number
        });
        
        // Return success response with payment ID
        res.status(201).json({
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
        const profileId = req.user.id;
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
                message: 'Invalid payment ID or status' 
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