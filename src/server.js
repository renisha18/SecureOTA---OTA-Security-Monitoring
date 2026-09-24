require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const eventsRouter = require('./routes/events');
const anomaliesRouter = require('./routes/anomalies');
const analyzeRouter = require('./routes/analyze');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Quick sanity check that seeding worked.
app.get('/api/events/count', async (req, res) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM events');
  res.json({ total });
});

app.use('/api/events', eventsRouter);
app.use('/api/anomalies', anomaliesRouter);
app.use('/api/analyze', analyzeRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});