// backend/src/models/AdvancedSearchModel.js
const pool = require("../config/db");

// Debug helper: log SQL + params + expanded query (for troubleshooting only)
const logSql = (label, sql, params) => {
  try {
    console.log(`🧾 ${label} SQL:\n${sql}`);
    console.log(`🧾 ${label} PARAMS:\n`, params);

    const paramsCopy = Array.isArray(params) ? [...params] : [];
    const expanded = String(sql).replace(/\?/g, () => {
      const v = paramsCopy.shift();
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
      return `'${String(v).replace(/'/g, "''")}'`;
    });

    console.log(`🧾 ${label} FULL (DEBUG):\n${expanded}`);
  } catch (e) {
    console.log(`⚠️ ${label} logSql failed:`, e?.message || e);
  }
};

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

// ✅ Utility: Convert height string like "5'4\"" to total inches
const parseHeightToInches = (heightStr) => {
  if (!heightStr) return null;

  const s = String(heightStr).trim();
  const ftInPattern = /^(\d+)\s*'?\s*(\d{1,2})?\s*"?$/;
  const match = s.match(ftInPattern);

  if (match) {
    const feet = parseInt(match[1], 10);
    const inches = match[2] ? parseInt(match[2], 10) : 0;
    return feet * 12 + inches;
  }

  const num = parseFloat(s);
  if (!isNaN(num)) {
    const feet = Math.floor(num);
    const inches = Math.round((num - feet) * 10);
    return feet * 12 + inches;
  }

  return null;
};

// ✅ NEW: fetch logged-in user's profile_for using profile_id
const getProfileForByProfileId = async (profileId) => {
  const pid = String(profileId || "").trim();
  if (!pid) return "";

  const sql = "SELECT profile_for FROM profile WHERE profile_id = ? LIMIT 1";
  console.log("🧾 ADV MODEL getProfileForByProfileId SQL:", sql, "PARAM:", [pid]);

  const [rows] = await pool.execute(sql, [pid]);
  return rows?.[0]?.profile_for || "";
};

const searchProfiles = async (
  profileId,
  profileFor,
  minAge,
  maxAge,
  maritalStatus,
  motherTongue,
  gotra,
  subCaste,
  guruMatha,
  currentCityOfResidence,
  income,
  traditionalValues,

  heightMin,
  heightMax,
  qualification,
  educationIn,
  workingWith,
  professionalArea,
  familyStatus,
  familyType,
  religiousValues,
  castingDetails,
  faithLiving,
  dailyRituals,
  observersRajamanta,
  observersChaturmasya,

  // ✅ NEW
  myProfileFor,
  applyOppositeByDefault
) => {
  try {
    const clean = (v) => (v === undefined || v === null ? "" : String(v).trim());

    const _profileId = clean(profileId);
    const _profileFor = clean(profileFor);
    const _minAge = clean(minAge);
    const _maxAge = clean(maxAge);
    const _maritalStatus = clean(maritalStatus);
    const _motherTongue = clean(motherTongue);
    const _gotra = clean(gotra);
    const _subCaste = clean(subCaste);
    const _guruMatha = clean(guruMatha);
    const _currentCityOfResidence = clean(currentCityOfResidence);
    const _income = clean(income);
    const _traditionalValues = clean(traditionalValues);

    const _heightMin = clean(heightMin);
    const _heightMax = clean(heightMax);
    const _qualification = clean(qualification);
    const _educationIn = clean(educationIn);
    const _workingWith = clean(workingWith);
    const _professionalArea = clean(professionalArea);
    const _familyStatus = clean(familyStatus);
    const _familyType = clean(familyType);
    const _religiousValues = clean(religiousValues);
    const _castingDetails = clean(castingDetails);
    const _faithLiving = clean(faithLiving);
    const _dailyRituals = clean(dailyRituals);
    const _observersRajamanta = clean(observersRajamanta);
    const _observersChaturmasya = clean(observersChaturmasya);

    const _myProfileFor = clean(myProfileFor);
    const _applyOppositeByDefault = !!applyOppositeByDefault;

    console.log("\n🧾 ADV MODEL searchProfiles inputs:", {
      profileId: _profileId,
      profileFor: _profileFor,
      myProfileFor: _myProfileFor,
      applyOppositeByDefault: _applyOppositeByDefault,
      minAge: _minAge,
      maxAge: _maxAge,
      maritalStatus: _maritalStatus,
      motherTongue: _motherTongue,
      gotra: _gotra,
      subCaste: _subCaste,
      guruMatha: _guruMatha,
      currentCityOfResidence: _currentCityOfResidence,
      income: _income,
      traditionalValues: _traditionalValues,
      heightMin: _heightMin,
      heightMax: _heightMax,
    });

    let query = `SELECT * FROM profile WHERE 1=1`;
    const values = [];
    let filterCount = 0;

    // ✅ REQUIRED DEFAULT (same as Basic Search):
    // if UI doesn't send profileFor -> enforce profile_for != myProfileFor
    if (_applyOppositeByDefault) {
      if (!isBlank(_myProfileFor)) {
        query += ` AND profile_for != ?`;
        values.push(_myProfileFor);
        filterCount++;
        console.log("✅ ADV MODEL applied default filter: profile_for != myProfileFor");
      } else {
        console.log("⚠️ ADV MODEL applyOppositeByDefault TRUE but myProfileFor EMPTY -> cannot apply default filter");
      }
    }

    if (_profileId) {
      query += ` AND profile_id LIKE ?`;
      values.push(`%${_profileId}%`);
      filterCount++;
    }

    if (_profileFor) {
      query += ` AND profile_for = ?`;
      values.push(_profileFor);
      filterCount++;
    }

    if (_minAge && _maxAge) {
      query += ` AND current_age BETWEEN ? AND ?`;
      values.push(parseInt(_minAge), parseInt(_maxAge));
      filterCount++;
    } else if (_minAge) {
      query += ` AND current_age >= ?`;
      values.push(parseInt(_minAge));
      filterCount++;
    } else if (_maxAge) {
      query += ` AND current_age <= ?`;
      values.push(parseInt(_maxAge));
      filterCount++;
    }

    if (_maritalStatus) {
      query += ` AND married_status = ?`;
      values.push(_maritalStatus);
      filterCount++;
    }

    if (_motherTongue) {
      query += ` AND mother_tongue = ?`;
      values.push(_motherTongue);
      filterCount++;
    }

    if (_gotra) {
      query += ` AND gotra != ?`; // kept as your original behavior
      values.push(_gotra);
      filterCount++;
    }

    if (_subCaste) {
      query += ` AND sub_caste = ?`;
      values.push(_subCaste);
      filterCount++;
    }

    if (_guruMatha) {
      query += ` AND guru_matha = ?`;
      values.push(_guruMatha);
      filterCount++;
    }

    if (_currentCityOfResidence) {
      query += ` AND current_location = ?`; // kept as your original behavior
      values.push(_currentCityOfResidence);
      filterCount++;
    }

    if (_income) {
      query += ` AND annual_income = ?`;
      values.push(_income);
      filterCount++;
    }

    if (_traditionalValues) {
      query += ` AND family_values = ?`;
      values.push(_traditionalValues);
      filterCount++;
    }

    if (_qualification) {
      query += ` AND qualification = ?`;
      values.push(_qualification);
      filterCount++;
    }

    if (_educationIn) {
      query += ` AND education_in LIKE ?`;
      values.push(`%${_educationIn}%`);
      filterCount++;
    }

    if (_workingWith) {
      query += ` AND working_with = ?`;
      values.push(_workingWith);
      filterCount++;
    }

    if (_professionalArea) {
      query += ` AND professional_area LIKE ?`;
      values.push(`%${_professionalArea}%`);
      filterCount++;
    }

    if (_familyStatus) {
      query += ` AND family_status = ?`;
      values.push(_familyStatus);
      filterCount++;
    }

    if (_familyType) {
      query += ` AND family_type = ?`;
      values.push(_familyType);
      filterCount++;
    }

    if (_religiousValues) {
      query += ` AND religious_values = ?`;
      values.push(_religiousValues);
      filterCount++;
    }

    if (_castingDetails) {
      query += ` AND casting_details LIKE ?`;
      values.push(`%${_castingDetails}%`);
      filterCount++;
    }

    if (_faithLiving) {
      query += ` AND faith_living = ?`;
      values.push(_faithLiving);
      filterCount++;
    }

    if (_dailyRituals) {
      query += ` AND daily_rituals = ?`;
      values.push(_dailyRituals);
      filterCount++;
    }

    if (_observersRajamanta) {
      query += ` AND observers_rajamanta = ?`;
      values.push(_observersRajamanta);
      filterCount++;
    }

    if (_observersChaturmasya) {
      query += ` AND observers_chaturmasya = ?`;
      values.push(_observersChaturmasya);
      filterCount++;
    }

    query += ` ORDER BY current_age ASC`;

    logSql("ADVANCED SEARCH FINAL", query, values);
    console.log("🧾 ADV MODEL filterCount:", filterCount);

    const [rows] = await pool.execute(query, values);

    // Post-filter by height using existing `height` column (kept as your original behavior)
    let finalRows = rows;

    if (_heightMin || _heightMax) {
      const minInches = _heightMin ? parseHeightToInches(_heightMin) : null;
      const maxInches = _heightMax ? parseHeightToInches(_heightMax) : null;

      finalRows = rows.filter((profile) => {
        const profileInches = parseHeightToInches(profile.height);
        if (profileInches == null) return false;
        if (minInches !== null && profileInches < minInches) return false;
        if (maxInches !== null && profileInches > maxInches) return false;
        return true;
      });
    }

    return finalRows;
  } catch (error) {
    console.error("❌ Error searching profiles in advanced search model:", error);
    throw error;
  }
};

module.exports = { searchProfiles, getProfileForByProfileId };
