export default function AnomaliesTable({ anomalies, onSelectEvent }) {
  if (anomalies.length === 0) {
    return <p className="empty-state">No anomalies detected yet — click "Run Analysis" above.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Severity</th>
          <th>Type</th>
          <th>Vehicle</th>
          <th>Description</th>
          <th>Related Events</th>
          <th>Detected At</th>
        </tr>
      </thead>
      <tbody>
        {anomalies.map((a) => (
          <tr key={a.id} className={`severity-row-${a.severity.toLowerCase()}`}>
            <td><span className={`badge badge-${a.severity.toLowerCase()}`}>{a.severity}</span></td>
            <td>{a.anomaly_type.replaceAll('_', ' ')}</td>
            <td>{a.vehicle_id}</td>
            <td>{a.description}</td>
            <td>
              {(typeof a.related_event_ids === 'string'
                ? JSON.parse(a.related_event_ids)
                : a.related_event_ids
              ).map((id) => (
                <button key={id} className="event-link" onClick={() => onSelectEvent(id)}>
                  #{id}
                </button>
              ))}
            </td>
            <td>{new Date(a.detected_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
