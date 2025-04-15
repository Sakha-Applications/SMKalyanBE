// backend/controllers/forgotPasswordController.js
const pool = require('../config/db');

exports.forgotPassword = async (req, res) => {
    const { userIdOrEmail } = req.body;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM userlogin WHERE user_id = ?',
            [userIdOrEmail]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = rows[0];
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const resetPasswordExpires = new Date(Date.now() + 3600000);

        await pool.execute(
            'UPDATE userlogin SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE user_id = ?',
            [resetToken, resetPasswordExpires, user.user_id]
        );

        // Send the user_id back to the frontend
        res.json({ message: 'Temporary token generated. Proceed to reset password.', userId: user.user_id });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process your request.' });
    }
};

module.exports = exports;