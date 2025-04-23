// backend/middleware/authMiddleware.js  (Example path)
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key'); //  Use your actual secret key here
    req.user = { userId: decoded.userId }; //  Store the user ID (which is the email)
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };