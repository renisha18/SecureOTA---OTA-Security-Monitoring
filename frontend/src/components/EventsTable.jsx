import { useState } from 'react';

const EVENT_TYPES = [
  'UPDATE_CHECK', 'DOWNLOAD', 'SIGNATURE_VERIFICATION', 'HASH_VERIFICATION',
  'INSTALLATION', 'DOWNGRADE_ATTEMPT', 'INVALID_SIGNATURE', 'HASH_MISMATCH',
  'ROLLBACK', 'SUCCESS',
];

export default function EventsTable({ events, filters, onFilterChange, highlightedId }) {
  const [vehicleId, setVehicleId] = useState(filters.vehicleId || '');
  const [eventType, setEventType] = useState(filters.eventType || '');

  const applyFilters = () => {
    onFilterChange({ vehicleId: vehicleId || undefined, eventType: eventType || undefined });
  };

  return (
    <div>
      <div className="filter-bar">
        <input
          placeholder="Filter by vehicle ID (e.g. RE003)"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        />
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
          <option value="">All event types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button onClick={applyFilters}>Apply</button>
        <button
          className="secondary"
          onClick={() => { setVehicleId(''); setEventType(''); onFilterChange({}); }}
        >
          Clear
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehicle</th>
            <th>Event Type</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className={e.id === highlightedId ? 'highlighted-row' : ''}>
              <td>{e.id}</td>
              <td>{e.vehicle_id}</td>
              <td>{e.event_type}</td>
              <td><span className={`badge badge-${e.severity.toLowerCase()}`}>{e.severity}</span></td>
              <td>{e.description}</td>
              <td>{new Date(e.event_timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
