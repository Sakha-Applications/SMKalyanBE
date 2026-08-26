const PreferredProfileModel =
  require('../models/preferredProfileModel');

const adminSettingsModel =
  require('../models/adminSettingsModel');

const ADVERTISEMENT_MAX_LENGTH = 1000;

class PreferredProfileController {

    /**
   * Get the Admin-configured minimum advertisement contribution.
   * GET /api/preferred-profiles/minimum-contribution
   */
  static async getAdvertisementMinimumContribution(
    req,
    res
  ) {
    try {
      const settings =
        await adminSettingsModel.getSettings();

      const rawValue =
        settings[
          adminSettingsModel.KEYS
            .ADVERTISEMENT_MIN_CONTRIBUTION
        ];

      if (
        rawValue === undefined ||
        rawValue === null ||
        String(rawValue).trim() === ""
      ) {
        return res.status(503).json({
          success: false,
          message:
            "Minimum advertisement contribution has not been configured by Admin."
        });
      }

      const minimumContribution =
        Number(rawValue);

      if (
        !Number.isFinite(
          minimumContribution
        ) ||
        minimumContribution < 0
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Minimum advertisement contribution configuration is invalid."
        });
      }

      return res.status(200).json({
        success: true,
        minimumContribution
      });
    } catch (error) {
      console.error(
        "[PreferredProfileController] Unable to load advertisement minimum contribution:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load advertisement contribution settings."
      });
    }
  }

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
        member_narrative
      } = req.body;

      // Required-field validation.
      if (
        !profile_id ||
        !email ||
        !phone_number ||
        !member_name ||
        !payment_method ||
        !payment_reference
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Missing required fields: profile_id, email, phone_number, member_name, payment_method, payment_reference'
        });
      }

      /*
       * Advertisement contribution is controlled
       * by the Admin-configured minimum.
       *
       * Members may pay the configured minimum
       * or any higher amount.
       */
      const settings =
        await adminSettingsModel.getSettings();

      const configuredMinimum =
        settings[
          adminSettingsModel.KEYS
            .ADVERTISEMENT_MIN_CONTRIBUTION
        ];

      if (
        configuredMinimum === undefined ||
        configuredMinimum === null ||
        String(
          configuredMinimum
        ).trim() === ""
      ) {
        return res.status(503).json({
          success: false,
          message:
            "Advertisement contribution is not configured. Please contact the administrator."
        });
      }

      const minimumContribution =
        Number(configuredMinimum);

      const submittedAmount =
        Number(payment_amount);

      if (
        !Number.isFinite(
          minimumContribution
        ) ||
        minimumContribution < 0
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Advertisement contribution configuration is invalid."
        });
      }

      if (
        !Number.isFinite(
          submittedAmount
        ) ||
        submittedAmount <
          minimumContribution
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Advertisement contribution must be at least ₹${minimumContribution}.`
        });
      }

      const normalizedMemberNarrative =
        String(
          member_narrative || ""
        ).trim();

      if (!normalizedMemberNarrative) {
        return res.status(400).json({
          success: false,
          message:
            "Advertisement text is required."
        });
      }

      if (
        normalizedMemberNarrative.length >
        ADVERTISEMENT_MAX_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Advertisement text cannot exceed ${ADVERTISEMENT_MAX_LENGTH} characters.`
        });
      }

      // Create preferred profile record
      const createdRecord =
        await PreferredProfileModel
          .createPreferredProfile({
            profile_id,
            email,
            phone_number,
            member_name,
            payment_amount:
              submittedAmount,
            payment_method,
            payment_reference,

            payment_date:
              payment_date ||
              new Date()
                .toISOString()
                .split('T')[0],

            payment_time:
              payment_time ||
              new Date()
                .toTimeString()
                .split(' ')[0],

            member_narrative:
              normalizedMemberNarrative
          });

      console.log('[PreferredProfileController] Successfully created preferred profile:', createdRecord.profile_id);

      res.status(201).json({
        success: true,
        message: 'Preferred profile created successfully',
        data: createdRecord
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error creating preferred profile:', error);
      
      if (
        error.message.includes(
          'advertisement in progress or active'
        ) ||
        error.message.includes(
          'active preferred status'
        )
      ) {
        return res.status(409).json({
          success: false,
          message:
            'You already have an advertisement in progress or currently active. Please use My Advertisements to review or manage your existing advertisement.'
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
   * Get advertisements belonging to the
   * currently authenticated member.
   *
   * GET /api/preferred-profiles/my-advertisements
   */
  static async getMyAdvertisements(
    req,
    res
  ) {
    try {
      const profileId =
        req.user?.profile_id ||
        req.user?.profileId ||
        req.user?.id;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message:
            "Authenticated Profile ID is required."
        });
      }

      const advertisements =
        await PreferredProfileModel
          .getMyAdvertisements(
            profileId
          );

      return res.status(200).json({
        success: true,
        data: advertisements,
        meta: {
          count:
            advertisements.length
        }
      });
    } catch (error) {
      console.error(
        "[PreferredProfileController] Unable to load member advertisements:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load your advertisements."
      });
    }
  }
  /**
   * Update an advertisement owned by the
   * currently authenticated member.
   *
   * PUT /api/preferred-profiles/my-advertisements/:id
   */
  static async updateMyAdvertisement(
    req,
    res
  ) {
    try {
      const profileId =
        req.user?.profile_id ||
        req.user?.profileId ||
        req.user?.id;

      const advertisementId =
        Number(req.params?.id);

      const advertisementText =
        String(
          req.body?.advertisementText ||
          ""
        ).trim();

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message:
            "Authenticated Profile ID is required."
        });
      }

      if (
        !Number.isInteger(
          advertisementId
        ) ||
        advertisementId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Advertisement ID is required."
        });
      }

      if (!advertisementText) {
        return res.status(400).json({
          success: false,
          message:
            "Advertisement text is required."
        });
      }

      if (
        advertisementText.length >
        ADVERTISEMENT_MAX_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Advertisement text cannot exceed ${ADVERTISEMENT_MAX_LENGTH} characters.`
        });
      }

      const updated =
        await PreferredProfileModel
          .updateMemberAdvertisement({
            advertisementId,
            profileId,
            advertisementText
          });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message:
            "Advertisement was not found."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          String(updated.status || "")
            .toLowerCase() ===
          "active"
            ? "Your changes have been submitted for Moderator review. The currently approved advertisement will remain published until the revision is approved."
            : "Advertisement updated and submitted for review.",
        data: updated
      });
    } catch (error) {
      console.error(
        "[PreferredProfileController] Unable to update member advertisement:",
        error
      );

      if (
        String(error.message || "")
          .includes(
            "cannot be edited"
          )
      ) {
        return res.status(409).json({
          success: false,
          message:
            error.message
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update your advertisement."
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
   * NEW: Get preferred profiles for frontend display (Home/Dashboard)
   * GET /api/preferred-profiles/display
   */
  static async getPreferredProfilesForDisplay(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const format = req.query.format || 'ticker'; // 'ticker' or 'cards'

      if (limit > 50) {
        return res.status(400).json({
          success: false,
          message: 'Display limit cannot exceed 50'
        });
      }

      let profiles;
      
      if (format === 'ticker') {
        // For ticker: simplified data with the Moderator-approved published narrative.
        profiles = await PreferredProfileModel.getPreferredProfilesForDisplay(limit, 'ticker');
      } else if (format === 'cards') {
        // For cards: more detailed data
        profiles = await PreferredProfileModel.getPreferredProfilesForDisplay(limit, 'cards');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Use "ticker" or "cards"'
        });
      }

      // Add cache headers for performance
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'ETag': `"${Date.now()}"` // Simple ETag
      });

      res.status(200).json({
        success: true,
        data: profiles,
        meta: {
          format,
          count: profiles.length,
          refreshInterval: 300000 // 5 minutes in milliseconds
        }
      });

    } catch (error) {
      console.error('[PreferredProfileController] Error fetching preferred profiles for display:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching display profiles',
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
   * Cancel or withdraw an advertisement owned
   * by the currently authenticated member.
   *
   * PUT /api/preferred-profiles/my-advertisements/:id/cancel
   */
  static async cancelMyAdvertisement(
    req,
    res
  ) {
    try {
      const profileId =
        req.user?.profile_id ||
        req.user?.profileId ||
        req.user?.id;

      const advertisementId =
        Number(
          req.params?.id
        );

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message:
            "Authenticated Profile ID is required."
        });
      }

      if (
        !Number.isInteger(
          advertisementId
        ) ||
        advertisementId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Advertisement ID is required."
        });
      }

      const cancelled =
        await PreferredProfileModel
          .cancelMemberAdvertisement({
            advertisementId,
            profileId
          });

      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message:
            "Advertisement was not found."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Advertisement cancelled successfully. It will no longer appear in Matrimonial Spotlight.",
        data:
          cancelled
      });

    } catch (error) {
      console.error(
        "[PreferredProfileController] Unable to cancel member advertisement:",
        error
      );

      if (
        String(
          error?.message || ""
        ).includes(
          "cannot be cancelled"
        )
      ) {
        return res.status(409).json({
          success: false,
          message:
            error.message
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to cancel your advertisement."
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

    static async getAdvertisementReviewQueue(
    req,
    res
  ) {
    try {
      const advertisements =
        await PreferredProfileModel
          .getAdvertisementReviewQueue();

      return res.status(200).json({
        success: true,
        data: advertisements
      });

    } catch (error) {
      console.error(
        "[PreferredProfileController] Unable to load advertisement review queue:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load advertisement review queue"
      });
    }
  }


  static async reviewAdvertisement(
    req,
    res
  ) {
    try {
      const {
        advertisementId
      } = req.params;

      const {
        action,
        moderatorNarrative,
        moderatorRemarks
      } = req.body || {};

      if (!advertisementId) {
        return res.status(400).json({
          success: false,
          message:
            "Advertisement ID is required"
        });
      }

      const normalizedAction =
        String(action || "")
          .trim()
          .toUpperCase();

      if (
        !["APPROVE", "REJECT"].includes(
          normalizedAction
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Action must be APPROVE or REJECT"
        });
      }

      if (
        normalizedAction === "APPROVE" &&
        !String(
          moderatorNarrative || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Advertisement narrative is required before approval"
        });
      }

      const reviewedBy =
        req.user?.email ||
        req.user?.userId ||
        req.user?.profile_id ||
        "SYSTEM";

      const advertisement =
        await PreferredProfileModel
          .reviewAdvertisement({
            advertisementId,
            action:
              normalizedAction,
            moderatorNarrative:
              String(
                moderatorNarrative || ""
              ).trim(),
            moderatorRemarks:
              String(
                moderatorRemarks || ""
              ).trim(),
            reviewedBy
          });

      if (!advertisement) {
        return res.status(404).json({
          success: false,
          message:
            "Advertisement not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          normalizedAction === "APPROVE"
            ? "Advertisement approved and published."
            : "Advertisement rejected.",
        data: advertisement
      });

    } catch (error) {
      console.error(
        "[PreferredProfileController] Advertisement review failed:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Advertisement review failed"
      });
    }
  }
}

module.exports = PreferredProfileController;