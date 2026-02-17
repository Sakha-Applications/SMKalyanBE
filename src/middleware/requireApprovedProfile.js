// src/middleware/requireApprovedProfile.js
const pool = require("../config/db"); // db.js exports the pool

/**
 * Blocks access unless the logged-in user's profile_status is APPROVED.
 * Assumes authenticate/requireAuth has already populated req.user.profile_id.
 */
const requireApprovedProfile = async (req, res, next) => {
  try {
    const profileId = req.user?.profile_id || req.user?.id;

    if (!profileId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: profile_id not available in token"
      });
    }

    const [rows] = await pool.query(
      "SELECT profile_status FROM profile WHERE profile_id = ? LIMIT 1",
      [profileId.toString()]
    );

    const status = (rows?.[0]?.profile_status || "").toString().trim().toUpperCase();

    if (status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Access restricted: your profile is not approved yet.",
        profile_status: status || "UNKNOWN"
      });
    }

    return next();
  } catch (err) {
    console.error("❌ requireApprovedProfile error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while validating profile approval"
    });
  }
};

module.exports = requireApprovedProfile;
