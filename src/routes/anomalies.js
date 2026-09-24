const express = require('express');
const pool = require('../db');

const router = express.Router();

/**
 * GET /api/anomalies
 * Optional query params: vehicleId, severity
 * Table will be empty until Phase 3 (POST /api/analyze) has been run at least once.
 */
router.get('/', async (req, res) => {
  const { vehicleId, severity } = req.query;

  const conditions = [];
  const params = [];

  if (vehicleId) {
    conditions.push('vehicle_id = ?');
    params.push(vehicleId);
  }
  if (severity) {
    conditions.push('severity = ?');
    params.push(severity);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT * FROM anomalies ${whereClause} ORDER BY detected_at DESC`,
    params
  );

  res.json({ count: rows.length, anomalies: rows });
});

module.exports = router;
