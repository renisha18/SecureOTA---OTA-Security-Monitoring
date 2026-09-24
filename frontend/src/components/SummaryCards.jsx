export default function SummaryCards({ anomalyCount, byType }) {
  const cards = [
    { label: 'Total Anomalies', value: anomalyCount, severity: 'total' },
    { label: 'Downgrade Attempts', value: byType?.REPEATED_DOWNGRADE_ATTEMPTS || 0, severity: 'high' },
    { label: 'Signature Bursts', value: byType?.SIGNATURE_FAILURE_BURST || 0, severity: 'critical' },
    { label: 'Abnormal Check-ins', value: byType?.ABNORMAL_CHECKIN_FREQUENCY || 0, severity: 'medium' },
    { label: 'Rollback Clusters', value: byType?.ROLLBACK_CLUSTER || 0, severity: 'high' },
  ];

  return (
    <div className="summary-cards">
      {cards.map((c) => (
        <div key={c.label} className={`card card-${c.severity}`}>
          <div className="card-value">{c.value}</div>
          <div className="card-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
