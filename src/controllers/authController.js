// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserLogin = require('../models/userLoginModel');

const checkFirstLogin = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const user = await UserLogin.findByUserId(userId);
    if (user) {
      res.json({ isFirstLogin: user.first_login === 1 });
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (error) {
    console.error('Error checking first login:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const updatePassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await UserLogin.findByUserId(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let updateResult;
    updateResult = await UserLogin.updatePasswordAndClearReset(userId, hashedPassword);

    if (updateResult.success || updateResult.affectedRows > 0) {
      await UserLogin.clearResetToken(userId);
      res.status(200).json({ message: 'Password has been reset successfully.' });
    } else {
      res.status(500).json({ error: 'Failed to update password.' });
    }
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const login = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required.' });
  }

  try {
    const user = await UserLogin.findByUserId(userId);
    console.log("User from database:", user); // DEBUG: Inspect the user object

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", passwordMatch); // DEBUG: Check password match

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Authentication successful, generate a token
    const secret = process.env.JWT_SECRET || 'your-secret-key';

const token = jwt.sign(
  {
    profile_id: user.profile_id,     // ✅ required by matchProfiles
    email: user.user_id,             // treating user_id as email
    userId: user.user_id,            // legacy fallback
    role: user.role || 'USER'        // used by isAdmin.js
  },
  secret,
  { expiresIn: '8h' }
);


    // Include user data in the response
    console.log("Sending login success response:", { token, user });  // DEBUG
    res.status(200).json({ 
      token, 
      user: { 
        email: user.user_id, //  Assuming user_id holds the email
      },
    }); // Send the token and user data in the response
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { checkFirstLogin, updatePassword, login };
