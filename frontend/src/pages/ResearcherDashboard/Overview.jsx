import { useEffect, useState } from 'react'
import { getDashboardMetrics } from '../../services/api'

const pct = (v) => (v * 100).toFixed(1) + '%'
const ms = (v) => (v / 1000).toFixed(2) + 's'

export default function Overview() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    getDashboardMetrics()
      .then((r) => { setMetrics(r.data); setLoading(false) })
      .catch(() => { setError('Metrikler yüklenemedi.'); setLoading(false) })
  }

  useEffect(load, [])

  if (loading) return <p style={{ color: '#64748b' }}>Yükleniyor...</p>
  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>
  if (!metrics) return null

  const { security, human_centered, behavioral } = metrics
  const tlx = human_centered.nasa_tlx || {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.3rem' }}>Genel Bakış</h1>
        <button className="btn btn-ghost" style={{ fontSize: '.8rem' }} onClick={load}>↻ Yenile</button>
      </div>

      {/* Security */}
      <h2 style={sectionTitle}>Güvenlik Metrikleri</h2>
      <div className="metric-grid">
        <MetricCard label="Güvensiz Eylem Oranı" value={pct(security.unsafe_action_rate)} sub="Toplam senaryo çalıştırmalarında" />
        <MetricCard label="Tespit Oranı" value={pct(security.detection_rate)} sub="Yüksek riskli senaryolarda uyarı" />
        <MetricCard label="Yanlış Pozitif Oranı" value={pct(security.false_positive_rate)} sub="Düşük riskli + uyarı gösterilen" />
      </div>

      {/* Human-centered */}
      <h2 style={sectionTitle}>İnsan-Merkezli Metrikler</h2>
      <div className="metric-grid">
        <MetricCard label="Ortalama Sürtüşme" value={(human_centered.avg_perceived_friction || 0).toFixed(2)} sub="1–7 Likert ölçeği" />
        <MetricCard label="Sisteme Güven" value={(human_centered.avg_trust_score || 0).toFixed(2)} sub="1–7 Likert ölçeği" />
        <MetricCard label="Ort. Görev Süresi" value={ms(human_centered.avg_task_completion_time_ms)} sub="Senaryo tamamlama süresi" />
        <MetricCard label="Uyarı Uyum Oranı" value={pct(human_centered.warning_adherence_rate)} sub="Uyarı sonrası güvenli karar" />
        <MetricCard label="Atlatma Oranı" value={pct(human_centered.bypass_rate)} sub="Uyarıya rağmen ilerleme" />
        <MetricCard label="Terk Etme Oranı" value={pct(human_centered.abandonment_rate)} sub="Görevi terk eden katılımcı" />
      </div>

      {/* NASA-TLX */}
      {tlx.tlx_score !== undefined && (
        <>
          <h2 style={sectionTitle}>NASA-TLX Bilişsel Yük</h2>
          <div className="metric-grid">
            <MetricCard label="TLX Toplam Skoru" value={(tlx.tlx_score || 0).toFixed(1)} sub="0–100 arası" />
            <MetricCard label="Zihinsel Talep" value={(tlx.mental_demand || 0).toFixed(1)} />
            <MetricCard label="Zamansal Baskı" value={(tlx.temporal_demand || 0).toFixed(1)} />
            <MetricCard label="Çaba" value={(tlx.effort || 0).toFixed(1)} />
            <MetricCard label="Hayal Kırıklığı" value={(tlx.frustration || 0).toFixed(1)} />
            <MetricCard label="Algılanan Performans" value={(tlx.performance || 0).toFixed(1)} sub="Yüksek = Daha iyi" />
          </div>
        </>
      )}

      {/* Behavioral */}
      <h2 style={sectionTitle}>Davranışsal Metrikler</h2>
      <div className="metric-grid">
        <MetricCard label="Ort. Uyarı Okuma Süresi" value={ms(behavioral.avg_warning_reading_time_ms)} sub="Uyarı gösterildi → karar" />
        <MetricCard label="Ort. Kapatma Süresi" value={ms(behavioral.avg_dismiss_time_ms)} sub="Uyarı görüldü → dismiss" />
        <MetricCard label="Geri Dönüş Oranı" value={pct(behavioral.return_rate)} sub="Dismiss sonrası geri dönen" />
        <MetricCard label="İkinci Denemede Değişim" value={pct(behavioral.behavior_change_rate)} sub="Yeniden deneyenlerde güvenli karar" />
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="metric-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

const sectionTitle = {
  fontSize: '.875rem',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  marginBottom: '.75rem',
  marginTop: '.5rem',
}
