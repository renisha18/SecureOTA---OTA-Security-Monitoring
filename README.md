# OTA Security Event Log Analyzer — Phase 1

Ingests OTA update/security events and (in later phases) flags anomalies.
Phase 1 sets up the schema and generates realistic sample data, including
four deliberately seeded anomalies, so later detection rules have something
real to catch.

## Setup

1. Create the database and load the schema:
   ```
   mysql -u root -p -e "CREATE DATABASE ota_log_analyzer"
   mysql -u root -p ota_log_analyzer < schema.sql
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your MySQL credentials:
   ```
   cp .env.example .env
   ```

4. Seed the database:
   ```
   npm run seed
   ```
   This clears any existing rows and inserts ~8 vehicles' worth of normal
   update cycles over the last 30 days, plus 4 seeded anomalies:
   - Repeated downgrade attempts (RE003)
   - Invalid-signature burst across RE001, RE004, RE006, RE007
   - Abnormal check-in frequency (RE005)
   - Rollback cluster across RE002, RE003, RE008

5. Start the server and confirm data loaded:
   ```
   npm start
   ```
   Then visit `http://localhost:4000/api/events/count` — should show ~150-250
   events depending on the random cycle counts.

## Verify in MySQL directly

```sql
SELECT event_type, COUNT(*) FROM events GROUP BY event_type;
SELECT vehicle_id, COUNT(*) FROM events WHERE event_type = 'DOWNGRADE_ATTEMPT' GROUP BY vehicle_id;
```

## Next (Phase 2/3)

- `/api/events` and `/api/anomalies` query routes
- `/api/analyze` — SQL-based detection rules (GROUP BY + HAVING + time window)
  over the four anomaly types seeded above
