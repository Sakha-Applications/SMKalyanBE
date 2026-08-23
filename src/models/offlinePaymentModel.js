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
            payment_method,
            payment_reference,
            payment_date,
            payment_time,
            phone_number,
            email,
            transactionDetails
        } = paymentDetails;

        /*
         * Idempotency guard:
         * the same member/payment type/reference
         * must not create another payment record
         * when the browser retries submission.
         */
        const [existingRows] = await pool.query(
            `SELECT id
             FROM tblofflinepayments
             WHERE profile_id = ?
               AND payment_type = ?
               AND payment_reference = ?
             ORDER BY id DESC
             LIMIT 1`,
            [
                profile_id,
                payment_type,
                payment_reference
            ]
        );

        if (existingRows.length > 0) {
            console.log(
                "ℹ️ Existing offline payment reused:",
                {
                    profile_id,
                    payment_type,
                    payment_reference,
                    paymentId:
                        existingRows[0].id
                }
            );

            return existingRows[0].id;
        }

        // Insert a new offline payment record.
        const [result] = await pool.query(
            `INSERT INTO tblofflinepayments 
            (profile_id, amount, payment_type, payment_mode, payment_method, payment_reference, 
             payment_date, payment_time, phone_number, email,admin_notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                profile_id,
                amount,
                payment_type,
                payment_mode,
                payment_method || payment_mode,
                payment_reference,
                payment_date,
                payment_time,
                phone_number,
                email,
                transactionDetails
            ]
        );

        console.log("✅ Offline payment details inserted:", {
            profile_id,
            payment_method: payment_method || payment_mode,
            insertId: result.insertId
        });
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
            `SELECT * FROM tblofflinepayments 
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

// ✅ NEW: Get a single offline payment row by paymentId (needed for admin verification flow)
const getOfflinePaymentById = async (paymentId) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM tblofflinepayments WHERE id = ? LIMIT 1`,
            [paymentId]
        );
        return rows?.[0] || null;
    } catch (error) {
        console.error("❌ Error fetching offline payment by id:", error);
        throw error;
    }
};

// Update payment status (for admin use)
const updatePaymentStatus = async (paymentId, status, adminNotes) => {
    try {
        // Updated to match the table structure
        const [result] = await pool.query(
            `UPDATE tblofflinepayments 
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

// New function to record successful renewal payment with optional contact reset
// NOTE: We will stop calling this with resetContacts=true from controller.
// Reset will be triggered after admin marks the payment as VERIFIED (Option A).
const recordRenewalPayment = async (paymentDetails, resetContacts = false) => {
    let connection;
    try {
        // Get a connection from the pool for transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const {
            profile_id,
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
        } = paymentDetails;

        // Insert payment record
        const [paymentResult] = await connection.query(
            `INSERT INTO tblofflinepayments 
            (profile_id, amount, payment_type, payment_mode, payment_method, payment_reference, 
             payment_date, payment_time, phone_number, email, admin_notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                profile_id,
                amount,
                payment_type,
                payment_mode,
                payment_method || payment_mode,
                payment_reference,
                payment_date,
                payment_time,
                phone_number,
                email,
                transactionDetails
            ]
        );

        let deletedRecords = 0;

        // If this is a renewal payment, reset the shared contacts (kept for compatibility, but controller will not use it)
        if (resetContacts && payment_type === 'ProfileRenewal') {
            console.log("🔄 Processing renewal - resetting shared contacts for profile:", profile_id);
            const [deleteResult] = await connection.query(
                `DELETE FROM contact_details_shared WHERE shared_with_profile_id = ?`,
                [profile_id]
            );
            deletedRecords = deleteResult.affectedRows;
            console.log(`✅ Deleted ${deletedRecords} shared contact records for profile ${profile_id}`);
        }

        // Commit the transaction
        await connection.commit();

        console.log("✅ Renewal payment recorded (optional contact reset):", {
            profile_id,
            payment_method: payment_method || payment_mode,
            insertId: paymentResult.insertId,
            deletedContactRecords: deletedRecords
        });

        return {
            paymentId: paymentResult.insertId,
            deletedContactRecords: deletedRecords
        };

    } catch (error) {
        // Rollback transaction on error
        if (connection) {
            await connection.rollback();
        }
        console.error("❌ Error recording renewal payment (optional contact reset):", error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    insertOfflinePayment,
    getOfflinePaymentsByProfileId,
    getOfflinePaymentById,   // ✅ NEW export
    updatePaymentStatus,
    recordRenewalPayment
};
