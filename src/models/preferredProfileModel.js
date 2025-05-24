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
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, [limit, offset]);
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
      const query = `
        SELECT 
          profile_id, member_name, validity_date,
          DATEDIFF(validity_date, CURDATE()) as days_remaining
        FROM preferred_profiles 
        WHERE status = 'active' 
          AND preferred_flag = 1 
          AND validity_date >= CURDATE()
        ORDER BY RAND()
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [limit]);
      return rows;
    } catch (error) {
      console.error('[PreferredProfileModel] Error fetching preferred profiles for ticker:', error);
      throw error;
    }
  }
}

module.exports = PreferredProfileModel;