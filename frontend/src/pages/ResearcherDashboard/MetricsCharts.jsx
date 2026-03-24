import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { getMetricsByScenario, getDashboardMetrics } from '../../services/api'

const SCENARIO_LABELS = {
  PHISHING:          'Phishing',
  NEW_DEVICE:        'Yeni Cihaz',
  FILE_SHARE:        'Dosya Paylaşımı',
  WIFI_ACCESS:       'Wi-Fi Erişimi',
  UNUSUAL_DOWNLOAD:  'Anormal İndirme',
}

export default function MetricsCharts() {
  const [byScenario, setByScenario] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMetricsByScenario(), getDashboardMetrics()]).then(([r1, r2]) => {
      setByScenario(r1.data)
      setMetrics(r2.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#64748b' }}>Yükleniyor...</p>

  // Prepare bar chart data
  const scenarioData = byScenario
    ? Object.entries(byScenario).map(([type, d]) => ({
        name: SCENARIO_LABELS[type] || type,
        'Güvensiz Eylem': +(d.unsafe_action_rate * 100).toFixed(1),
        'Atlatma': +(d.bypass_rate * 100).toFixed(1),
        'Terk': +(d.abandonment_rate * 100).toFixed(1),
        'Ortalama Risk': +(d.avg_risk_score * 100).toFixed(1),
      }))
    : []

  // NASA-TLX radar data
  const tlx = metrics?.human_centered?.nasa_tlx || {}
  const radarData = [
    { subject: 'Zihinsel', value: tlx.mental_demand || 0 },
    { subject: 'Zamansal', value: tlx.temporal_demand || 0 },
    { subject: 'Çaba', value: tlx.effort || 0 },
    { subject: 'Hayal Kırıklığı', value: tlx.frustration || 0 },
    { subject: 'Fiziksel', value: tlx.physical_demand || 0 },
    { subject: 'Performans', value: tlx.performance || 0 },
  ]

  // Human-centered comparison bar data
  const hmData = metrics
    ? [
        { name: 'Sürtüşme /7', value: +((metrics.human_centered.avg_perceived_friction / 7) * 100).toFixed(1) },
        { name: 'Güven /7', value: +((metrics.human_centered.avg_trust_score / 7) * 100).toFixed(1) },
        { name: 'Uyum %', value: +(metrics.human_centered.warning_adherence_rate * 100).toFixed(1) },
        { name: 'Atlatma %', value: +(metrics.human_centered.bypass_rate * 100).toFixed(1) },
        { name: 'Terk %', value: +(metrics.human_centered.abandonment_rate * 100).toFixed(1) },
      ]
    : []

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Senaryo Analizi & Grafikler</h1>

      {/* Per-scenario outcome rates */}
      <section style={section}>
        <h2 style={sectionTitle}>Senaryoya Göre Davranış Oranları (%)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={scenarioData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis unit="%" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Bar dataKey="Güvensiz Eylem" fill="#ef4444" radius={[4,4,0,0]} />
            <Bar dataKey="Atlatma" fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="Terk" fill="#94a3b8" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Risk score per scenario */}
      <section style={section}>
        <h2 style={sectionTitle}>Senaryoya Göre Ortalama Risk Skoru (%)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={scenarioData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="Ortalama Risk" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Human-centered metrics bar */}
      <section style={section}>
        <h2 style={sectionTitle}>İnsan-Merkezli Metrikler (normalise %)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hmData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="value" fill="#6366f1" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* NASA-TLX Radar */}
      {radarData.some((d) => d.value > 0) && (
        <section style={section}>
          <h2 style={sectionTitle}>NASA-TLX Alt Boyutlar (Radar)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="TLX" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  )
}

const section = { marginBottom: '2.5rem' }
const sectionTitle = {
  fontSize: '.875rem', fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem',
}
