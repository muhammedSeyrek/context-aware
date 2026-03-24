import { useEffect, useRef, useState } from 'react'
import { tracker } from '../services/metricsTracker'

const MESSAGES = {
  HIGH: {
    title: 'Yüksek Güvenlik Riski Tespit Edildi',
    body: 'Bu işlem mevcut bağlamda ciddi bir güvenlik riski oluşturmaktadır. Devam etmek verilerinizi tehlikeye atabilir.',
    icon: '🚨',
    actionLabel: 'Yine de Devam Et (Riskli)',
    cancelLabel: 'Güvenli Çık',
  },
  MEDIUM: {
    title: 'Güvenlik Uyarısı',
    body: 'Bu işlem olağandışı bir bağlamda gerçekleşmektedir. Dikkatli olmanızı öneririz.',
    icon: '⚠️',
    actionLabel: 'Devam Et',
    cancelLabel: 'İptal Et',
  },
  LOW: {
    title: 'Bilgilendirme',
    body: 'Bu işlem hafif bir bağlamsal risk içermektedir. Devam edebilirsiniz.',
    icon: 'ℹ️',
    actionLabel: 'Anladım, Devam Et',
    cancelLabel: 'Geri Dön',
  },
}

export default function WarningModal({
  warningLevel,
  scenarioRunId,
  sessionId,
  onProceed,    // user chose to continue despite warning → UNSAFE_ACTION or BYPASSED
  onCancel,     // user chose safe path → COMPLETED_SAFE
  contextFactors,
}) {
  const [visible, setVisible] = useState(false)
  const shownAtRef = useRef(null)

  useEffect(() => {
    // Small delay so the modal appears intentionally
    const t = setTimeout(() => {
      setVisible(true)
      shownAtRef.current = Date.now()
      tracker.warningShown({ scenarioRunId, sessionId })
      tracker.startReadTimer(scenarioRunId)
    }, 400)
    return () => clearTimeout(t)
  }, [scenarioRunId, sessionId])

  if (!visible || !MESSAGES[warningLevel]) return null

  const msg = MESSAGES[warningLevel]

  const handleCancel = () => {
    const readTime = tracker.stopReadTimer(scenarioRunId)
    if (readTime) tracker.warningRead({ scenarioRunId, sessionId, duration_ms: readTime })
    tracker.warningDismissed({ scenarioRunId, sessionId })
    tracker.cleanup(scenarioRunId)
    onCancel()
  }

  const handleProceed = () => {
    const readTime = tracker.stopReadTimer(scenarioRunId)
    if (readTime) tracker.warningRead({ scenarioRunId, sessionId, duration_ms: readTime })
    tracker.track({ scenarioRunId, sessionId, eventType: 'ACTION_BYPASSED' })
    tracker.cleanup(scenarioRunId)
    onProceed()
  }

  return (
    <div style={overlay}>
      <div style={modal} role="alertdialog" aria-modal="true">
        <div className={`warning-banner ${warningLevel}`} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{msg.icon}</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '.25rem' }}>{msg.title}</strong>
              <p style={{ fontSize: '.9rem' }}>{msg.body}</p>
            </div>
          </div>
        </div>

        {contextFactors && (
          <div style={{ fontSize: '.8rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.8 }}>
            <strong>Tespit edilen risk faktörleri:</strong>
            <ul style={{ marginTop: '.25rem', paddingLeft: '1.25rem' }}>
              {contextFactors.network_risk > 0 && <li>Güvensiz ağ bağlantısı</li>}
              {contextFactors.device_risk > 0 && <li>Bilinmeyen / yeni cihaz</li>}
              {contextFactors.time_risk > 0 && <li>Mesai saatleri dışı erişim</li>}
              {contextFactors.behavioral_risk > 0.05 && <li>Alışılmadık davranış paterni</li>}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={handleCancel}>{msg.cancelLabel}</button>
          <button className={`btn ${warningLevel === 'HIGH' ? 'btn-danger' : 'btn-outline'}`} onClick={handleProceed}>
            {msg.actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(15,23,42,.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
}

const modal = {
  background: '#fff',
  borderRadius: '10px',
  padding: '1.5rem',
  maxWidth: '480px',
  width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,.25)',
}
