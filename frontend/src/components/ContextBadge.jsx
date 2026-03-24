/**
 * Shows the active context profile to the researcher (or in demo mode).
 * Not shown to participants in production study conditions.
 */
export default function ContextBadge({ contextProfile, riskScore, warningLevel }) {
  if (!contextProfile) return null

  const icons = { PUBLIC_WIFI: '📶', HOME: '🏠', CORPORATE: '🏢', VPN: '🔒' }
  const deviceIcon = contextProfile.device === 'NEW_DEVICE' ? '💻❓' : '💻✓'
  const timeIcon = contextProfile.time_slot === 'OFF_HOURS' ? '🌙' : '☀️'

  return (
    <div style={{ fontSize: '.8rem', color: '#64748b', display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <span title="Network context">{icons[contextProfile.network] || '🌐'} {contextProfile.network}</span>
      <span title="Device context">{deviceIcon} {contextProfile.device}</span>
      <span title="Time context">{timeIcon} {contextProfile.time_slot}</span>
      <span title="Behavioural anomaly">📊 {Math.round(contextProfile.behavioral_anomaly_score * 100)}%</span>
      {riskScore !== undefined && (
        <span className={`badge badge-${(warningLevel || 'none').toLowerCase()}`}>
          Risk: {(riskScore * 100).toFixed(0)}% · {warningLevel}
        </span>
      )}
    </div>
  )
}
