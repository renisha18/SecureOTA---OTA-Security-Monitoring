require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Quick sanity check that seeding worked — real /api/events and /api/anomalies
// routes come in Phase 3.
app.get('/api/events/count', async (req, res) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM events');
  res.json({ total });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
