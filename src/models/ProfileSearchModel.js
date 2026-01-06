const pool = require("../config/db");

// ✅ DB helper: get profile_for using profile_id
const getProfileForByProfileId = async (profileId) => {
  const pid = String(profileId || "").trim();
  if (!pid) return "";

  const sql = "SELECT profile_for FROM profile WHERE profile_id = ? LIMIT 1";
  console.log("🧾 MODEL getProfileForByProfileId SQL:", sql, "PARAM:", [pid]);

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
  currentLocationCountry,
  currentLocationState,
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
    const _currentLocationCountry = clean(currentLocationCountry);
    const _currentLocationState = clean(currentLocationState);
    const _myProfileFor = clean(myProfileFor);
    const _applyOppositeByDefault = !!applyOppositeByDefault;

    console.log("\n🧾 MODEL searchProfiles inputs:");
    console.log({
      profileId: _profileId,
      profileFor: _profileFor,
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
      currentLocationCountry: _currentLocationCountry,
      currentLocationState: _currentLocationState,
      myProfileFor: _myProfileFor,
      applyOppositeByDefault: _applyOppositeByDefault,
    });

    let query = "SELECT * FROM profile WHERE 1=1";
    const values = [];
    let filterCount = 0;

    // ✅ REQUIRED DEFAULT:
    // When UI does NOT send profileFor -> apply profile_for != myProfileFor
    if (_applyOppositeByDefault) {
      if (_myProfileFor) {
        query += " AND profile_for != ?";
        values.push(_myProfileFor);
        filterCount++;
        console.log("✅ MODEL applied default filter: profile_for != myProfileFor");
      } else {
        console.log(
          "⚠️ MODEL applyOppositeByDefault is TRUE but myProfileFor is EMPTY -> cannot apply default filter"
        );
      }
    }

    // Normal filters (apply if provided)
    if (_profileId) {
      query += " AND profile_id = ?";
      values.push(_profileId);
      filterCount++;
    }

    if (_profileFor) {
      query += " AND profile_for = ?";
      values.push(_profileFor);
      filterCount++;
    }

    if (_minAge && _maxAge) {
      query += " AND current_age BETWEEN ? AND ?";
      values.push(Number(_minAge), Number(_maxAge));
      filterCount++;
    } else if (_minAge) {
      query += " AND current_age >= ?";
      values.push(Number(_minAge));
      filterCount++;
    } else if (_maxAge) {
      query += " AND current_age <= ?";
      values.push(Number(_maxAge));
      filterCount++;
    }

    if (_maritalStatus) {
      query += " AND married_status = ?";
      values.push(_maritalStatus);
      filterCount++;
    }

    if (_motherTongue) {
      query += " AND mother_tongue = ?";
      values.push(_motherTongue);
      filterCount++;
    }

    if (_gotra) {
      query += " AND gotra = ?";
      values.push(_gotra);
      filterCount++;
    }

    if (_subCaste) {
      query += " AND sub_caste = ?";
      values.push(_subCaste);
      filterCount++;
    }

    if (_guruMatha) {
      query += " AND guru_matha = ?";
      values.push(_guruMatha);
      filterCount++;
    }

    if (_currentCityOfResidence) {
      query += " AND current_city_of_residence = ?";
      values.push(_currentCityOfResidence);
      filterCount++;
    }

    if (_currentLocationCountry) {
      query += " AND current_location_country = ?";
      values.push(_currentLocationCountry);
      filterCount++;
    }

    if (_currentLocationState) {
      query += " AND current_location_state = ?";
      values.push(_currentLocationState);
      filterCount++;
    }

    if (_income) {
      query += " AND income = ?";
      values.push(_income);
      filterCount++;
    }

    if (_traditionalValues) {
      query += " AND traditional_values = ?";
      values.push(_traditionalValues);
      filterCount++;
    }

    query += " ORDER BY current_age ASC";

    // ✅ Final SQL + WHERE proof
    console.log("🧾 BASIC SEARCH FINAL SQL:");
    console.log(query);
    console.log("🧾 BASIC SEARCH FINAL PARAMS:");
    console.log(values);
    console.log("🧾 MODEL filterCount: ", filterCount);

    const [rows] = await pool.execute(query, values);
    return rows;
  } catch (error) {
    console.error("❌ Error searching profiles in model:", error);
    throw error;
  }
};

module.exports = { searchProfiles, getProfileForByProfileId };
