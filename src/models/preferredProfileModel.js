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
        payment_amount = 250.00,
        payment_method,
        payment_reference,
        payment_date,
        payment_time,
        transaction_details = null
      } = profileData;

      // Calculate validity date (payment_date + 90 days)
      const validityDate = new Date(payment_date);
      validityDate.setDate(validityDate.getDate() + 90);
      const validity_date = validityDate.toISOString().split('T')[0];

      // Check if profile already has an active preferred status
      const existingActive = await this.getActivePreferredProfile(profile_id);
      if (existingActive) {
        throw new Error('Profile already has an active preferred status');
      }

      const query = `
        INSERT INTO preferred_profiles (
          profile_id, email, phone_number, member_name, payment_amount,
          payment_method, payment_reference, payment_date, payment_time,
          validity_date, transaction_details, preferred_flag, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
      `;

      const values = [
        profile_id, email, phone_number, member_name, payment_amount,
        payment_method, payment_reference, payment_date, payment_time,
        validity_date, transaction_details
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
          validity_date, transaction_details, preferred_flag, status,
          created_at, updated_at,
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
          validity_date, transaction_details, preferred_flag, status,
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
          validity_date, transaction_details, preferred_flag, status,
          created_at, updated_at,
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
          validity_date, transaction_details, preferred_flag, status,
          created_at, updated_at,
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
   * Cancel preferred profile (manual cancellation)
   * @param {string} profileId - Profile ID
   * @returns {Promise<boolean>} Success status
   */
  static async cancelPreferredProfile(profileId) {
    try {
      const query = `
        UPDATE preferred_profiles
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE profile_id = ? AND status = 'active'
      `;

      const [result] = await db.execute(query, [profileId]);

      console.log(`[PreferredProfileModel] Cancelled preferred profile for ${profileId}`);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('[PreferredProfileModel] Error cancelling preferred profile:', error);
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
          pp.profile_id,
          pp.member_name,
          pp.transaction_details,
          DATEDIFF(pp.validity_date, CURDATE()) as days_remaining,
          pp.updated_at
        FROM preferred_profiles pp
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
          pp.transaction_details,
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
      // Ensure display_summary is always available
      display_summary: row.transaction_details && row.transaction_details.trim()
        ? (row.transaction_details.length > 100
          ? row.transaction_details.substring(0, 97) + '...'
          : row.transaction_details)
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
}

module.exports = PreferredProfileModel;
