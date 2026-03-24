import { useEffect, useState } from 'react'
import { getParticipants } from '../../services/api'

const BADGE = { COMPLETED_SAFE: 'badge-none', UNSAFE_ACTION: 'badge-high', BYPASSED: 'badge-medium', ABANDONED: 'badge-low' }

export default function ParticipantList() {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getParticipants()
      .then((r) => { setParticipants(r.data); setLoading(false) })
      .catch(() => { setError('Katılımcı listesi yüklenemedi.'); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: '#64748b' }}>Yükleniyor...</p>
  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>
        Katılımcılar <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '1rem' }}>({participants.length})</span>
      </h1>

      {participants.length === 0 ? (
        <div className="card" style={{ color: '#64748b', textAlign: 'center' }}>
          Henüz katılımcı yok. Katılımcılar çalışmayı tamamladıkça burada görünecektir.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Oturum ID</th>
                <th>Ağ</th>
                <th>Cihaz</th>
                <th>Zaman</th>
                <th>Anormallik</th>
                <th>Senaryo</th>
                <th>Güvensiz Eylem %</th>
                <th>Başlangıç</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => {
                const ctx = p.context_profile || {}
                return (
                  <tr key={p.session_id}>
                    <td>
                      <code style={{ fontSize: '.75rem', color: '#64748b' }}>
                        {p.session_id.slice(0, 8)}…
                      </code>
                    </td>
                    <td>
                      <NetworkBadge network={ctx.network} />
                    </td>
                    <td style={{ fontSize: '.8rem' }}>
                      {ctx.device === 'NEW_DEVICE' ? '💻❓ Yeni' : '💻✓ Bilinen'}
                    </td>
                    <td style={{ fontSize: '.8rem' }}>
                      {ctx.time_slot === 'OFF_HOURS' ? '🌙 Gece' : '☀️ Mesai'}
                    </td>
                    <td style={{ fontSize: '.8rem' }}>
                      {((ctx.behavioral_anomaly_score || 0) * 100).toFixed(0)}%
                    </td>
                    <td style={{ fontSize: '.8rem' }}>
                      {p.scenarios_completed}/{p.scenarios_total}
                    </td>
                    <td>
                      <span className={`badge ${p.session_unsafe_rate > 0.5 ? 'badge-high' : p.session_unsafe_rate > 0 ? 'badge-medium' : 'badge-none'}`}>
                        {(p.session_unsafe_rate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                      {p.started_at ? new Date(p.started_at).toLocaleString('tr-TR') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NetworkBadge({ network }) {
  const map = {
    PUBLIC_WIFI: { label: 'Public Wi-Fi', cls: 'badge-high' },
    HOME:        { label: 'Ev',           cls: 'badge-low' },
    CORPORATE:   { label: 'Kurumsal',     cls: 'badge-none' },
    VPN:         { label: 'VPN',          cls: 'badge-none' },
  }
  const m = map[network] || { label: network, cls: 'badge-none' }
  return <span className={`badge ${m.cls}`} style={{ fontSize: '.7rem' }}>{m.label}</span>
}
