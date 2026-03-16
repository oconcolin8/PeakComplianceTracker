const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/documentTypesController');

const dtValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim(),
  body('warning_days').optional().isInt({ min: 1, max: 365 }),
  body('is_required').optional().isBoolean(),
];

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireAdmin, dtValidation, validate, ctrl.create);
router.put('/:id', requireAuth, requireAdmin, dtValidation, validate, ctrl.update);
router.delete('/:id', requireAuth, requireAdmin, ctrl.remove);

module.exports = router;
