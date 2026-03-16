const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/authController');

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  ctrl.login
);

router.post('/logout', requireAuth, ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
