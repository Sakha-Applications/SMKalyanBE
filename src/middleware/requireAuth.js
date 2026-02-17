const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'your-secret-key'; // keep as-is

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);

    // ✅ Keep original decoded payload (in case any code expects raw fields)
    req.user = decoded;

    // ✅ Normalize common fields for consistent downstream use
    req.user.profile_id = decoded.profile_id || decoded.profileId || decoded.profileID || null;
    req.user.email = decoded.email || null;
    req.user.userId = decoded.userId || decoded.user_id || decoded.email || null;
    req.user.role = decoded.role || decoded.userRole || decoded.user_role || 'USER';

    // ✅ Backward compatibility alias (some code may use req.user.id)
    if (!req.user.id && req.user.profile_id) {
      req.user.id = req.user.profile_id;
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized - invalid token' });
  }
};
