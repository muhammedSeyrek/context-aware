import { exportUrl } from '../../services/api'

const EXPORTS = [
  {
    key: 'scenario-runs',
    title: 'Senaryo Çalıştırmaları',
    desc: 'Her senaryonun risk skoru, uyarı seviyesi, çıktısı ve süresi',
    icon: '📋',
  },
  {
    key: 'events',
    title: 'Ham Olay Kaydı',
    desc: 'Uyarı gösterilme, okuma, dismiss ve tüm kullanıcı etkileşimleri (ms precision)',
    icon: '⏱️',
  },
  {
    key: 'surveys',
    title: 'Senaryo Sonrası Anketler',
    desc: 'Algılanan sürtüşme, sisteme güven, uyarı fayda değerlendirmesi',
    icon: '📝',
  },
  {
    key: 'nasa-tlx',
    title: 'NASA-TLX Verileri',
    desc: '6 alt boyut + hesaplanmış TLX skoru (0–100)',
    icon: '🧠',
  },
]

export default function ExportPanel() {
  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', marginBottom: '.5rem' }}>Veri Dışa Aktarım</h1>
      <p style={{ color: '#64748b', fontSize: '.9rem', marginBottom: '1.75rem' }}>
        Tüm veriler CSV formatında indirilir. SPSS, R veya Python/pandas ile doğrudan analiz edilebilir.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {EXPORTS.map((exp) => (
          <div key={exp.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '2rem' }}>{exp.icon}</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: '.2rem' }}>{exp.title}</strong>
              <p style={{ fontSize: '.8rem', color: '#64748b', margin: 0 }}>{exp.desc}</p>
            </div>
            <a
              href={exportUrl(exp.key)}
              className="btn btn-outline"
              style={{ textDecoration: 'none', flexShrink: 0 }}
              download
            >
              ⬇ CSV İndir
            </a>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '.875rem', color: '#64748b' }}>
        <strong style={{ display: 'block', color: '#1e293b', marginBottom: '.5rem' }}>Python ile hızlı analiz:</strong>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '6px', fontSize: '.8rem', overflowX: 'auto', margin: 0 }}>{`import pandas as pd

runs = pd.read_csv('scenario_runs.csv')
events = pd.read_csv('events.csv')
surveys = pd.read_csv('post_scenario_surveys.csv')
tlx = pd.read_csv('nasa_tlx.csv')

# Unsafe action rate per warning level
print(runs.groupby('warning_level')['outcome']
      .apply(lambda x: (x == 'UNSAFE_ACTION').mean()))

# Average reading time per scenario
reading = events[events.event_type == 'WARNING_READ']
merged = reading.merge(runs[['id','scenario_type']], left_on='scenario_run_id', right_on='id')
print(merged.groupby('scenario_type')['duration_ms'].mean())`}
        </pre>
      </div>
    </div>
  )
}
