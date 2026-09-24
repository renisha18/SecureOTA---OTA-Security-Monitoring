const express = require('express');
const { runAllDetections } = require('../analyzer');

const router = express.Router();

/**
 * POST /api/analyze
 * Runs all detection rules against the current events table, replaces the
 * contents of `anomalies` with fresh results, and returns a summary.
 */
router.post('/', async (req, res) => {
  try {
    const result = await runAllDetections();
    res.json(result);
  } catch (err) {
    console.error('Analysis failed:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

module.exports = router;
