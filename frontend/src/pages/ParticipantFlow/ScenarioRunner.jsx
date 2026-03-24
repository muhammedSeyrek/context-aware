import { useState, useEffect } from 'react'
import { listSessionScenarios, completeScenario } from '../../services/api'
import { tracker } from '../../services/metricsTracker'
import ContextBadge from '../../components/ContextBadge'
import PhishingEmail from '../../components/scenarios/PhishingEmail'
import NewDeviceLogin from '../../components/scenarios/NewDeviceLogin'
import SensitiveFileShare from '../../components/scenarios/SensitiveFileShare'
import PublicWifiAccess from '../../components/scenarios/PublicWifiAccess'
import UnusualDownload from '../../components/scenarios/UnusualDownload'
import { PostScenarioSurvey } from './Survey'

const SCENARIO_COMPONENTS = {
  PHISHING: PhishingEmail,
  NEW_DEVICE: NewDeviceLogin,
  FILE_SHARE: SensitiveFileShare,
  WIFI_ACCESS: PublicWifiAccess,
  UNUSUAL_DOWNLOAD: UnusualDownload,
}

const SCENARIO_TITLES = {
  PHISHING: 'Phishing E-postası',
  NEW_DEVICE: 'Yeni Cihaz Girişi',
  FILE_SHARE: 'Hassas Dosya Paylaşımı',
  WIFI_ACCESS: 'Açık Wi-Fi Erişimi',
  UNUSUAL_DOWNLOAD: 'Büyük Veri İndirme',
}

export default function ScenarioRunner({ sessionData, onComplete }) {
  const { session_id, context_profile } = sessionData
  const [scenarios, setScenarios] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('scenario') // scenario | survey
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSessionScenarios(session_id).then((res) => {
      setScenarios(res.data)
      setLoading(false)
      tracker.track({
        scenarioRunId: res.data[0]?.id,
        sessionId: session_id,
        eventType: 'SCENARIO_STARTED',
      })
    })
  }, [session_id])

  if (loading) return <div className="page-center"><p>Yükleniyor...</p></div>
  if (!scenarios.length) return <div className="page-center"><p>Senaryo bulunamadı.</p></div>

  const current = scenarios[currentIndex]
  const total = scenarios.length
  const progress = ((currentIndex) / total) * 100

  const ScenarioComponent = SCENARIO_COMPONENTS[current.scenario_type]

  const handleScenarioComplete = async (outcome) => {
    await completeScenario(current.id, outcome)
    tracker.track({ scenarioRunId: current.id, sessionId: session_id, eventType: 'SCENARIO_COMPLETED' })
    setPhase('survey')
  }

  const handleSurveyComplete = () => {
    if (currentIndex + 1 >= total) {
      onComplete()
    } else {
      setCurrentIndex((i) => i + 1)
      setPhase('scenario')
      tracker.track({
        scenarioRunId: scenarios[currentIndex + 1]?.id,
        sessionId: session_id,
        eventType: 'SCENARIO_STARTED',
      })
    }
  }

  if (phase === 'survey') {
    return (
      <PostScenarioSurvey
        scenarioRunId={current.id}
        sessionId={session_id}
        onComplete={handleSurveyComplete}
      />
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Progress */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '.85rem', color: '#64748b' }}>
        <span>Senaryo {currentIndex + 1} / {total}</span>
        <span className={`badge badge-${(current.warning_level || 'none').toLowerCase()}`}>
          {current.warning_level} Uyarı Seviyesi
        </span>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '.5rem' }}>
          {SCENARIO_TITLES[current.scenario_type]}
        </h2>

        <ContextBadge
          contextProfile={context_profile}
          riskScore={current.risk_score}
          warningLevel={current.warning_level}
        />

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />

        {ScenarioComponent ? (
          <ScenarioComponent
            scenario={current}
            sessionId={session_id}
            onComplete={handleScenarioComplete}
          />
        ) : (
          <p>Bu senaryo henüz uygulanmadı.</p>
        )}
      </div>
    </div>
  )
}
