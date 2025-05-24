const PreferredProfileModel = require('../models/preferredProfileModel');

class PreferredProfileController {

  /**
   * Create a new preferred profile record
   * POST /api/preferred-profiles
   */
  static async createPreferredProfile(req, res) {
    try {
      console.log('[PreferredProfileController] Creating preferred profile:', req.body);

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
        transaction_details
      } = req.body;

      // Validation
      if (!profile_id || !email || !phone_number || !member_name || !payment_method || !payment_reference) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: profile_id, email, phone_number, member_name, payment_method, payment_reference'
        });
      }

      // Create preferred profile record
      const createdRecord = await PreferredProfileModel.createPreferredProfile({
        profile_id,
        email,
        phone_number,
        member_name,
        payment_amount: payment_amount || 250.00,
        payment_method,
        payment_reference,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        payment_time: payment_time || new Date().toTimeString().split(' ')[0],
        transaction_details
      });

      console.log('[PreferredProfileController] Successfully created preferred profile:', createdRecord.profile_id);

      res.status(201).json({
        success: true,
        message: 'Preferred profile created successfully',
        data: createdRecord
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error creating preferred profile:', error);
      
      if (error.message.includes('already has an active preferred status')) {
        return res.status(409).json({
          success: false,
          message: 'Profile already has an active preferred status'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating preferred profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get preferred profile by ID
   * GET /api/preferred-profiles/:id
   */
  static async getPreferredProfileById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid preferred profile ID'
        });
      }

      const preferredProfile = await PreferredProfileModel.getPreferredProfileById(parseInt(id));

      if (!preferredProfile) {
        return res.status(404).json({
          success: false,
          message: 'Preferred profile not found'
        });
      }

      res.status(200).json({
        success: true,
        data: preferredProfile
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error fetching preferred profile by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching preferred profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get active preferred profile for a profile ID
   * GET /api/preferred-profiles/profile/:profileId
   */
  static async getActivePreferredProfile(req, res) {
    try {
      const { profileId } = req.params;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      const activePreferred = await PreferredProfileModel.getActivePreferredProfile(profileId);

      if (!activePreferred) {
        return res.status(404).json({
          success: false,
          message: 'No active preferred profile found for this profile ID'
        });
      }

      res.status(200).json({
        success: true,
        data: activePreferred
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error fetching active preferred profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching active preferred profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all active preferred profiles (for ticker/advertisement)
   * GET /api/preferred-profiles/active
   */
  static async getActivePreferredProfiles(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100'
        });
      }

      const activeProfiles = await PreferredProfileModel.getActivePreferredProfiles(limit, offset);

      res.status(200).json({
        success: true,
        data: activeProfiles,
        meta: {
          limit,
          offset,
          count: activeProfiles.length
        }
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error fetching active preferred profiles:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching active preferred profiles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get preferred profiles by email
   * GET /api/preferred-profiles/email/:email
   */
  static async getPreferredProfilesByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const profiles = await PreferredProfileModel.getPreferredProfilesByEmail(email);

      res.status(200).json({
        success: true,
        data: profiles,
        meta: {
          count: profiles.length
        }
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error fetching preferred profiles by email:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching preferred profiles by email',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get preferred profiles for ticker display
   * GET /api/preferred-profiles/ticker
   */
  static async getPreferredProfilesForTicker(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      if (limit > 50) {
        return res.status(400).json({
          success: false,
          message: 'Ticker limit cannot exceed 50'
        });
      }

      const tickerProfiles = await PreferredProfileModel.getPreferredProfilesForTicker(limit);

      res.status(200).json({
        success: true,
        data: tickerProfiles,
        meta: {
          count: tickerProfiles.length
        }
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error fetching preferred profiles for ticker:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching ticker profiles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Check if a profile is currently preferred
   * GET /api/preferred-profiles/check/:profileId
   */
  static async checkIfProfilePreferred(req, res) {
    try {
      const { profileId } = req.params;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      const isPreferred = await PreferredProfileModel.isProfilePreferred(profileId);

      res.status(200).json({
        success: true,
        data: {
          profile_id: profileId,
          is_preferred: isPreferred
        }
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error checking if profile is preferred:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while checking preferred status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancel preferred profile
   * PUT /api/preferred-profiles/cancel/:profileId
   */
  static async cancelPreferredProfile(req, res) {
    try {
      const { profileId } = req.params;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      const cancelled = await PreferredProfileModel.cancelPreferredProfile(profileId);

      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message: 'No active preferred profile found to cancel'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Preferred profile cancelled successfully'
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error cancelling preferred profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while cancelling preferred profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get preferred profiles statistics
   * GET /api/preferred-profiles/stats
   */
  static async getPreferredProfilesStats(req, res) {
    try {
      const stats = await PreferredProfileModel.getPreferredProfilesStats();

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error fetching preferred profiles stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update expired preferred profiles (admin/cron endpoint)
   * PUT /api/preferred-profiles/update-expired
   */
  static async updateExpiredProfiles(req, res) {
    try {
      const updatedCount = await PreferredProfileModel.updateExpiredProfiles();

      res.status(200).json({
        success: true,
        message: `Updated ${updatedCount} expired preferred profiles`,
        data: {
          updated_count: updatedCount
        }
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error updating expired profiles:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating expired profiles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = PreferredProfileController;