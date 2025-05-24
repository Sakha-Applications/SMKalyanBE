const express = require('express');
const router = express.Router();
const PreferredProfileController = require('../controllers/preferredProfileController');
const requireAuth = require('../middleware/requireAuth'); // Corrected path and middleware name

// Middleware for logging requests (optional)
const logRequest = (req, res, next) => {
  console.log(`[PreferredProfileRoutes] ${req.method} ${req.originalUrl}`, {
    body: req.body,
    params: req.params,
    query: req.query
  });
  next();
};

// Apply logging middleware to all routes
router.use(logRequest);

/**
 * @route   POST /api/preferred-profiles
 * @desc    Create a new preferred profile record
 * @access  Private (requires authentication)
 */
router.post('/', requireAuth, PreferredProfileController.createPreferredProfile);

/**
 * @route   GET /api/preferred-profiles/active
 * @desc    Get all active preferred profiles (for admin or ticker)
 * @access  Public (or Private based on your requirements)
 * @query   limit - Number of records to fetch (default: 20, max: 100)
 * @query   offset - Offset for pagination (default: 0)
 */
router.get('/active', PreferredProfileController.getActivePreferredProfiles);

/**
 * @route   GET /api/preferred-profiles/ticker
 * @desc    Get preferred profiles for ticker display (random selection)
 * @access  Public
 * @query   limit - Number of records for ticker (default: 10, max: 50)
 */
router.get('/ticker', PreferredProfileController.getPreferredProfilesForTicker);

/**
 * @route   GET /api/preferred-profiles/stats
 * @desc    Get preferred profiles statistics
 * @access  Private (admin only)
 */
router.get('/stats', requireAuth, PreferredProfileController.getPreferredProfilesStats);

/**
 * @route   GET /api/preferred-profiles/check/:profileId
 * @desc    Check if a profile is currently preferred
 * @access  Public
 */
router.get('/check/:profileId', PreferredProfileController.checkIfProfilePreferred);

/**
 * @route   GET /api/preferred-profiles/profile/:profileId
 * @desc    Get active preferred profile for a specific profile ID
 * @access  Private (user should access their own profile)
 */
router.get('/profile/:profileId', requireAuth, PreferredProfileController.getActivePreferredProfile);

/**
 * @route   GET /api/preferred-profiles/email/:email
 * @desc    Get preferred profiles by email
 * @access  Private (user should access their own email)
 */
router.get('/email/:email', requireAuth, PreferredProfileController.getPreferredProfilesByEmail);

/**
 * @route   GET /api/preferred-profiles/:id
 * @desc    Get preferred profile by record ID
 * @access  Private
 */
router.get('/:id', requireAuth, PreferredProfileController.getPreferredProfileById);

/**
 * @route   PUT /api/preferred-profiles/cancel/:profileId
 * @desc    Cancel preferred profile for a specific profile ID
 * @access  Private (user should cancel their own profile)
 */
router.put('/cancel/:profileId', requireAuth, PreferredProfileController.cancelPreferredProfile);

/**
 * @route   PUT /api/preferred-profiles/update-expired
 * @desc    Update expired preferred profiles (admin/cron endpoint)
 * @access  Private (admin only or cron job)
 */
router.put('/update-expired', requireAuth, PreferredProfileController.updateExpiredProfiles);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('[PreferredProfileRoutes] Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in preferred profiles routes',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;