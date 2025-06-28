// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'your-secret-key';

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // ✅ Set full user info from token
    req.user = {
      profile_id: decoded.profile_id,   // required for matchProfiles
      email: decoded.email,             // optional, useful
      userId: decoded.userId || decoded.email, // backward compatibility
      role: decoded.role                // if needed by isAdmin
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };
