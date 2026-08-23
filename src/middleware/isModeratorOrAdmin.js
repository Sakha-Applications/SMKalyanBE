// src/middleware/isModeratorOrAdmin.js

const isModeratorOrAdmin = (req, res, next) => {
  const role = (req.user?.role || "")
    .toString()
    .trim()
    .toUpperCase();

  if (!["MODERATOR", "ADMIN"].includes(role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied: Moderator or Admin privileges required"
    });
  }

  next();
};

module.exports = isModeratorOrAdmin;