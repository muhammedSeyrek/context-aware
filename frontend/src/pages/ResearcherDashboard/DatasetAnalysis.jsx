import { useEffect, useRef, useState } from 'react'
import { getSamples, analyzeSample, uploadDataset } from '../../services/api'

const pct = (v) => (v == null ? '—' : (v * 100).toFixed(1) + '%')
const ms  = (v) => (v == null ? '—' : (v / 1000).toFixed(2) + 's')
const num = (v) => (v == null ? '—' : Number(v).toFixed(2))

// ─── Sonuç gösterimi ──────────────────────────────────────────────────────────

function ResultPanel({ result }) {
  if (!result) return null
  const { metrics, validation_warnings, source, sample_label, sample_reference, filename } = result
  const { security, human_centered, behavioral, by_scenario, meta } = metrics

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Kaynak bilgisi */}
      <div style={{ marginBottom: '1.25rem', padding: '.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '.875rem' }}>
        {source === 'sample' ? (
          <>
            <strong>Örnek Dataset:</strong> {sample_label}
            {sample_reference && <div style={{ color: '#64748b', marginTop: '.2rem' }}>Kaynak: {sample_reference}</div>}
          </>
        ) : (
          <><strong>Yüklenen Dosya:</strong> {filename}</>
        )}
        <div style={{ marginTop: '.35rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {(meta.available_metric_groups || []).map((g) => (
            <span key={g} className="badge badge-none" style={{ fontSize: '.7rem' }}>{g}</span>
          ))}
          <span style={{ color: '#64748b' }}>
            {meta.total_runs} run · {meta.total_events} event · {meta.total_surveys} anket · {meta.total_tlx} TLX
          </span>
        </div>
      </div>

      {/* Doğrulama uyarıları */}
      {validation_warnings?.length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '.875rem' }}>
          <strong>⚠ Doğrulama Uyarıları</strong>
          <ul style={{ marginTop: '.35rem', paddingLeft: '1.25rem' }}>
            {validation_warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <Section title="Güvenlik Metrikleri">
        <Grid>
          <Card label="Güvensiz Eylem Oranı" value={pct(security.unsafe_action_rate)} />
          <Card label="Tespit Oranı"          value={pct(security.detection_rate)} />
          <Card label="Yanlış Pozitif Oranı"  value={pct(security.false_positive_rate)} />
        </Grid>
      </Section>

      <Section title="İnsan-Merkezli Metrikler">
        <Grid>
          <Card label="Ort. Sürtüşme /7"      value={num(human_centered.avg_perceived_friction)} />
          <Card label="Sisteme Güven /7"       value={num(human_centered.avg_trust_score)} />
          <Card label="Ort. Görev Süresi"      value={ms(human_centered.avg_task_completion_time_ms)} />
          <Card label="Uyarı Uyum Oranı"       value={pct(human_centered.warning_adherence_rate)} />
          <Card label="Atlatma Oranı"           value={pct(human_centered.bypass_rate)} />
          <Card label="Terk Etme Oranı"         value={pct(human_centered.abandonment_rate)} />
        </Grid>
      </Section>

      {human_centered.nasa_tlx && (
        <Section title="NASA-TLX">
          <Grid>
            <Card label="TLX Toplam"       value={num(human_centered.nasa_tlx.tlx_score)} sub="0–100" />
            <Card label="Zihinsel Talep"   value={num(human_centered.nasa_tlx.mental_demand)} />
            <Card label="Zamansal Baskı"   value={num(human_centered.nasa_tlx.temporal_demand)} />
            <Card label="Çaba"             value={num(human_centered.nasa_tlx.effort)} />
            <Card label="Hayal Kırıklığı"  value={num(human_centered.nasa_tlx.frustration)} />
            <Card label="Performans"       value={num(human_centered.nasa_tlx.performance)} sub="Yüksek = İyi" />
          </Grid>
        </Section>
      )}

      <Section title="Davranışsal Metrikler">
        <Grid>
          <Card label="Ort. Okuma Süresi"     value={ms(behavioral.avg_warning_reading_time_ms)} />
          <Card label="Ort. Kapatma Süresi"   value={ms(behavioral.avg_dismiss_time_ms)} />
          <Card label="Geri Dönüş Oranı"      value={pct(behavioral.return_rate)} />
          <Card label="Davranış Değişim Oranı" value={pct(behavioral.behavior_change_rate)} />
        </Grid>
      </Section>

      {by_scenario && (
        <Section title="Senaryoya Göre Kırılım">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Senaryo</th><th>Toplam</th><th>Güvensiz %</th>
                  <th>Güvenli %</th><th>Bypass %</th><th>Terk %</th><th>Ort. Risk</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(by_scenario).map(([type, d]) => (
                  d.total > 0 && (
                    <tr key={type}>
                      <td><strong>{type}</strong></td>
                      <td>{d.total}</td>
                      <td>{pct(d.unsafe_action_rate)}</td>
                      <td>{pct(d.safe_rate)}</td>
                      <td>{pct(d.bypass_rate)}</td>
                      <td>{pct(d.abandonment_rate)}</td>
                      <td>{pct(d.avg_risk_score)}</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h3 style={{ fontSize: '.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>{title}</h3>
      {children}
    </div>
  )
}

function Grid({ children }) {
  return <div className="metric-grid">{children}</div>
}

function Card({ label, value, sub }) {
  return (
    <div className="metric-card">
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: '1.4rem' }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────

export default function DatasetAnalysis() {
  const [samples, setSamples]     = useState([])
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState('samples')

  // Upload refs
  const runsRef    = useRef()
  const eventsRef  = useRef()
  const surveysRef = useRef()
  const tlxRef     = useRef()

  useEffect(() => {
    getSamples().then((r) => setSamples(r.data)).catch(() => {})
  }, [])

  const handleSample = async (name) => {
    setLoading(true); setError(null); setResult(null)
    try {
      const r = await analyzeSample(name)
      setResult(r.data)
    } catch (e) {
      setError('Analiz başarısız oldu.')
    } finally { setLoading(false) }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!runsRef.current?.files?.[0]) {
      setError('scenario_runs.csv dosyası zorunludur.')
      return
    }
    const fd = new FormData()
    fd.append('scenario_runs', runsRef.current.files[0])
    if (eventsRef.current?.files?.[0])  fd.append('events',   eventsRef.current.files[0])
    if (surveysRef.current?.files?.[0]) fd.append('surveys',  surveysRef.current.files[0])
    if (tlxRef.current?.files?.[0])     fd.append('nasa_tlx', tlxRef.current.files[0])

    setLoading(true); setError(null); setResult(null)
    try {
      const r = await uploadDataset(fd)
      setResult(r.data)
    } catch (e) {
      setError('Dosya yükleme başarısız oldu.')
    } finally { setLoading(false) }
  }

  const CONTEXT_COLORS = { high_risk: '#fee2e2', low_risk: '#dcfce7', mixed: '#dbeafe' }
  const CONTEXT_BORDER = { high_risk: '#fca5a5', low_risk: '#86efac', mixed: '#93c5fd' }

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', marginBottom: '.4rem' }}>Dataset Analizi</h1>
      <p style={{ color: '#64748b', fontSize: '.875rem', marginBottom: '1.75rem' }}>
        Hazır örnek datasetleri tek tıkla analiz edin veya kendi CSV dosyalarınızı yükleyin.
        Metrikler DB'ye kaydedilmez — yalnızca bellekte hesaplanır.
      </p>

      {/* Tab */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
        {[['samples', '📦 Örnek Datasetler'], ['upload', '⬆ Kendi Datanı Yükle']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setResult(null); setError(null) }}
            style={{
              padding: '.6rem 1.25rem', border: 'none', background: 'transparent',
              fontSize: '.9rem', fontWeight: activeTab === key ? 700 : 400,
              color: activeTab === key ? '#3b82f6' : '#64748b',
              borderBottom: activeTab === key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px', cursor: 'pointer',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Örnek Datasetler */}
      {activeTab === 'samples' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {samples.map((s) => (
            <div key={s.name} className="card" style={{ background: CONTEXT_COLORS[s.name] || '#f8fafc', borderColor: CONTEXT_BORDER[s.name] || '#e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '1rem' }}>{s.label}</strong>
                  <div style={{ fontSize: '.8rem', color: '#475569', margin: '.35rem 0', fontFamily: 'monospace' }}>{s.context}</div>
                  <p style={{ fontSize: '.85rem', color: '#475569', margin: '.35rem 0 .5rem' }}>{s.description}</p>
                  <div style={{ fontSize: '.75rem', color: '#64748b' }}>
                    📚 {s.reference} · {s.n_sessions} oturum · {s.files?.length} CSV dosyası
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSample(s.name)}
                  disabled={loading}
                  style={{ flexShrink: 0 }}
                >
                  {loading ? 'Analiz ediliyor...' : 'Analiz Et'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kendi Datanı Yükle */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUpload}>
          <div className="card">
            <p style={{ fontSize: '.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
              CSV dosyaları platform export formatıyla aynı sütun yapısını kullanmalıdır.
              Yalnızca <strong>scenario_runs.csv</strong> zorunludur; diğerleri ek metrik gruplarını açar.
            </p>

            {[
              { ref: runsRef,    label: 'scenario_runs.csv', required: true,
                hint: 'Zorunlu · outcome, risk_score, warning_level sütunları gerekli' },
              { ref: eventsRef,  label: 'events.csv', required: false,
                hint: 'Opsiyonel · Davranışsal metrikler (okuma/kapatma süreleri)' },
              { ref: surveysRef, label: 'surveys.csv', required: false,
                hint: 'Opsiyonel · perceived_friction, trust_score (Likert 1–7)' },
              { ref: tlxRef,     label: 'nasa_tlx.csv', required: false,
                hint: 'Opsiyonel · 6 NASA-TLX alt boyutu (0–100)' },
            ].map(({ ref, label, required, hint }) => (
              <div key={label} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '.875rem', marginBottom: '.3rem' }}>
                  {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="file" accept=".csv" ref={ref}
                  style={{ display: 'block', fontSize: '.875rem' }}
                />
                <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: '.2rem' }}>{hint}</div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '.5rem' }}>
              {loading ? 'Analiz ediliyor...' : 'Yükle ve Analiz Et'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div style={{ marginTop: '1rem', padding: '.75rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '.875rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b' }}>Hesaplanıyor...</div>
      )}

      <ResultPanel result={result} />
    </div>
  )
}
