// src/models/adminSettingsModel.js
const pool = require("../config/db");

const KEYS = {
  REGISTRATION_FEE_AMOUNT:
    "REGISTRATION_FEE_AMOUNT",

  CONTACT_VIEWS_PER_CYCLE:
    "CONTACT_VIEWS_PER_CYCLE",

  RECHARGE_FEE_AMOUNT:
    "RECHARGE_FEE_AMOUNT",

  RECHARGE_CREDIT_POINTS:
    "RECHARGE_CREDIT_POINTS",

  LOW_CREDIT_REMINDER_THRESHOLD:
    "LOW_CREDIT_REMINDER_THRESHOLD",

  SHOW_INTEREST_CREDIT_COST:
    "SHOW_INTEREST_CREDIT_COST",

  SHORTLIST_CREDIT_COST:
    "SHORTLIST_CREDIT_COST",

  DIRECT_APPLY_CREDIT_COST:
    "DIRECT_APPLY_CREDIT_COST",

  MUTUAL_INTEREST_CREDIT_COST:
    "MUTUAL_INTEREST_CREDIT_COST",

  CONTACT_VIEW_CREDIT_COST:
    "CONTACT_VIEW_CREDIT_COST",

  ADVERTISEMENT_MIN_CONTRIBUTION:
    "ADVERTISEMENT_MIN_CONTRIBUTION"
};

async function getSettings() {
  const keys =
    Object.values(KEYS);

  if (keys.length === 0) {
    return {};
  }

  const placeholders =
    keys
      .map(() => "?")
      .join(", ");

  const [rows] =
    await pool.query(
      `
        SELECT
          setting_key,
          setting_value
        FROM app_settings
        WHERE setting_key IN (
          ${placeholders}
        )
      `,
      keys
    );

  const configuredValues =
    {};

  rows.forEach((row) => {
    configuredValues[
      row.setting_key
    ] =
      row.setting_value;
  });

  /*
   * Always expose every supported key.
   * Missing configuration is returned
   * as an empty string so callers can
   * validate it explicitly.
   */
  return keys.reduce(
    (
      result,
      key
    ) => {
      result[key] =
        configuredValues[key] ??
        "";

      return result;
    },
    {}
  );
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
      `
        INSERT INTO app_settings (
          setting_key,
          setting_value
        )
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          setting_value = ?
      `,
      [
        k,
        v,
        v
      ]
    );
  }

  return { updated: updates.length };
}

module.exports = {
  KEYS,
  getSettings,
  upsertSettings
};
