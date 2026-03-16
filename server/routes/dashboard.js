const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { getSummary } = require('../services/dashboardService');

router.get('/summary', requireAuth, asyncHandler(async (_req, res) => {
  const summary = await getSummary();
  res.json(summary);
}));

module.exports = router;
