const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/peopleController');

const personValidation = [
  body('full_name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('person_type').isIn(['client', 'employee', 'contractor']),
  body('is_active').optional().isBoolean(),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim(),
];

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireAdmin, personValidation, validate, ctrl.create);
router.get('/:id', requireAuth, ctrl.get);
router.put('/:id', requireAuth, requireAdmin, personValidation, validate, ctrl.update);
router.delete('/:id', requireAuth, requireAdmin, ctrl.remove);

module.exports = router;
