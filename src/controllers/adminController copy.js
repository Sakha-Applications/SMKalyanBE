// src/controllers/adminController.js
const pool = require("../config/db");;

// Approve profile (only from PAYMENT_SUBMITTED)
const approveProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({ success: false, message: "profileId is required" });
    }

    const [result] = await pool.query(
      `UPDATE profile
       SET profile_status = 'APPROVED'
       WHERE profile_id = ?
         AND UPPER(IFNULL(profile_status,'')) = 'PAYMENT_SUBMITTED'`,
      [profileId.toString()]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.query(
        "SELECT profile_status FROM profile WHERE profile_id = ? LIMIT 1",
        [profileId.toString()]
      );

      const currentStatus = (rows?.[0]?.profile_status || "NOT_FOUND").toString();

      return res.status(409).json({
        success: false,
        message: "Profile not eligible for approval (must be PAYMENT_SUBMITTED).",
        currentStatus
      });
    }

    return res.json({
      success: true,
      message: "Profile approved successfully.",
      profileId
    });
  } catch (err) {
    console.error("❌ approveProfile error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while approving profile"
    });
  }
};

// ✅ List all PAYMENT_SUBMITTED profiles
const listPaymentSubmittedProfiles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT profile_id, name, email, phone, profile_status
       FROM profile
       WHERE UPPER(IFNULL(profile_status,'')) = 'PAYMENT_SUBMITTED'
       ORDER BY profile_id DESC`
    );

    return res.json({
      success: true,
      count: rows.length,
      profiles: rows
    });
  } catch (err) {
    console.error("❌ listPaymentSubmittedProfiles error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching PAYMENT_SUBMITTED profiles"
    });
  }
};

// ✅ Basic stats for admin dashboard
const getAdminStats = async (req, res) => {
  try {
    const [profileCounts] = await pool.query(
      `SELECT UPPER(IFNULL(profile_status,'UNKNOWN')) AS status, COUNT(*) AS cnt
       FROM profile
       GROUP BY UPPER(IFNULL(profile_status,'UNKNOWN'))`
    );

    const [offlinePaymentCounts] = await pool.query(
      `SELECT UPPER(IFNULL(status,'UNKNOWN')) AS status, COUNT(*) AS cnt
       FROM tblofflinepayments
       GROUP BY UPPER(IFNULL(status,'UNKNOWN'))`
    );

    return res.json({
      success: true,
      profileCounts,
      offlinePaymentCounts
    });
  } catch (err) {
    console.error("❌ getAdminStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching admin stats"
    });
  }
};

module.exports = {
  approveProfile,
  listPaymentSubmittedProfiles,
  getAdminStats
};
