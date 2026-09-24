const express = require('express');
const pool = require('../db');

const router = express.Router();

/**
 * GET /api/events
 * Optional query params: vehicleId, eventType, from, to, limit
 * Example: /api/events?vehicleId=RE003&eventType=DOWNGRADE_ATTEMPT
 */
router.get('/', async (req, res) => {
  const { vehicleId, eventType, from, to } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  const conditions = [];
  const params = [];

  if (vehicleId) {
    conditions.push('vehicle_id = ?');
    params.push(vehicleId);
  }
  if (eventType) {
    conditions.push('event_type = ?');
    params.push(eventType);
  }
  if (from) {
    conditions.push('event_timestamp >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('event_timestamp <= ?');
    params.push(to);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT * FROM events ${whereClause} ORDER BY event_timestamp DESC LIMIT ?`,
    [...params, limit]
  );

  res.json({ count: rows.length, events: rows });
});

/**
 * GET /api/events/:id
 */
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(rows[0]);
});

/**
 * POST /api/events
 * Manually log a new event. Body: { vehicleId, eventType, severity, description, timestamp }
 * timestamp is optional — defaults to now.
 */
router.post('/', async (req, res) => {
  const { vehicleId, eventType, severity, description, timestamp } = req.body;

  if (!vehicleId || !eventType) {
    return res.status(400).json({ error: 'vehicleId and eventType are required' });
  }

  const ts = timestamp ? new Date(timestamp) : new Date();
  const mysqlTs = ts.toISOString().slice(0, 19).replace('T', ' ');

  const [result] = await pool.execute(
    `INSERT INTO events (vehicle_id, event_type, severity, description, event_timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [vehicleId, eventType, severity || 'INFO', description || null, mysqlTs]
  );

  res.status(201).json({ id: result.insertId, message: 'Event logged' });
});

module.exports = router;
