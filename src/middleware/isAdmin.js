// middleware/isAdmin.js
const isAdmin = (req, res, next) => {
  const role = (req.user?.role || '').toString().toLowerCase();

  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required'
    });
  }

  next();
};

module.exports = isAdmin;
