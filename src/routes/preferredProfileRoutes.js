const express = require('express');
const router = express.Router();
const PreferredProfileController = require('../controllers/preferredProfileController');
const requireAuth = require('../middleware/requireAuth');
const requireApprovedProfile = require('../middleware/requireApprovedProfile');
const isAdmin = require('../middleware/isAdmin');

// Middleware for logging requests (optional)
const logRequest = (req, res, next) => {
  console.log(`[PreferredProfileRoutes] ${req.method} ${req.originalUrl}`, {
    body: req.body,
    params: req.params,
    query: req.query
  });
  next();
};

router.use(logRequest);

/**
 * Create preferred profile (LOCKED until APPROVED)
 */
router.post('/', requireAuth, requireApprovedProfile, PreferredProfileController.createPreferredProfile);

/**
 * Public endpoints (keep public for dashboard/ticker)
 */
router.get('/active', PreferredProfileController.getActivePreferredProfiles);
router.get('/ticker', PreferredProfileController.getPreferredProfilesForTicker);
router.get('/display', PreferredProfileController.getPreferredProfilesForDisplay);
router.get('/check/:profileId', PreferredProfileController.checkIfProfilePreferred);

/**
 * Admin-only endpoints
 */
router.get('/stats', requireAuth, isAdmin, PreferredProfileController.getPreferredProfilesStats);
router.put('/update-expired', requireAuth, isAdmin, PreferredProfileController.updateExpiredProfiles);

/**
 * User-only endpoints (LOCKED until APPROVED)
 */
router.get('/profile/:profileId', requireAuth, requireApprovedProfile, PreferredProfileController.getActivePreferredProfile);
router.get('/email/:email', requireAuth, requireApprovedProfile, PreferredProfileController.getPreferredProfilesByEmail);
router.get('/:id', requireAuth, requireApprovedProfile, PreferredProfileController.getPreferredProfileById);
router.put('/cancel/:profileId', requireAuth, requireApprovedProfile, PreferredProfileController.cancelPreferredProfile);

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
