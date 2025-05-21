// models/offlinePaymentModel.js
const pool = require("../config/db");

// Insert new offline payment record
const insertOfflinePayment = async (paymentDetails) => {
    try {
        const { 
            profile_id, 
            amount, 
            payment_type, 
            payment_mode, 
            payment_reference, 
            payment_date,
            payment_time,
            phone_number
        } = paymentDetails;
        
        const [result] = await pool.query(
            `INSERT INTO tblOfflinePayments 
            (profile_id, amount, payment_type, payment_mode, payment_reference, payment_date, payment_time, phone_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [profile_id, amount, payment_type, payment_mode, payment_reference, payment_date, payment_time, phone_number]
        );
        
        console.log("✅ Offline payment details inserted:", { profile_id, payment_type, insertId: result.insertId });
        return result.insertId;
    } catch (error) {
        console.error("❌ Error inserting offline payment details:", error);
        throw error;
    }
};

// Get offline payments for a specific user/profile
const getOfflinePaymentsByProfileId = async (profileId) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM tblOfflinePayments 
            WHERE profile_id = ? 
            ORDER BY created_at DESC`,
            [profileId]
        );
        return rows;
    } catch (error) {
        console.error("❌ Error fetching offline payments:", error);
        throw error;
    }
};

// Update payment status (for admin use)
const updatePaymentStatus = async (paymentId, status, adminNotes) => {
    try {
        const [result] = await pool.query(
            `UPDATE tblOfflinePayments 
            SET status = ?, admin_notes = ? 
            WHERE id = ?`,
            [status, adminNotes, paymentId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error("❌ Error updating payment status:", error);
        throw error;
    }
};

module.exports = { 
    insertOfflinePayment, 
    getOfflinePaymentsByProfileId,
    updatePaymentStatus
};