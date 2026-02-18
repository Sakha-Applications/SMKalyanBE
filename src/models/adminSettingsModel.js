// src/models/adminSettingsModel.js
const pool = require("../config/db");

const KEYS = {
  REGISTRATION_FEE_AMOUNT: "REGISTRATION_FEE_AMOUNT",
  CONTACT_VIEWS_PER_CYCLE: "CONTACT_VIEWS_PER_CYCLE",
  RECHARGE_FEE_AMOUNT: "RECHARGE_FEE_AMOUNT"
};

async function getSettings() {
  const keys = Object.values(KEYS);

  const [rows] = await pool.query(
    `SELECT setting_key, setting_value
     FROM app_settings
     WHERE setting_key IN (?, ?, ?)`,
    keys
  );

  const map = {};
  rows.forEach((r) => {
    map[r.setting_key] = r.setting_value;
  });

  // Ensure all keys exist in response (even if missing in DB)
  return {
    [KEYS.REGISTRATION_FEE_AMOUNT]: map[KEYS.REGISTRATION_FEE_AMOUNT] ?? "0",
    [KEYS.CONTACT_VIEWS_PER_CYCLE]: map[KEYS.CONTACT_VIEWS_PER_CYCLE] ?? "10",
    [KEYS.RECHARGE_FEE_AMOUNT]: map[KEYS.RECHARGE_FEE_AMOUNT] ?? "0"
  };
}

async function upsertSettings(payload) {
  const updates = [];

  for (const [key, val] of Object.entries(payload || {})) {
    if (!Object.values(KEYS).includes(key)) continue;
    updates.push([key, String(val)]);
  }

  if (updates.length === 0) {
    return { updated: 0 };
  }

  // Upsert each setting (small table, small updates)
  for (const [k, v] of updates) {
    await pool.query(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [k, v]
    );
  }

  return { updated: updates.length };
}

module.exports = {
  KEYS,
  getSettings,
  upsertSettings
};
