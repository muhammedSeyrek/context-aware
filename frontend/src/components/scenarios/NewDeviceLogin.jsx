import { useState } from 'react'
import { tracker } from '../../services/metricsTracker'
import WarningModal from '../WarningModal'

export default function NewDeviceLogin({ scenario, sessionId, onComplete }) {
  const [step, setStep] = useState('prompt') // prompt | warning | done
  const [showWarning, setShowWarning] = useState(false)

  const handleApprove = () => {
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'SCENARIO_STARTED' })
    if (scenario.warning_level !== 'NONE') {
      setShowWarning(true)
    } else {
      onComplete('UNSAFE_ACTION')
    }
  }

  const handleDeny = () => {
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'ACTION_SAFE' })
    onComplete('COMPLETED_SAFE')
  }

  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
        Hesabınıza bilinmeyen bir cihazdan giriş denemesi algılandı. Aşağıdaki bilgileri inceleyerek onaylayın veya reddedin.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem' }}>💻</div>
          <div>
            <strong>Yeni Cihaz Giriş Bildirimi</strong>
            <table style={{ marginTop: '.75rem', fontSize: '.875rem', width: 'auto' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#64748b', paddingRight: '1rem', paddingBottom: '.35rem' }}>Cihaz</td>
                  <td><strong>Windows 11 — Chrome 128</strong></td>
                </tr>
                <tr>
                  <td style={{ color: '#64748b', paddingRight: '1rem', paddingBottom: '.35rem' }}>Konum</td>
                  <td><strong>İstanbul, Türkiye</strong></td>
                </tr>
                <tr>
                  <td style={{ color: '#64748b', paddingRight: '1rem', paddingBottom: '.35rem' }}>IP Adresi</td>
                  <td><strong>185.220.xxx.xxx</strong></td>
                </tr>
                <tr>
                  <td style={{ color: '#64748b', paddingRight: '1rem' }}>Zaman</td>
                  <td><strong>Bugün, 02:47</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button className="btn btn-success" onClick={handleApprove}>Girişi Onayla</button>
        <button className="btn btn-danger" onClick={handleDeny}>Bu Ben Değilim – Reddet</button>
        <button className="btn btn-ghost" onClick={() => onComplete('ABANDONED')}>Daha Sonra Karar Ver</button>
      </div>

      {showWarning && (
        <WarningModal
          warningLevel={scenario.warning_level}
          scenarioRunId={scenario.id}
          sessionId={sessionId}
          contextFactors={scenario.extra_data?.context_factors}
          onCancel={() => { setShowWarning(false); onComplete('COMPLETED_SAFE') }}
          onProceed={() => { setShowWarning(false); onComplete('BYPASSED') }}
        />
      )}
    </div>
  )
}
