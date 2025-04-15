// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const UserLogin = require('../models/userLoginModel'); // Assuming you still have this model

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
      //  Call the correct function here:
      updateResult = await UserLogin.updatePasswordAndClearReset(userId, hashedPassword);

      // If the update was successful
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
    if (user && await bcrypt.compare(password, user.password)) {
      // Authentication successful, generate a token
      const token = jwt.sign({ userId: user.user_id }, 'your-secret-key', { expiresIn: '1h' }); // Replace 'your-secret-key' with a strong, secret key
      res.status(200).json({ token }); // Send the token in the response
    } else {
      res.status(401).json({ error: 'Invalid credentials.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { checkFirstLogin, updatePassword, login };