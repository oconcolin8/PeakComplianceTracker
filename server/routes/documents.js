const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/documentsController');

const docValidation = [
  body('document_type_id').isUUID().withMessage('Valid document_type_id required'),
  body('issue_date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
  body('expiry_date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim(),
];

router.get('/:personId/documents', requireAuth, ctrl.list);
router.post('/:personId/documents', requireAuth, docValidation, validate, ctrl.upsert);
router.put('/:personId/documents/:docId', requireAuth, docValidation, validate, ctrl.update);
router.delete('/:personId/documents/:docId', requireAuth, requireAdmin, ctrl.remove);

module.exports = router;
