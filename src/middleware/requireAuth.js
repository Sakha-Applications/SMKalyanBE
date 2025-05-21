const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'your-secret-key'; // Replace with your actual secret

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // ✅ Set req.user for downstream use
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized - invalid token' });
  }
};