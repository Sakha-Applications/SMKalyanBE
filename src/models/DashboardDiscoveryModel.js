const pool = require("../config/db");

const {
  applyCandidateEligibility,
} = require("./candidateEligibility");

const getLoggedInProfileContext = async (profileId) => {
  const pid = String(profileId || "").trim();

  if (!pid) {
    throw new Error(
      "Dashboard discovery requires logged-in profile ID."
    );
  }

  const sql = `
    SELECT
      profile_id,
      profile_for,
      gotra,
      mother_tongue,
      current_location,
      current_location_country
    FROM profile
    WHERE profile_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.execute(sql, [pid]);
  const profile = rows?.[0];

  if (!profile) {
    throw new Error(
      `Logged-in profile not found: ${pid}`
    );
  }

  const context = {
    loggedInProfileId: String(
      profile.profile_id || ""
    ).trim(),

    loggedInProfileFor: String(
      profile.profile_for || ""
    ).trim(),

    loggedInGotra: String(
      profile.gotra || ""
    ).trim(),

    motherTongue: String(
      profile.mother_tongue || ""
    ).trim(),

    currentLocation: String(
      profile.current_location || ""
    ).trim(),

    currentLocationCountry: String(
      profile.current_location_country || ""
    ).trim(),
  };

  if (!context.loggedInProfileFor) {
    throw new Error(
      `profile_for is missing for profile: ${pid}`
    );
  }

  if (!context.loggedInGotra) {
    throw new Error(
      `Gotra is missing for profile: ${pid}`
    );
  }

  return context;
};

const getDiscoveryCount = async (
  profileId,
  discoveryType,
  profession = ""
) => {
  const context =
    await getLoggedInProfileContext(profileId);

  let query = `
    SELECT COUNT(*) AS profileCount
    FROM profile
    WHERE 1=1
  `;

  const values = [];

  const eligibilityResult =
    applyCandidateEligibility(
      query,
      values,
      context
    );

  query = eligibilityResult.query;

  const type = String(
    discoveryType || ""
  )
    .trim()
    .toUpperCase();

  switch (type) {
    case "RECENT":
      break;

    case "SAME_CITY":
      if (!context.currentLocation) {
        return 0;
      }

      query += `
        AND UPPER(TRIM(current_location))
            = UPPER(?)
      `;

      values.push(context.currentLocation);
      break;

    case "SAME_MOTHER_TONGUE":
      if (!context.motherTongue) {
        return 0;
      }

      query += `
        AND UPPER(TRIM(mother_tongue))
            = UPPER(?)
      `;

      values.push(context.motherTongue);
      break;

    case "GOTRA":
      /*
       * No additional condition is needed.
       * candidateEligibility already guarantees:
       * candidate gotra is present
       * candidate gotra != logged-in member's gotra
       */
      break;

    case "PROFESSION": {
      const selectedProfession = String(
        profession || ""
      ).trim();

      if (!selectedProfession) {
        throw new Error(
          "Profession is required for profession discovery."
        );
      }

      query += `
        AND UPPER(TRIM(profession))
            = UPPER(?)
      `;

      values.push(selectedProfession);
      break;
    }

    case "INTERNATIONAL":
      query += `
        AND current_location_country IS NOT NULL
        AND TRIM(current_location_country) <> ''
        AND UPPER(TRIM(current_location_country))
            <> 'INDIA'
      `;
      break;

    default:
      throw new Error(
        `Unsupported discovery type: ${discoveryType}`
      );
  }

  console.log(
    "Dashboard discovery count type:",
    type
  );

  console.log(
    "Dashboard discovery SQL:",
    query
  );

  console.log(
    "Dashboard discovery params:",
    values
  );

  const [rows] = await pool.execute(
    query,
    values
  );

  return Number(
    rows?.[0]?.profileCount || 0
  );
};

const getDiscoveryProfiles = async (
  profileId,
  discoveryType,
  profession = "",
  limit = 30
) => {
  const context =
    await getLoggedInProfileContext(profileId);

  let query = `
    SELECT
      profile_id,
      name,
      profile_for,
      current_age,
      mother_tongue,
      gotra,
      current_location,
      current_location_country,
      education,
      profession,
      designation,
      height,
      created_at
    FROM profile
    WHERE 1=1
  `;

  const values = [];

  const eligibilityResult =
    applyCandidateEligibility(
      query,
      values,
      context
    );

  query = eligibilityResult.query;

  const type = String(
    discoveryType || ""
  )
    .trim()
    .toUpperCase();

  switch (type) {
    case "RECENT":
      query += `
        ORDER BY created_at DESC
      `;
      break;

    case "SAME_CITY":
      if (!context.currentLocation) {
        return [];
      }

      query += `
        AND UPPER(TRIM(current_location))
            = UPPER(?)
        ORDER BY created_at DESC
      `;

      values.push(context.currentLocation);
      break;

    case "SAME_MOTHER_TONGUE":
      if (!context.motherTongue) {
        return [];
      }

      query += `
        AND UPPER(TRIM(mother_tongue))
            = UPPER(?)
        ORDER BY created_at DESC
      `;

      values.push(context.motherTongue);
      break;

    case "GOTRA":
      query += `
        ORDER BY created_at DESC
      `;
      break;

    case "PROFESSION": {
      const selectedProfession = String(
        profession || ""
      ).trim();

      if (!selectedProfession) {
        throw new Error(
          "Profession is required for profession discovery."
        );
      }

      query += `
        AND UPPER(TRIM(profession))
            = UPPER(?)
        ORDER BY created_at DESC
      `;

      values.push(selectedProfession);
      break;
    }

    case "INTERNATIONAL":
      query += `
        AND current_location_country IS NOT NULL
        AND TRIM(current_location_country) <> ''
        AND UPPER(TRIM(current_location_country))
            <> 'INDIA'
        ORDER BY created_at DESC
      `;
      break;

    default:
      throw new Error(
        `Unsupported discovery type: ${discoveryType}`
      );
  }

  const safeLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  query += ` LIMIT ${safeLimit}`;

  const [rows] = await pool.execute(
    query,
    values
  );

  return rows;
};

const getDiscoverySummary = async (profileId) => {
  const context =
    await getLoggedInProfileContext(profileId);

  let query = `
    SELECT
      COUNT(*) AS eligibleProfiles,

      SUM(
        CASE
          WHEN UPPER(TRIM(current_location)) = UPPER(?)
          THEN 1
          ELSE 0
        END
      ) AS sameCity,

      SUM(
        CASE
          WHEN UPPER(TRIM(mother_tongue)) = UPPER(?)
          THEN 1
          ELSE 0
        END
      ) AS sameMotherTongue,

      SUM(
        CASE
          WHEN current_location_country IS NOT NULL
           AND TRIM(current_location_country) <> ''
           AND UPPER(TRIM(current_location_country)) <> 'INDIA'
          THEN 1
          ELSE 0
        END
      ) AS internationalProfiles

    FROM profile
    WHERE 1=1
  `;

  const values = [
    context.currentLocation,
    context.motherTongue,
  ];

  const eligibilityResult =
    applyCandidateEligibility(
      query,
      values,
      context
    );

  query = eligibilityResult.query;

  const [rows] = await pool.execute(
    query,
    values
  );

  const row = rows?.[0] || {};

  return {
    recentlyJoined: Number(
      row.eligibleProfiles || 0
    ),

    sameCity: context.currentLocation
      ? Number(row.sameCity || 0)
      : 0,

    sameMotherTongue: context.motherTongue
      ? Number(row.sameMotherTongue || 0)
      : 0,

    compatibleGotra: Number(
      row.eligibleProfiles || 0
    ),

    international: Number(
      row.internationalProfiles || 0
    ),
  };
};

module.exports = {
  getLoggedInProfileContext,
  getDiscoveryCount,
  getDiscoveryProfiles,
  getDiscoverySummary,
};