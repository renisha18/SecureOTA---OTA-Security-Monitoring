import { useEffect, useState, useCallback } from 'react';
import { fetchEvents, fetchAnomalies, runAnalysis } from './api';
import SummaryCards from './components/SummaryCards';
import AnomaliesTable from './components/AnomaliesTable';
import EventsTable from './components/EventsTable';

export default function App() {
  const [tab, setTab] = useState('anomalies');
  const [anomalies, setAnomalies] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventFilters, setEventFilters] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  const loadAnomalies = useCallback(async () => {
    try {
      const data = await fetchAnomalies();
      setAnomalies(data.anomalies);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadEvents = useCallback(async (filters) => {
    try {
      const data = await fetchEvents({ ...filters, limit: 100 });
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadAnomalies();
    loadEvents({});
  }, [loadAnomalies, loadEvents]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      await runAnalysis();
      await loadAnomalies();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFilterChange = (filters) => {
    setEventFilters(filters);
    loadEvents(filters);
  };

  const handleSelectEvent = (id) => {
    setTab('events');
    setEventFilters({});
    loadEvents({}).then(() => setHighlightedId(id));
  };

  const byType = anomalies.reduce((acc, a) => {
    acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="app">
      <header>
        <h1>OTA Security Event Log Analyzer</h1>
        <button onClick={handleRunAnalysis} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <SummaryCards anomalyCount={anomalies.length} byType={byType} />

      <nav className="tabs">
        <button className={tab === 'anomalies' ? 'active' : ''} onClick={() => setTab('anomalies')}>
          Anomalies
        </button>
        <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>
          Events
        </button>
      </nav>

      {tab === 'anomalies' && (
        <AnomaliesTable anomalies={anomalies} onSelectEvent={handleSelectEvent} />
      )}
      {tab === 'events' && (
        <EventsTable
          events={events}
          filters={eventFilters}
          onFilterChange={handleFilterChange}
          highlightedId={highlightedId}
        />
      )}
    </div>
  );
}
