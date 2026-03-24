import { useState } from 'react'
import { tracker } from '../../services/metricsTracker'
import WarningModal from '../WarningModal'

export default function PublicWifiAccess({ scenario, sessionId, onComplete }) {
  const [showWarning, setShowWarning] = useState(false)

  const handleConnect = () => {
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'SCENARIO_STARTED' })
    if (scenario.warning_level !== 'NONE') {
      setShowWarning(true)
    } else {
      onComplete('UNSAFE_ACTION')
    }
  }

  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
        Kafe Wi-Fi'sına bağlısınız ve kurumsal sisteme erişmeye çalışıyorsunuz.
      </p>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>📶</span>
          <div>
            <strong>CafeNet_Free</strong>
            <div style={{ fontSize: '.8rem', color: '#64748b' }}>Açık ağ · Şifreleme yok · 47 kullanıcı bağlı</div>
          </div>
          <span style={{ marginLeft: 'auto', background: '#fee2e2', color: '#b91c1c', padding: '.2rem .6rem', borderRadius: '4px', fontSize: '.75rem', fontWeight: 600 }}>
            GÜVENSİZ
          </span>
        </div>

        <div style={{ fontSize: '.875rem', color: '#64748b', lineHeight: 1.8, borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <strong style={{ color: '#1e293b', display: 'block', marginBottom: '.35rem' }}>Erişilmek istenen kaynak:</strong>
          <code style={{ background: '#f1f5f9', padding: '.2rem .5rem', borderRadius: '4px', fontSize: '.8rem' }}>
            https://erp.company-internal.com/finance/dashboard
          </code>
          <div style={{ marginTop: '.5rem' }}>Finansal veri paneli · Kimlik doğrulama gerekli</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button className="btn btn-primary" onClick={handleConnect}>Bu Ağdan Erişimi Sürdür</button>
        <button className="btn btn-success" onClick={() => onComplete('COMPLETED_SAFE')}>VPN'e Bağlan</button>
        <button className="btn btn-ghost" onClick={() => onComplete('ABANDONED')}>Sonra Eriş</button>
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
