const clean = (value) =>
  value === undefined || value === null
    ? ""
    : String(value).trim();

const applyCandidateEligibility = (
  query,
  values,
  {
    loggedInProfileId,
    loggedInProfileFor,
    loggedInGotra,
    tableAlias = "",
  }
) => {
  const profileId = clean(loggedInProfileId);
  const profileFor = clean(loggedInProfileFor);
  const gotra = clean(loggedInGotra);

  if (!profileId) {
    throw new Error(
      "Candidate eligibility requires logged-in profile ID."
    );
  }

  if (!profileFor) {
    throw new Error(
      "Candidate eligibility requires logged-in profile_for."
    );
  }

  if (!gotra) {
    throw new Error(
      "Candidate eligibility requires logged-in Gotra."
    );
  }

  const prefix = tableAlias
    ? `${tableAlias}.`
    : "";

  query += `
    AND UPPER(TRIM(${prefix}profile_status)) = 'APPROVED'
    AND ${prefix}profile_id <> ?
    AND ${prefix}profile_for <> ?
    AND ${prefix}gotra IS NOT NULL
    AND TRIM(${prefix}gotra) <> ''
    AND UPPER(TRIM(${prefix}gotra)) <> UPPER(?)
  `;

  values.push(
    profileId,
    profileFor,
    gotra
  );

  return {
    query,
    values,
  };
};

module.exports = {
  applyCandidateEligibility,
};