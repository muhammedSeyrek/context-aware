import { useState } from 'react'
import { submitPostScenarioSurvey, submitNasaTLX } from '../../services/api'

// ─── Post-Scenario Survey ─────────────────────────────────────────────────────

export function PostScenarioSurvey({ scenarioRunId, sessionId, onComplete }) {
  const [friction, setFriction] = useState(null)
  const [trust, setTrust] = useState(null)
  const [helpful, setHelpful] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (friction === null || trust === null) return
    setLoading(true)
    try {
      await submitPostScenarioSurvey({
        scenario_run_id: scenarioRunId,
        session_id: sessionId,
        perceived_friction: friction,
        trust_score: trust,
        warning_helpful: helpful,
      })
      onComplete()
    } catch (e) {
      setError('Anket gönderilemedi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '.5rem' }}>Senaryo Sonrası Değerlendirme</h2>
        <p style={{ fontSize: '.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Az önce tamamladığınız senaryo hakkında birkaç soru:
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 500, marginBottom: '.5rem', fontSize: '.9rem' }}>
            Bu görevi tamamlamak ne kadar zorlu / sürtüşme yarattı?
          </p>
          <p style={{ fontSize: '.8rem', color: '#94a3b8', marginBottom: '.5rem' }}>1 = Hiç zorlanmadım, 7 = Çok zorlandım</p>
          <LikertRow max={7} value={friction} onChange={setFriction} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 500, marginBottom: '.5rem', fontSize: '.9rem' }}>
            Güvenlik sistemine ne kadar güveniyorsunuz?
          </p>
          <p style={{ fontSize: '.8rem', color: '#94a3b8', marginBottom: '.5rem' }}>1 = Hiç güvenmiyorum, 7 = Tamamen güveniyorum</p>
          <LikertRow max={7} value={trust} onChange={setTrust} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 500, marginBottom: '.5rem', fontSize: '.9rem' }}>
            Uyarı (gösterildiyse) kararınızı vermenize yardımcı oldu mu?
          </p>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            {[['true', 'Evet'], ['false', 'Hayır'], ['null', 'Uyarı gösterilmedi']].map(([val, label]) => (
              <button
                key={val}
                className={`btn ${String(helpful) === val ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setHelpful(val === 'null' ? null : val === 'true')}
              >{label}</button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '.875rem', marginBottom: '1rem' }}>{error}</p>}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={friction === null || trust === null || loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Gönderiliyor...' : 'Sonraki Senaryoya Geç'}
        </button>
      </div>
    </div>
  )
}

function LikertRow({ max, value, onChange }) {
  return (
    <div className="likert-group">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button key={n} className={`likert-btn ${value === n ? 'selected' : ''}`} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  )
}

// ─── NASA-TLX Survey ──────────────────────────────────────────────────────────

const NASA_ITEMS = [
  { key: 'mental_demand',   label: 'Zihinsel Talep',    desc: 'Ne kadar zihinsel çaba harcadınız?' },
  { key: 'physical_demand', label: 'Fiziksel Talep',    desc: 'Ne kadar fiziksel çaba harcadınız?' },
  { key: 'temporal_demand', label: 'Zamana Bağlı Baskı', desc: 'Görevlerde ne kadar acele ettiniz?' },
  { key: 'performance',     label: 'Performans',        desc: 'Görevleri ne kadar başarılı tamamladığınızı düşünüyorsunuz?' },
  { key: 'effort',          label: 'Çaba',              desc: 'Hedeflere ulaşmak için ne kadar çalışmanız gerekti?' },
  { key: 'frustration',     label: 'Engellenme / Hayal Kırıklığı', desc: 'Çalışma sürecinde ne kadar rahatsız oldunuz?' },
]

export function NasaTLXSurvey({ sessionId, onComplete }) {
  const [values, setValues] = useState(
    Object.fromEntries(NASA_ITEMS.map((i) => [i.key, 50]))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await submitNasaTLX({ session_id: sessionId, ...values })
      onComplete()
    } catch (e) {
      setError('Anket gönderilemedi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '2rem auto', padding: '0 1rem' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '.35rem' }}>NASA Görev Yükü Endeksi (NASA-TLX)</h2>
        <p style={{ fontSize: '.875rem', color: '#64748b', marginBottom: '1.75rem' }}>
          Tüm çalışma boyunca deneyimlediğiniz yükü 0–100 arasında değerlendirin.
        </p>

        {NASA_ITEMS.map((item) => (
          <div key={item.key} className="slider-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: '.9rem' }}>{item.label}</strong>
              <span className="slider-val">{values[item.key]}</span>
            </div>
            <label>{item.desc}</label>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: '#94a3b8', minWidth: '30px' }}>Düşük</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={values[item.key]}
                onChange={(e) => setValues((v) => ({ ...v, [item.key]: Number(e.target.value) }))}
              />
              <span style={{ fontSize: '.75rem', color: '#94a3b8', minWidth: '30px', textAlign: 'right' }}>Yüksek</span>
            </div>
          </div>
        ))}

        {error && <p style={{ color: '#ef4444', fontSize: '.875rem', margin: '1rem 0' }}>{error}</p>}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '.75rem' }}
        >
          {loading ? 'Gönderiliyor...' : 'Çalışmayı Tamamla'}
        </button>
      </div>
    </div>
  )
}
