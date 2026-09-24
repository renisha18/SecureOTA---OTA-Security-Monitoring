/**
 * Detection rules for the OTA Security Event Log Analyzer.
 *
 * Each function runs a GROUP BY / HAVING query against `events`, applies a
 * threshold, and returns an array of anomaly records ready to insert into
 * the `anomalies` table. Deliberately rule-based, not ML — the logic is
 * fully explainable, which matters more than sophistication for a security
 * tool: you always want to know exactly *why* something was flagged.
 */

const pool = require('./db');

// --- Rule 1: repeated downgrade attempts from a single vehicle in one day ---
async function detectRepeatedDowngrades(threshold = 3) {
  const [rows] = await pool.query(
    `SELECT vehicle_id,
            DATE(event_timestamp) AS day,
            COUNT(*) AS attempt_count,
            GROUP_CONCAT(id) AS event_ids
     FROM events
     WHERE event_type = 'DOWNGRADE_ATTEMPT'
     GROUP BY vehicle_id, DATE(event_timestamp)
     HAVING COUNT(*) >= ?`,
    [threshold]
  );

  return rows.map((r) => ({
    vehicleId: r.vehicle_id,
    anomalyType: 'REPEATED_DOWNGRADE_ATTEMPTS',
    relatedEventIds: r.event_ids.split(',').map(Number),
    severity: 'HIGH',
    description: `${r.attempt_count} downgrade attempts from ${r.vehicle_id} on ${r.day}`,
  }));
}

// --- Rule 2: invalid-signature burst across multiple vehicles in the same hour ---
async function detectSignatureBurst(vehicleThreshold = 3) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(event_timestamp, '%Y-%m-%d %H:00') AS hour_bucket,
            COUNT(DISTINCT vehicle_id) AS vehicle_count,
            GROUP_CONCAT(DISTINCT vehicle_id) AS vehicles,
            GROUP_CONCAT(id) AS event_ids
     FROM events
     WHERE event_type = 'INVALID_SIGNATURE'
     GROUP BY hour_bucket
     HAVING COUNT(DISTINCT vehicle_id) >= ?`,
    [vehicleThreshold]
  );

  return rows.map((r) => ({
    vehicleId: 'MULTIPLE',
    anomalyType: 'SIGNATURE_FAILURE_BURST',
    relatedEventIds: r.event_ids.split(',').map(Number),
    severity: 'CRITICAL',
    description: `Invalid signatures across ${r.vehicle_count} vehicles (${r.vehicles}) within ${r.hour_bucket}`,
  }));
}

// --- Rule 3: abnormal check-in frequency — a vehicle checking in far more than normal in one day ---
async function detectAbnormalCheckIns(dailyThreshold = 15) {
  const [rows] = await pool.query(
    `SELECT vehicle_id,
            DATE(event_timestamp) AS day,
            COUNT(*) AS check_count,
            GROUP_CONCAT(id) AS event_ids
     FROM events
     WHERE event_type = 'UPDATE_CHECK'
     GROUP BY vehicle_id, DATE(event_timestamp)
     HAVING COUNT(*) >= ?`,
    [dailyThreshold]
  );

  return rows.map((r) => ({
    vehicleId: r.vehicle_id,
    anomalyType: 'ABNORMAL_CHECKIN_FREQUENCY',
    relatedEventIds: r.event_ids.split(',').map(Number),
    severity: 'MEDIUM',
    description: `${r.vehicle_id} checked in ${r.check_count} times on ${r.day} (normal is ~1-6/day)`,
  }));
}

// --- Rule 4: rollback cluster — multiple vehicles rolling back close together ---
async function detectRollbackClusters(vehicleThreshold = 3) {
  const [rows] = await pool.query(
    `SELECT DATE(event_timestamp) AS day,
            COUNT(DISTINCT vehicle_id) AS vehicle_count,
            GROUP_CONCAT(DISTINCT vehicle_id) AS vehicles,
            GROUP_CONCAT(id) AS event_ids
     FROM events
     WHERE event_type = 'ROLLBACK'
     GROUP BY day
     HAVING COUNT(DISTINCT vehicle_id) >= ?`,
    [vehicleThreshold]
  );

  return rows.map((r) => ({
    vehicleId: 'MULTIPLE',
    anomalyType: 'ROLLBACK_CLUSTER',
    relatedEventIds: r.event_ids.split(',').map(Number),
    severity: 'HIGH',
    description: `Rollbacks across ${r.vehicle_count} vehicles (${r.vehicles}) on ${r.day} — possible bad firmware release`,
  }));
}

// --- Runs all rules, clears old results, writes fresh anomalies, returns a summary ---
async function runAllDetections() {
  const [downgrades, sigBursts, checkIns, rollbacks] = await Promise.all([
    detectRepeatedDowngrades(),
    detectSignatureBurst(),
    detectAbnormalCheckIns(),
    detectRollbackClusters(),
  ]);

  const allAnomalies = [...downgrades, ...sigBursts, ...checkIns, ...rollbacks];

  const conn = await pool.getConnection();
  try {
    await conn.execute('DELETE FROM anomalies');

    for (const a of allAnomalies) {
      await conn.execute(
        `INSERT INTO anomalies (vehicle_id, anomaly_type, related_event_ids, severity, description)
         VALUES (?, ?, ?, ?, ?)`,
        [a.vehicleId, a.anomalyType, JSON.stringify(a.relatedEventIds), a.severity, a.description]
      );
    }
  } finally {
    conn.release();
  }

  return {
    totalAnomalies: allAnomalies.length,
    byType: {
      REPEATED_DOWNGRADE_ATTEMPTS: downgrades.length,
      SIGNATURE_FAILURE_BURST: sigBursts.length,
      ABNORMAL_CHECKIN_FREQUENCY: checkIns.length,
      ROLLBACK_CLUSTER: rollbacks.length,
    },
    anomalies: allAnomalies,
  };
}

module.exports = { runAllDetections };
