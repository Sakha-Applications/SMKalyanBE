//models/paymentModel.js
const pool = require("../config/db");

const insertPaymentDetails = async (paymentDetails) => {
    try {
        const { paymentId, orderId, signature, amount, currency, userId } = paymentDetails;
        const [result] = await pool.query(
            "INSERT INTO tblPayments (paymentId, orderId, signature, amount, currency, userId, paymentDate) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [paymentId, orderId, signature, amount, currency, userId]
        );
        console.log("✅ Payment details inserted:", { paymentId, orderId, insertId: result.insertId });
        return result.insertId;
    } catch (error) {
        console.error("❌ Error inserting payment details:", error);
        throw error;
    }
};

module.exports = { insertPaymentDetails };