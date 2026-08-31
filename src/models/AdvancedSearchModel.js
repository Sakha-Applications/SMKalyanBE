// backend/src/models/AdvancedSearchModel.js
const pool = require("../config/db");
const {
  applyCandidateEligibility,
} = require("./candidateEligibility");

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


const searchProfiles = async (
  profileId,
  profileFor,
  minAge,
  maxAge,
  maritalStatus,
  motherTongue,
  gotra,
  rashi,
  nakshatra,
  subCaste,
  guruMatha,
  currentCityOfResidence,
  currentLocationCountry,
  currentLocationState,
  income,
  education,
  profession,
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

  eligibilityContext
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
    const _rashi = clean(rashi);
    const _nakshatra = clean(nakshatra);
    const _subCaste = clean(subCaste);
    const _guruMatha = clean(guruMatha);
    const _currentCityOfResidence = clean(currentCityOfResidence);
    const _currentLocationCountry = clean(currentLocationCountry);
    const _currentLocationState = clean(currentLocationState);
    const _income = clean(income);
    const _education = clean(education);
    const _profession = clean(profession);
    const _traditionalValues =
      clean(traditionalValues);

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


    console.log("\n🧾 ADV MODEL searchProfiles inputs:", {
      profileId: _profileId,
      profileFor: _profileFor,
      eligibilityContext,
      minAge: _minAge,
      maxAge: _maxAge,
      maritalStatus: _maritalStatus,
      motherTongue: _motherTongue,
      gotra: _gotra,
      rashi: _rashi,
      nakshatra: _nakshatra,
      subCaste: _subCaste,
      guruMatha: _guruMatha,
      currentCityOfResidence: _currentCityOfResidence,
      income: _income,
      traditionalValues: _traditionalValues,
      heightMin: _heightMin,
      heightMax: _heightMax,
    });

    let query = `
      SELECT
        profile_id,
        name,
        profile_for,
        current_age,
        height,
        current_location,
        current_city_of_residence,
        current_location_state,
        current_location_country,
        gotra,
        sub_caste,
        mother_tongue,
        married_status,
        education,
        profession,
        income
      FROM profile
      WHERE 1=1
        AND COALESCE(
          share_details_on_platform,
          'No'
        ) = 'Yes'
    `;

    const values = [];
    let filterCount = 0;

    const eligibilityResult =
      applyCandidateEligibility(
        query,
        values,
        eligibilityContext
      );

    query = eligibilityResult.query;

    console.log(
      "✅ ADVANCED SEARCH global candidate eligibility applied"
    );

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
      query += ` AND gotra != ?`;
      values.push(_gotra);
      filterCount++;
    }

    if (_rashi) {
      query += ` AND rashi = ?`;
      values.push(_rashi);
      filterCount++;
    }

    if (_nakshatra) {
      query += ` AND nakshatra = ?`;
      values.push(_nakshatra);
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
      query += ` AND current_city_of_residence = ?`;
      values.push(_currentCityOfResidence);
      filterCount++;
    }
    if (_currentLocationCountry) {
      query += ` AND current_location_country = ?`;
      values.push(_currentLocationCountry);
      filterCount++;
    }

    if (_currentLocationState) {
      query += ` AND current_location_state = ?`;
      values.push(_currentLocationState);
      filterCount++;
    }

    if (_income) {
      query += ` AND income = ?`;
      values.push(_income);
      filterCount++;
    }

    if (_education) {
      query += ` AND education = ?`;
      values.push(_education);
      filterCount++;
    }

    if (_profession) {
      query += ` AND profession = ?`;
      values.push(_profession);
      filterCount++;
    }

    if (_traditionalValues) {
      query += ` AND traditional_values = ?`;
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

module.exports = {
  searchProfiles,
};
