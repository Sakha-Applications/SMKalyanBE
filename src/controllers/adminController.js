// src/controllers/adminController.js
const pool = require("../config/db");;
const adminSettingsModel = require("../models/adminSettingsModel"); // ✅ NEW

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

// ✅ List all PENDING offline payments for admin verification (Registration Fee + Recharge)
const listPendingOfflinePayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          p.id               AS payment_id,
          p.profile_id       AS profile_id,
          p.amount           AS amount,
          p.payment_type     AS payment_type,
          p.payment_mode     AS payment_mode,
          p.payment_method   AS payment_method,
          p.payment_reference AS payment_reference,
          p.payment_date     AS payment_date,
          p.payment_time     AS payment_time,
          p.phone_number     AS phone_number,
          p.email            AS email,
          p.status           AS status,
          p.admin_notes      AS admin_notes,
          p.created_at       AS created_at,
          pr.name            AS profile_name,
          pr.profile_status  AS profile_status
       FROM tblofflinepayments p
       LEFT JOIN profile pr ON pr.profile_id = p.profile_id
       WHERE UPPER(IFNULL(p.status,'')) = 'PENDING'
       ORDER BY p.created_at DESC, p.id DESC`
    );

    return res.json({
      success: true,
      count: rows.length,
      payments: rows
    });
  } catch (err) {
    console.error("❌ listPendingOfflinePayments error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching pending offline payments"
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

// ✅ NEW: Get admin-configurable settings
const getAdminSettings = async (req, res) => {
  try {
    const settings = await adminSettingsModel.getSettings();
    return res.json({
      success: true,
      settings
    });
  } catch (err) {
    console.error("❌ getAdminSettings error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching admin settings"
    });
  }
};

// ✅ NEW: Update admin-configurable settings
const updateAdminSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {};

    // Only accept known keys
    const KEYS = adminSettingsModel.KEYS;

    if (body[KEYS.REGISTRATION_FEE_AMOUNT] !== undefined) {
      payload[KEYS.REGISTRATION_FEE_AMOUNT] = body[KEYS.REGISTRATION_FEE_AMOUNT];
    }
    if (body[KEYS.CONTACT_VIEWS_PER_CYCLE] !== undefined) {
      payload[KEYS.CONTACT_VIEWS_PER_CYCLE] = body[KEYS.CONTACT_VIEWS_PER_CYCLE];
    }
    if (body[KEYS.RECHARGE_FEE_AMOUNT] !== undefined) {
      payload[KEYS.RECHARGE_FEE_AMOUNT] = body[KEYS.RECHARGE_FEE_AMOUNT];
    }

    // Basic numeric validation (non-breaking)
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const regAmt = payload[KEYS.REGISTRATION_FEE_AMOUNT] !== undefined ? toNum(payload[KEYS.REGISTRATION_FEE_AMOUNT]) : null;
    const views = payload[KEYS.CONTACT_VIEWS_PER_CYCLE] !== undefined ? toNum(payload[KEYS.CONTACT_VIEWS_PER_CYCLE]) : null;
    const rechAmt = payload[KEYS.RECHARGE_FEE_AMOUNT] !== undefined ? toNum(payload[KEYS.RECHARGE_FEE_AMOUNT]) : null;

    if (regAmt !== null && regAmt < 0) {
      return res.status(400).json({ success: false, message: "REGISTRATION_FEE_AMOUNT must be >= 0" });
    }
    if (rechAmt !== null && rechAmt < 0) {
      return res.status(400).json({ success: false, message: "RECHARGE_FEE_AMOUNT must be >= 0" });
    }
    if (views !== null && (!Number.isInteger(views) || views <= 0)) {
      return res.status(400).json({ success: false, message: "CONTACT_VIEWS_PER_CYCLE must be a positive integer" });
    }

    const result = await adminSettingsModel.upsertSettings(payload);
    const updatedSettings = await adminSettingsModel.getSettings();

    return res.json({
      success: true,
      message: "Admin settings updated successfully",
      updated: result.updated,
      settings: updatedSettings
    });
  } catch (err) {
    console.error("❌ updateAdminSettings error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while updating admin settings"
    });
  }
};

module.exports = {
  approveProfile,
  listPaymentSubmittedProfiles,
  listPendingOfflinePayments,
  getAdminStats,
  getAdminSettings,       // ✅ NEW export
  updateAdminSettings     // ✅ NEW export
};
