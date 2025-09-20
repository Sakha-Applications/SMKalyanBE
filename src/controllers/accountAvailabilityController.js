// src/controllers/accountAvailabilityController.js
const db = require('../config/db');
const { normalizeEmail, toE164 } = require('../utils/normalize');
const userLoginModel = require('../models/userLoginModel');
const uploadSearchModel = require('../models/uploadSearchModel');

/**
 * GET /api/account/availability?email=&phoneE164=&phoneCountryCode=&phoneNumber=
 * Returns booleans only, no PII.
 */
async function getAvailability(req, res) {
  try {
    const { email, phoneE164, phoneCountryCode, phoneNumber } = req.query || {};

    const normEmail = email ? normalizeEmail(email) : '';
    const normPhone = toE164({ phoneE164, phoneCountryCode, phoneNumber });

    const result = {};
    const sources = [];

    // Email checks across BOTH tables.
    if (normEmail) {
      let emailExists = false;

      // userlogin.user_id
      const loginRow = await userLoginModel.findByUserId(normEmail); // SELECT ... FROM userlogin WHERE user_id = ?
      if (loginRow) {
        emailExists = true;
        sources.push('userlogin');
      }

      // profile.email
      const profByEmail = await uploadSearchModel.findProfilesForUpload({ email: normEmail });
      if (Array.isArray(profByEmail) && profByEmail.length > 0) {
        emailExists = true;
        sources.push('profile');
      }

      result.email = { exists: !!emailExists, sources: emailExists ? Array.from(new Set(sources)) : [] };
    }

    // Phone check against profile.phone_number
    // Phone check against profile.phone_number
// Phone check against profile.phone
if (normPhone) {
  try {
    // Import db at the top: const db = require('../config/db');
    const [phoneRows] = await db.query('SELECT phone FROM profile WHERE phone = ?', [normPhone]);
    const phoneExists = phoneRows && phoneRows.length > 0;
    
    console.log('📱 Direct phone check:', normPhone, 'found rows:', phoneRows?.length, 'exists:', phoneExists);
    
    result.phone = { exists: phoneExists };
  } catch (err) {
    console.error('❌ Phone check error:', err);
    result.phone = { exists: false };
  }
}

    // If no parameters were provided, still return 200 with nothing (idempotent, safe).
    return res.status(200).json(Object.keys(result).length ? result : {});
  } catch (err) {
    console.error('🔴 availability error:', err);
    // Soft-fail: don’t block UX on blur; FE will re-check on submit.
    return res.status(200).json({ note: 'soft-fail' });
  }
}

module.exports = { getAvailability };
