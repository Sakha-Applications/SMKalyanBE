// backend/models/userLoginModel.js
const pool = require('../config/db');

const UserLogin = {
    findByUserId: async (userId) => {
        const [rows] = await pool.execute('SELECT * FROM userlogin WHERE user_id = ?', [userId]);
        return rows[0];
    },

    updatePasswordAndClearReset: async (userId, hashedPassword) => {
        try {
            const [result] = await pool.execute(
                'UPDATE userlogin SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL, password_change_count = password_change_count + 1 WHERE user_id = ?',
                [hashedPassword, userId]
            );
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            console.error('Error updating password and clearing reset:', error);
            return { success: false, error: 'Failed to update password.' };
        }
    },

    incrementPasswordChangeCount: async (userId, hashedPassword) => {
        try {
            const [result] = await pool.execute(
                'UPDATE userlogin SET password = ?, password_change_count = password_change_count + 1 WHERE user_id = ?',
                [hashedPassword, userId]
            );
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            console.error('Error incrementing password change count:', error);
            return { success: false, error: 'Failed to update password.' };
        }
    },

    clearResetToken: async (userId) => {
        try {
            const [result] = await pool.execute(
                'UPDATE userlogin SET resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE user_id = ?',
                [userId]
            );
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            console.error('Error clearing reset token:', error);
            return { success: false, error: 'Failed to clear reset token.' };
        }
    },

    // ADD THIS CREATE FUNCTION:
    create: async (userData) => {
    try {
        const { profileId, user_id, password, role, is_active, notes } = userData;
        const sql = `
            INSERT INTO userlogin (profile_id, user_id, password, role, is_active, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(sql, [profileId, user_id, password, role, is_active, notes]);
        return { user_id, insertId: result.insertId };
    } catch (error) {
        console.error("❌ Error creating user login in model:", error);
        throw error;
    }
},
    // ... other functions
};

module.exports = UserLogin;