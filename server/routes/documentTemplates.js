const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/documentTemplatesController');

const templateValidation = [
  param('personType').isIn(ctrl.PERSON_TYPES),
  body('document_type_ids').isArray().withMessage('document_type_ids required'),
  body('document_type_ids.*').isUUID(),
];

router.get('/', requireAuth, ctrl.list);
router.put('/:personType', requireAuth, requireAdmin, templateValidation, validate, ctrl.replace);

module.exports = router;
