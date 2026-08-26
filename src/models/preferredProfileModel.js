const db = require('../config/db'); // Adjust path to your database config

class PreferredProfileModel {

  /**
   * Create a new preferred profile record
   * @param {Object} profileData - Preferred profile data
   * @returns {Promise<Object>} Created record with validity date
   */
  static async createPreferredProfile(profileData) {
    try {
      const {
        profile_id,
        email,
        phone_number,
        member_name,
        payment_amount,
        payment_method,
        payment_reference,
        payment_date,
        payment_time,
        member_narrative = null
      } = profileData;

      // Calculate validity date (payment_date + 90 days)
      const validityDate = new Date(payment_date);
      validityDate.setDate(validityDate.getDate() + 90);
      const validity_date = validityDate.toISOString().split('T')[0];

      /*
       * Idempotency:
       * if the same advertisement/payment reference
       * is submitted again, reuse the existing row.
       */
      const [sameSubmissionRows] =
        await db.execute(
          `
            SELECT id
            FROM preferred_profiles
            WHERE profile_id = ?
              AND payment_reference = ?
            ORDER BY id DESC
            LIMIT 1
          `,
          [
            profile_id,
            payment_reference
          ]
        );

      if (
        sameSubmissionRows.length > 0
      ) {
        return this.getPreferredProfileById(
          sameSubmissionRows[0].id
        );
      }

      /*
       * A different advertisement cannot be
       * started while one is already pending
       * or currently published.
       */
      const [existingRows] =
        await db.execute(
          `
            SELECT id, status
            FROM preferred_profiles
            WHERE profile_id = ?
              AND status IN (
                'pending_payment',
                'pending_review',
                'active'
              )
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [profile_id]
        );

      if (
        existingRows.length > 0
      ) {
        throw new Error(
          'Profile already has an advertisement in progress or active'
        );
      }

      const query = `
        INSERT INTO preferred_profiles (
          profile_id,
          email,
          phone_number,
          member_name,
          payment_amount,
          payment_method,
          payment_reference,
          payment_date,
          payment_time,
          validity_date,
          member_narrative,
          payment_status,
          review_status,
          moderator_narrative,
          preferred_flag,
          status
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          'PENDING',
          'PENDING',
          NULL,
          0,
          'pending_payment'
        )
      `;

      const values = [
        profile_id,
        email,
        phone_number,
        member_name,
        payment_amount,
        payment_method,
        payment_reference,
        payment_date,
        payment_time,
        validity_date,
        member_narrative
      ];

      const [result] = await db.execute(query, values);

      // Fetch and return the created record
      const createdRecord = await this.getPreferredProfileById(result.insertId);

      console.log(`[PreferredProfileModel] Created preferred profile for ${profile_id}, valid until ${validity_date}`);

      return createdRecord;
    } catch (error) {
      console.error('[PreferredProfileModel] Error creating preferred profile:', error);
      throw error;
    }
  }

  /**
   * Get preferred profile by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Preferred profile record
   */
  static async getPreferredProfileById(id) {
    try {
      const query = `
        SELECT
          id, profile_id, email, phone_number, member_name, payment_amount,
          payment_method, payment_reference, payment_date, payment_time,
          validity_date,
          member_narrative,
          payment_status,
          review_status,
          moderator_narrative,
          moderator_remarks,
          reviewed_by,
          reviewed_at,
          published_at,
          preferred_flag,
          status,
          created_at,
          updated_at,
          DATEDIFF(validity_date, CURDATE()) as days_remaining,
          CASE
            WHEN validity_date >= CURDATE() THEN 'valid'
            ELSE 'expired'
          END as validity_status
        FROM preferred_profiles
        WHERE id = ?
      `;

      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('[PreferredProfileModel] Error fetching preferred profile by ID:', error);
      throw error;
    }
  }

  /**
   * Get active preferred profile for a specific profile_id
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object|null>} Active preferred profile record
   */
  static async getActivePreferredProfile(profileId) {
    try {
      const query = `
        SELECT
          id, profile_id, email, phone_number, member_name, payment_amount,
          payment_method, payment_reference, payment_date, payment_time,
          validity_date,
          member_narrative,
          moderator_narrative,
          preferred_flag,
          status,
          created_at, updated_at,
          DATEDIFF(validity_date, CURDATE()) as days_remaining
        FROM preferred_profiles
        WHERE profile_id = ? AND status = 'active' AND validity_date >= CURDATE()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [profileId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('[PreferredProfileModel] Error fetching active preferred profile:', error);
      throw error;
    }
  }

  /**
   * Get all active preferred profiles (for ticker/advertisement)
   * @param {number} limit - Number of records to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of active preferred profiles
   */
  static async getActivePreferredProfiles(limit = 20, offset = 0) {
    try {
      // Ensure limit and offset are integers
      const parsedLimit = parseInt(limit, 10);
      const parsedOffset = parseInt(offset, 10);

      const query = `
        SELECT
          id, profile_id, email, phone_number, member_name, payment_amount,
          payment_method, payment_reference, payment_date, payment_time,
          validity_date,
          member_narrative,
          moderator_narrative,
          preferred_flag,
          status,
          created_at,
          updated_at,
          DATEDIFF(validity_date, CURDATE()) as days_remaining
        FROM preferred_profiles
        WHERE status = 'active'
          AND preferred_flag = 1
          AND validity_date >= CURDATE()
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;

      console.log('[PreferredProfileModel] Executing getActivePreferredProfiles query:', query);
      console.log('[PreferredProfileModel] Parameters:', [parsedLimit, parsedOffset]);

      const [rows] = await db.execute(query, [parsedLimit, parsedOffset]);
      return rows;
    } catch (error) {
      console.error('[PreferredProfileModel] Error fetching active preferred profiles:', error);
      throw error;
    }
  }
  /**
   * Get all advertisements belonging to one member.
   *
   * Includes historical advertisements and response
   * counts so My Advertisements can act as the
   * member's advertisement home.
   */
  static async getMyAdvertisements(
    profileId
  ) {
    try {
      const query = `
        SELECT
          pp.id,
          pp.profile_id,
          pp.member_name,
          pp.looking_for,

          pp.payment_amount,
          pp.payment_method,
          pp.payment_reference,
          pp.payment_date,
          pp.payment_time,

          pp.member_narrative,
          pp.moderator_narrative,
          pp.moderator_remarks,

          pp.payment_status,
          pp.review_status,
          pp.status,
          pp.preferred_flag,

          pp.validity_date,
          pp.published_at,
          pp.reviewed_at,
          pp.created_at,
          pp.updated_at,

          DATEDIFF(
            pp.validity_date,
            CURDATE()
          ) AS days_remaining,

          COALESCE(
            response_counts.total_responses,
            0
          ) AS total_responses,

          COALESCE(
            response_counts.interest_count,
            0
          ) AS interest_count,

          COALESCE(
            response_counts.apply_count,
            0
          ) AS apply_count,

          COALESCE(
            response_counts.mutual_count,
            0
          ) AS mutual_count

        FROM preferred_profiles pp

        LEFT JOIN (
          SELECT
            advertisement_id,

            COUNT(*) AS total_responses,

            SUM(
              CASE
                WHEN UPPER(
                  IFNULL(
                    response_type,
                    ''
                  )
                ) = 'INTEREST'
                THEN 1
                ELSE 0
              END
            ) AS interest_count,

            SUM(
              CASE
                WHEN UPPER(
                  IFNULL(
                    response_type,
                    ''
                  )
                ) = 'APPLY'
                THEN 1
                ELSE 0
              END
            ) AS apply_count,

            SUM(
              CASE
                WHEN UPPER(
                  IFNULL(
                    response_status,
                    ''
                  )
                ) = 'MUTUAL'
                THEN 1
                ELSE 0
              END
            ) AS mutual_count

          FROM advertisement_responses

          GROUP BY
            advertisement_id
        ) response_counts
          ON response_counts.advertisement_id =
             pp.id

        WHERE pp.profile_id = ?

        ORDER BY
          pp.created_at DESC,
          pp.id DESC
      `;

      const [rows] =
        await db.execute(
          query,
          [profileId]
        );

      return rows;
    } catch (error) {
      console.error(
        '[PreferredProfileModel] Error fetching member advertisements:',
        error
      );

      throw error;
    }
  }
  /**
   * Update advertisement narrative by its owner.
   *
   * member_narrative contains the member's latest
   * submitted or edited advertisement text.
   *
   * moderator_narrative contains only the
   * Moderator-approved published version.
   *
   * For an ACTIVE advertisement:
   * - keep moderator_narrative unchanged and live
   * - store the member revision in member_narrative
   * - return review_status to PENDING
   *
   * For a not-yet-published advertisement:
   * - update member_narrative only
   * - moderator_narrative remains reserved for approval.
   */
  static async updateMemberAdvertisement({
    advertisementId,
    profileId,
    advertisementText
  }) {
    try {
      const [rows] =
        await db.execute(
          `
            SELECT *
            FROM preferred_profiles
            WHERE id = ?
              AND profile_id = ?
            LIMIT 1
          `,
          [
            advertisementId,
            profileId
          ]
        );

      if (rows.length === 0) {
        return null;
      }

      const advertisement =
        rows[0];

      const status =
        String(
          advertisement.status || ""
        )
          .trim()
          .toLowerCase();

      if (
        ![
          "pending_payment",
          "pending_review",
          "active",
          "rejected"
        ].includes(status)
      ) {
        throw new Error(
          "This advertisement cannot be edited in its current status"
        );
      }

      /*
       * Published advertisement:
       * keep moderator_narrative unchanged so the
       * currently approved version remains live.
       */
      if (status === "active") {
        await db.execute(
          `
            UPDATE preferred_profiles
            SET
              member_narrative = ?,
              review_status = 'PENDING',
              moderator_remarks = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND profile_id = ?
          `,
          [
            advertisementText,
            advertisementId,
            profileId
          ]
        );

        return this.getPreferredProfileById(
          advertisementId
        );
      }

      /*
       * Advertisement rejected after payment:
       * a member correction returns it to Moderator review.
       */
      if (status === "rejected") {
        await db.execute(
          `
            UPDATE preferred_profiles
            SET
              member_narrative = ?,
              moderator_narrative = NULL,
              moderator_remarks = NULL,
              review_status = 'PENDING',
              status = 'pending_review',
              preferred_flag = 0,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND profile_id = ?
          `,
          [
            advertisementText,
            advertisementId,
            profileId
          ]
        );

        return this.getPreferredProfileById(
          advertisementId
        );
      }

      /*
       * Pending payment / initial review:
       * store the member's latest advertisement
       * only in member_narrative.
       *
       * moderator_narrative remains reserved for
       * Moderator-approved published content.
       */
      await db.execute(
        `
          UPDATE preferred_profiles
          SET
            member_narrative = ?,
            moderator_remarks = NULL,
            review_status =
              CASE
                WHEN status = 'pending_review'
                  THEN 'PENDING'
                ELSE review_status
              END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND profile_id = ?
        `,
        [
          advertisementText,
          advertisementId,
          profileId
        ]
      );

      return this.getPreferredProfileById(
        advertisementId
      );
    } catch (error) {
      console.error(
        "[PreferredProfileModel] Error updating member advertisement:",
        error
      );

      throw error;
    }
  }

  /**
   * Get preferred profiles by email
   * @param {string} email - User email
   * @returns {Promise<Array>} Array of preferred profile records for the email
   */
  static async getPreferredProfilesByEmail(email) {
    try {
      const query = `
        SELECT
          id, profile_id, email, phone_number, member_name, payment_amount,
          payment_method, payment_reference, payment_date, payment_time,
          validity_date,
          member_narrative,
          payment_status,
          review_status,
          moderator_narrative,
          moderator_remarks,
          reviewed_by,
          reviewed_at,
          published_at,
          preferred_flag,
          status,
          created_at,
          updated_at,
          DATEDIFF(validity_date, CURDATE()) as days_remaining,
          CASE
            WHEN validity_date >= CURDATE() THEN 'valid'
            ELSE 'expired'
          END as validity_status
        FROM preferred_profiles
        WHERE email = ?
        ORDER BY created_at DESC
      `;

      const [rows] = await db.execute(query, [email]);
      return rows;
    } catch (error) {
      console.error('[PreferredProfileModel] Error fetching preferred profiles by email:', error);
      throw error;
    }
  }

  /**
   * Update expired preferred profiles (can be called via cron job)
   * @returns {Promise<number>} Number of updated records
   */
  static async updateExpiredProfiles() {
    try {
      const query = `
        UPDATE preferred_profiles
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'active' AND validity_date < CURDATE()
      `;

      const [result] = await db.execute(query);

      console.log(`[PreferredProfileModel] Updated ${result.affectedRows} expired preferred profiles`);

      return result.affectedRows;
    } catch (error) {
      console.error('[PreferredProfileModel] Error updating expired profiles:', error);
      throw error;
    }
  }

  /**
   * Cancel or withdraw one advertisement
   * owned by a member.
   *
   * No record is deleted. Payment, narrative,
   * publication and response history remain intact.
   */
  static async cancelMemberAdvertisement({
    advertisementId,
    profileId
  }) {
    try {
      const [rows] =
        await db.execute(
          `
            SELECT
              id,
              profile_id,
              status
            FROM preferred_profiles
            WHERE id = ?
              AND profile_id = ?
            LIMIT 1
          `,
          [
            advertisementId,
            profileId
          ]
        );

      if (rows.length === 0) {
        return null;
      }

      const advertisement =
        rows[0];

      const status =
        String(
          advertisement.status || ""
        )
          .trim()
          .toLowerCase();

      if (
        ![
          "pending_payment",
          "pending_review",
          "active"
        ].includes(status)
      ) {
        throw new Error(
          "This advertisement cannot be cancelled in its current status"
        );
      }

      await db.execute(
        `
          UPDATE preferred_profiles
          SET
            status = 'cancelled',
            preferred_flag = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND profile_id = ?
        `,
        [
          advertisementId,
          profileId
        ]
      );

      console.log(
        `[PreferredProfileModel] Cancelled advertisement ${advertisementId} for ${profileId}`
      );

      return this.getPreferredProfileById(
        advertisementId
      );
    } catch (error) {
      console.error(
        "[PreferredProfileModel] Error cancelling member advertisement:",
        error
      );

      throw error;
    }
  }

  /**
   * Get preferred profiles count and statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getPreferredProfilesStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_records,
          COUNT(CASE WHEN status = 'active' AND validity_date >= CURDATE() THEN 1 END) as active_count,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
          SUM(CASE WHEN status = 'active' AND validity_date >= CURDATE() THEN payment_amount ELSE 0 END) as active_revenue
        FROM preferred_profiles
      `;

      const [rows] = await db.execute(query);
      return rows[0];
    } catch (error) {
      console.error('[PreferredProfileModel] Error fetching preferred profiles stats:', error);
      throw error;
    }
  }

  /**
   * Check if a profile is currently preferred
   * @param {string} profileId - Profile ID
   * @returns {Promise<boolean>} True if profile is currently preferred
   */
  static async isProfilePreferred(profileId) {
    try {
      const activeRecord = await this.getActivePreferredProfile(profileId);
      return activeRecord !== null;
    } catch (error) {
      console.error('[PreferredProfileModel] Error checking if profile is preferred:', error);
      return false;
    }
  }

  /**
   * Get preferred profiles for ticker display (random selection)
   * @param {number} limit - Number of profiles for ticker
   * @returns {Promise<Array>} Array of preferred profiles for ticker
   */
  static async getPreferredProfilesForTicker(limit = 10) {
    try {
      // The 'limit' parameter is no longer used in the SQL query as per user's request.
      // It's kept in the function signature for compatibility if needed elsewhere.
      const parsedLimit = parseInt(limit, 10); // Still parse for logging/potential future use

      const query = `
        SELECT
          profile_id, member_name, validity_date,
          DATEDIFF(validity_date, CURDATE()) as days_remaining
        FROM preferred_profiles
        WHERE status = 'active'
          AND preferred_flag = 1
          AND validity_date >= CURDATE()
        ORDER BY RAND()
      `;

      console.log('[PreferredProfileModel] Executing getPreferredProfilesForTicker query (no LIMIT):', query);
      console.log('[PreferredProfileModel] Parameters (none passed to DB): []');

      const [rows] = await db.execute(query); // No limit parameter passed
      return rows;
    } catch (error) {
      console.error('[PreferredProfileModel] Error fetching preferred profiles for ticker:', error);
      throw error;
    }
  }

/**
 * Get preferred profiles for frontend display (Home/Dashboard) with full profile details
 * @param {number} limit - Number of profiles to fetch (no longer used in query)
 * @param {string} format - Format type ('ticker' or 'cards')
 * @returns {Promise<Array>} Array of preferred profiles for display
 */
static async getPreferredProfilesForDisplay(limit = 10, format = 'ticker') {
  try {
    let query;
    // The 'limit' parameter is no longer used in the SQL query as per user's request.
    // It's kept in the function signature for compatibility if needed elsewhere.
    const parsedLimit = parseInt(limit, 10); // Still parse for logging/potential future use

    console.log('[PreferredProfileModel] getPreferredProfilesForDisplay - Received Limit (not used in query):', limit, 'Parsed Limit:', parsedLimit, 'Type:', typeof parsedLimit);

    if (format === 'ticker') {
      query = `
        SELECT
          pp.id,
          pp.profile_id,
          pp.member_name,
          pp.looking_for,

          NULLIF(
            pp.moderator_narrative,
            ''
          ) AS transaction_details,

          DATEDIFF(
            pp.validity_date,
            CURDATE()
          ) AS days_remaining,

          pp.updated_at,

          COALESCE(
            p.name,
            pp.member_name,
            'N/A'
          ) AS name,

          COALESCE(
            p.current_age,
            0
          ) AS current_age,

          COALESCE(
            p.gotra,
            'Not specified'
          ) AS gotra,

          COALESCE(
            p.profession,
            p.designation,
            'Not specified'
          ) AS profession,

          COALESCE(
            p.current_location,
            'Not specified'
          ) AS city,

          COALESCE(
            p.annual_income,
            'Not specified'
          ) AS annual_income,

          COALESCE(
            p.education,
            'Not specified'
          ) AS education,

          COALESCE(
            p.profile_category_need,
            ''
          ) AS profile_category_need

        FROM preferred_profiles pp

        LEFT JOIN profile p
          ON p.profile_id =
             pp.profile_id

        WHERE pp.status = 'active'
          AND pp.preferred_flag = 1
          AND pp.validity_date >= CURDATE()

        ORDER BY pp.updated_at DESC
      `;
    } else {
      // FIXED: Enhanced query with proper field mappings and null handling
      query = `
        SELECT
          pp.id,
          pp.profile_id,
          pp.member_name,
          pp.looking_for,
          NULLIF(
            pp.moderator_narrative,
            ''
          ) AS transaction_details,
          pp.payment_amount,
          pp.validity_date,
          DATEDIFF(pp.validity_date, CURDATE()) as days_remaining,
          pp.updated_at,
          pp.created_at,

          -- Fields from the profile table with proper null handling
          COALESCE(p.name, pp.member_name, 'N/A') as name,
          COALESCE(p.current_age, 0) as current_age,
          COALESCE(p.gotra, 'Not specified') as gotra,
          COALESCE(p.rashi, 'Not specified') as rashi,
          COALESCE(p.nakshatra, 'Not specified') as nakshatra,
          COALESCE(p.profession, p.designation, 'Not specified') as profession,
          COALESCE(p.current_location, p.current_location, 'Not specified') as city,
          COALESCE(p.working_status, 'Not specified') as working_status,
          COALESCE(p.education, 'Not specified') as education,
          COALESCE(p.designation, 'Not specified') as designation,
          COALESCE(p.married_status, 'Not specified') as married_status,

          -- Additional fields that might be useful
          COALESCE(p.height, 'Not specified') as height,
          COALESCE(p.mother_tongue, 'Not specified') as mother_tongue

        FROM preferred_profiles pp
        LEFT JOIN profile p ON pp.profile_id = p.profile_id
        WHERE pp.status = 'active'
          AND pp.preferred_flag = 1
          AND pp.validity_date >= CURDATE()
        ORDER BY pp.updated_at DESC
      `;
    }

    console.log('[PreferredProfileModel] Executing getPreferredProfilesForDisplay query (no LIMIT):', query);
    console.log('[PreferredProfileModel] Parameters (none passed to DB): []');

    const [rows] = await db.execute(query); // No limit parameter passed

    return rows.map(row => ({
      ...row,
      // Keep the complete approved advertisement narrative.
      // Do not truncate the advertisement in the API.
      display_summary:
        row.transaction_details &&
        row.transaction_details.trim()
          ? row.transaction_details
          : `${row.name || row.member_name || 'Profile'} is a preferred member looking for a life partner.`,

      // Ensure proper date formatting
      display_date: row.updated_at ? new Date(row.updated_at).toLocaleDateString() : null,

      // Add urgency indicator
      urgency: row.days_remaining <= 7 ? 'urgent' : row.days_remaining <= 30 ? 'moderate' : 'normal',

      // Ensure age is a number
      current_age: parseInt(row.current_age) || 0,

      // Clean up any null values that might cause frontend issues
      profile_id: row.profile_id || 'N/A',
      member_name: row.member_name || row.name || 'N/A',
      name: row.name || row.member_name || 'N/A',
      city: row.city || 'Not specified',
      profession: row.profession || 'Not specified',
      gotra: row.gotra || 'Not specified',
      rashi: row.rashi || 'Not specified',
      nakshatra: row.nakshatra || 'Not specified'
    }));
  } catch (error) {
    console.error('[PreferredProfileModel] Error fetching preferred profiles for display:', error);
    throw error;
  }
}

  /**
   * NEW: Get cached preferred profiles for display (with simple in-memory caching)
   * @param {number} limit - Number of profiles to fetch
   * @param {string} format - Format type ('ticker' or 'cards')
   * @returns {Promise<Array>} Array of preferred profiles for display
   */
  static async getCachedPreferredProfilesForDisplay(limit = 10, format = 'ticker') {
    try {
      // Simple cache implementation - in production, use Redis or similar
      // The 'limit' parameter is still used for cache key differentiation,
      // even though the underlying SQL query no longer uses it.
      const cacheKey = `preferred_profiles_${format}_${limit}`;
      const cacheTimeout = 5 * 60 * 1000; // 5 minutes

      // Check if we have a cache (this would be stored in Redis in production)
      if (this._cache && this._cache[cacheKey] &&
          (Date.now() - this._cache[cacheKey].timestamp) < cacheTimeout) {
        console.log(`[PreferredProfileModel] Returning cached data for ${cacheKey}`);
        return this._cache[cacheKey].data;
      }

      // Fetch fresh data. The parsed limit is passed to getPreferredProfilesForDisplay,
      // but it will be ignored in the SQL query itself.
      const data = await this.getPreferredProfilesForDisplay(parseInt(limit, 10), format);

      // Store in cache
      if (!this._cache) this._cache = {};
      this._cache[cacheKey] = {
        data,
        timestamp: Date.now()
      };

      console.log(`[PreferredProfileModel] Cached fresh data for ${cacheKey}`);
      return data;

    } catch (error) {
      console.error('[PreferredProfileModel] Error in cached preferred profiles:', error);
      // Fallback to non-cached version, ensuring limit is an integer
      return this.getPreferredProfilesForDisplay(parseInt(limit, 10), format);
    }
  }

    static async getAdvertisementReviewQueue() {
    const query = `
      SELECT
        pp.id,
        pp.profile_id,
        pp.member_name,
        pp.looking_for,
        pp.email,
        pp.phone_number,
        pp.payment_amount,
        pp.payment_method,
        pp.payment_reference,
        pp.payment_date,
        pp.payment_time,
        pp.member_narrative,
        pp.moderator_narrative,
        pp.payment_status,
        pp.review_status,
        pp.status,
        pp.moderator_remarks,
        pp.reviewed_by,
        pp.reviewed_at,
        pp.created_at,
        pp.updated_at,

        p.name,
        p.current_age,
        p.gotra,
        p.rashi,
        p.nakshatra,
        p.education,
        p.profession,
        p.designation,
        p.current_location,
        p.annual_income

      FROM preferred_profiles pp

      LEFT JOIN profile p
        ON p.profile_id = pp.profile_id

      WHERE (
          pp.status = 'pending_review'
          OR (
            pp.status = 'active'
            AND UPPER(
              IFNULL(
                pp.review_status,
                ''
              )
            ) = 'PENDING'
          )
        )
        AND UPPER(
          IFNULL(
            pp.payment_status,
            ''
          )
        ) = 'APPROVED'

      ORDER BY pp.created_at ASC, pp.id ASC
    `;

    const [rows] =
      await db.execute(query);

    return rows;
  }

  static async findByProfileAndPaymentReference(
    profileId,
    paymentReference
  ) {
    const [rows] =
      await db.execute(
        `
          SELECT *
          FROM preferred_profiles
          WHERE profile_id = ?
            AND payment_reference = ?
          ORDER BY id DESC
          LIMIT 1
        `,
        [
          profileId,
          paymentReference
        ]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }



  static async updateAdvertisementPaymentStatus({
    profileId,
    paymentReference,
    paymentStatus
  }) {
    const normalized =
      String(paymentStatus || "")
        .trim()
        .toUpperCase();

    let status;
    let reviewStatus;

    if (normalized === "APPROVED") {
      status = "pending_review";
      reviewStatus = "PENDING";
    } else if (
      normalized === "REJECTED"
    ) {
      status = "payment_rejected";
      reviewStatus = "REJECTED";
    } else {
      throw new Error(
        "Invalid advertisement payment status"
      );
    }

    const [result] =
      await db.execute(
        `
          UPDATE preferred_profiles
          SET
            payment_status = ?,
            review_status = ?,
            status = ?,
            preferred_flag = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE profile_id = ?
            AND payment_reference = ?
            AND status = 'pending_payment'
        `,
        [
          normalized,
          reviewStatus,
          status,
          profileId,
          paymentReference
        ]
      );

    return result.affectedRows > 0;
  }


  static async reviewAdvertisement({
    advertisementId,
    action,
    moderatorNarrative,
    moderatorRemarks,
    reviewedBy
  }) {
    const normalizedAction =
      String(action || "")
        .trim()
        .toUpperCase();

    if (
      !["APPROVE", "REJECT"].includes(
        normalizedAction
      )
    ) {
      throw new Error(
        "Invalid advertisement review action"
      );
    }

    const advertisement =
      await this.getPreferredProfileById(
        advertisementId
      );

    if (!advertisement) {
      return null;
    }

    if (
      String(
        advertisement.payment_status || ""
      ).toUpperCase() !== "APPROVED"
    ) {
      throw new Error(
        "Advertisement payment must be approved before advertisement review"
      );
    }

    if (
      normalizedAction === "REJECT"
    ) {
      const wasAlreadyPublished =
        String(
          advertisement.status || ""
        )
          .trim()
          .toLowerCase() === "active" &&
        Boolean(
          advertisement.published_at
        );

      if (wasAlreadyPublished) {
        /*
         * Reject only the proposed revision.
         * Keep the previously approved advertisement
         * live and preserve moderator_narrative.
         */
        await db.execute(
          `
            UPDATE preferred_profiles
            SET
              moderator_remarks = ?,
              review_status = 'REJECTED',
              status = 'active',
              preferred_flag = 1,
              reviewed_by = ?,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          [
            moderatorRemarks || null,
            reviewedBy || null,
            advertisementId
          ]
        );
      } else {
        /*
         * Initial advertisement rejected before
         * publication.
         */
        await db.execute(
          `
            UPDATE preferred_profiles
            SET
              moderator_remarks = ?,
              review_status = 'REJECTED',
              status = 'rejected',
              preferred_flag = 0,
              reviewed_by = ?,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          [
            moderatorRemarks || null,
            reviewedBy || null,
            advertisementId
          ]
        );
      }

      return this.getPreferredProfileById(
        advertisementId
      );
    }

    /*
     * Publication validity starts when Moderator
     * approves the advertisement, not when the
     * member submitted payment details.
     */
    const wasAlreadyPublished =
      String(
        advertisement.status || ""
      )
        .trim()
        .toLowerCase() === "active" &&
      Boolean(
        advertisement.published_at
      );

    await db.execute(
      `
        UPDATE preferred_profiles
        SET
          moderator_narrative = ?,
          moderator_remarks = ?,
          review_status = 'APPROVED',
          status = 'active',
          preferred_flag = 1,

          validity_date =
            CASE
              WHEN ? = 1
                THEN validity_date
              ELSE DATE_ADD(
                CURDATE(),
                INTERVAL 90 DAY
              )
            END,

          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,

          published_at =
            CASE
              WHEN ? = 1
                THEN published_at
              ELSE CURRENT_TIMESTAMP
            END,

          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [
        moderatorNarrative ||
          advertisement.member_narrative ||
          advertisement.moderator_narrative ||
          "",
        moderatorRemarks || null,
        wasAlreadyPublished ? 1 : 0,
        reviewedBy || null,
        wasAlreadyPublished ? 1 : 0,
        advertisementId
      ]
    );

    return this.getPreferredProfileById(
      advertisementId
    );
  }
}

module.exports = PreferredProfileModel;
