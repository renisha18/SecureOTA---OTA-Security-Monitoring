const BASE_URL = 'http://localhost:4000';

export async function fetchEvents(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${BASE_URL}/api/events?${params}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchAnomalies() {
  const res = await fetch(`${BASE_URL}/api/anomalies`);
  if (!res.ok) throw new Error('Failed to fetch anomalies');
  return res.json();
}

export async function runAnalysis() {
  const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run analysis');
  return res.json();
}
