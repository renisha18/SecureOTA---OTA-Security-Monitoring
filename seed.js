/**
 * Seed script for the OTA Security Event Log Analyzer.
 *
 * Generates:
 *   1. "Normal" event sequences for a fleet of vehicles over the last 30 days
 *      (check -> download -> verify signature -> verify hash -> install -> success)
 *   2. Four deliberately seeded anomalies, so Phase 3 detection rules have
 *      something real to catch and you have a concrete story for each one
 *      in an interview:
 *        - Repeated downgrade attempts from a single vehicle
 *        - A burst of invalid-signature events across several vehicles
 *          (looks like a coordinated attack, not one bad device)
 *        - Abnormally high check-in frequency from one vehicle
 *        - A cluster of rollbacks shortly after a firmware release
 *          (suggests a bad build, not isolated device faults)
 *
 * Run: npm run seed
 */

const pool = require('./db');

const VEHICLES = ['RE001', 'RE002', 'RE003', 'RE004', 'RE005', 'RE006', 'RE007', 'RE008'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a Date `daysAgo` days before now, with a random time of day.
function randomTimestamp(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return d;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function toMysqlDatetime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function insertEvent(conn, vehicleId, eventType, severity, description, timestamp) {
  const [result] = await conn.execute(
    `INSERT INTO events (vehicle_id, event_type, severity, description, event_timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [vehicleId, eventType, severity, description, toMysqlDatetime(timestamp)]
  );
  return result.insertId;
}

// A normal, successful update cycle for one vehicle on one day.
async function seedNormalUpdateCycle(conn, vehicleId, daysAgo) {
  let t = randomTimestamp(daysAgo);

  await insertEvent(conn, vehicleId, 'UPDATE_CHECK', 'INFO', 'Checked for update', t);
  t = addMinutes(t, randomInt(1, 3));

  await insertEvent(conn, vehicleId, 'DOWNLOAD', 'INFO', 'Downloaded firmware', t);
  t = addMinutes(t, randomInt(1, 2));

  await insertEvent(conn, vehicleId, 'SIGNATURE_VERIFICATION', 'INFO', 'Signature valid', t);
  t = addMinutes(t, 1);

  await insertEvent(conn, vehicleId, 'HASH_VERIFICATION', 'INFO', 'Hash matched', t);
  t = addMinutes(t, 1);

  await insertEvent(conn, vehicleId, 'INSTALLATION', 'INFO', 'Installation started', t);
  t = addMinutes(t, randomInt(1, 3));

  await insertEvent(conn, vehicleId, 'SUCCESS', 'INFO', 'Update completed successfully', t);
}

// Occasional isolated check-ins with nothing new available — normal background noise.
async function seedRoutineCheckIns(conn, vehicleId, count) {
  for (let i = 0; i < count; i++) {
    const t = randomTimestamp(randomInt(1, 29));
    await insertEvent(conn, vehicleId, 'UPDATE_CHECK', 'INFO', 'Checked for update — none available', t);
  }
}

// --- Seeded anomaly 1: repeated downgrade attempts from one vehicle ---
async function seedDowngradeAnomaly(conn) {
  const vehicleId = 'RE003';
  let t = randomTimestamp(2);
  for (let i = 0; i < 5; i++) {
    await insertEvent(
      conn, vehicleId, 'DOWNGRADE_ATTEMPT', 'HIGH',
      'Attempted downgrade to earlier firmware version', t
    );
    t = addMinutes(t, randomInt(5, 15));
  }
  console.log(`Seeded anomaly: repeated downgrade attempts on ${vehicleId}`);
}

// --- Seeded anomaly 2: invalid-signature burst across several vehicles ---
async function seedSignatureBurstAnomaly(conn) {
  const affected = ['RE001', 'RE004', 'RE006', 'RE007'];
  let t = randomTimestamp(1);
  for (const vehicleId of affected) {
    await insertEvent(
      conn, vehicleId, 'INVALID_SIGNATURE', 'CRITICAL',
      'Firmware signature verification failed', t
    );
    t = addMinutes(t, randomInt(2, 8));
  }
  console.log(`Seeded anomaly: invalid-signature burst across ${affected.join(', ')}`);
}

// --- Seeded anomaly 3: abnormal check-in frequency from one vehicle ---
async function seedCheckInFrequencyAnomaly(conn) {
  const vehicleId = 'RE005';
  let t = randomTimestamp(1);
  for (let i = 0; i < 40; i++) {
    await insertEvent(conn, vehicleId, 'UPDATE_CHECK', 'INFO', 'Checked for update', t);
    t = addMinutes(t, randomInt(1, 2));
  }
  console.log(`Seeded anomaly: abnormal check-in frequency on ${vehicleId}`);
}

// --- Seeded anomaly 4: rollback cluster shortly after a release ---
async function seedRollbackClusterAnomaly(conn) {
  const affected = ['RE002', 'RE003', 'RE008'];
  let t = randomTimestamp(3);
  for (const vehicleId of affected) {
    await insertEvent(
      conn, vehicleId, 'INSTALLATION', 'INFO', 'Installation started', t
    );
    t = addMinutes(t, 2);
    await insertEvent(
      conn, vehicleId, 'ROLLBACK', 'HIGH',
      'Health check failed after install — rolled back to previous version', t
    );
    t = addMinutes(t, randomInt(3, 10));
  }
  console.log(`Seeded anomaly: rollback cluster across ${affected.join(', ')}`);
}

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Clearing existing data...');
    await conn.execute('DELETE FROM anomalies');
    await conn.execute('DELETE FROM events');

    console.log('Seeding normal update cycles...');
    for (const vehicleId of VEHICLES) {
      const cycles = randomInt(3, 6);
      for (let i = 0; i < cycles; i++) {
        await seedNormalUpdateCycle(conn, vehicleId, randomInt(1, 29));
      }
      await seedRoutineCheckIns(conn, vehicleId, randomInt(5, 10));
    }

    console.log('Seeding anomalies...');
    await seedDowngradeAnomaly(conn);
    await seedSignatureBurstAnomaly(conn);
    await seedCheckInFrequencyAnomaly(conn);
    await seedRollbackClusterAnomaly(conn);

    const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM events');
    console.log(`Done. ${total} events inserted.`);
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
