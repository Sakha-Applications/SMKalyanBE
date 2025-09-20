// src/utils/normalize.js
function digitsOnly(s = '') {
  return String(s || '').replace(/\D+/g, '');
}

function normalizeEmail(s = '') {
  return String(s || '').trim().toLowerCase();
}

/**
 * Build E.164 without formatting: +<country><number>
 * Accepts either (phoneE164) or (countryCode, number).
 */
function toE164({ phoneE164, phoneCountryCode, phoneNumber }) {
  if (phoneE164 && String(phoneE164).startsWith('+') && /^\+\d+$/.test(phoneE164)) {
    return phoneE164;
  }
  const cc = digitsOnly(phoneCountryCode);
  const num = digitsOnly(phoneNumber);
  if (!cc || !num) return '';
  return `+${cc}${num}`;
}

module.exports = { digitsOnly, normalizeEmail, toE164 };
