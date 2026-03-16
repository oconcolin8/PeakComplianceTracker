const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/usersController');

router.get('/', requireAuth, requireAdmin, ctrl.list);

router.post('/',
  requireAuth, requireAdmin,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').trim().notEmpty(),
  body('role').isIn(['admin', 'viewer']),
  validate,
  ctrl.create
);

router.put('/:id',
  requireAuth, requireAdmin,
  body('role').optional().isIn(['admin', 'viewer']),
  body('is_active').optional().isBoolean(),
  body('full_name').optional().trim().notEmpty(),
  validate,
  ctrl.update
);

router.delete('/:id', requireAuth, requireAdmin, ctrl.remove);

module.exports = router;
