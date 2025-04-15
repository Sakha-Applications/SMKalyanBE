const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
console.log('Auth routes file loaded');

router.get('/checkFirstLogin', authController.checkFirstLogin);
router.post('/updatePassword', authController.updatePassword);
router.post('/login', authController.login);
console.log('Routes defined:', router.stack.map(r => r.route?.path).filter(Boolean));

module.exports = router;