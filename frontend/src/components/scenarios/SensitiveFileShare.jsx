import { useState } from 'react'
import { tracker } from '../../services/metricsTracker'
import WarningModal from '../WarningModal'

const FILE = {
  name: 'Q4_2025_Finansal_Rapor_GIZLI.xlsx',
  size: '2.4 MB',
  classification: 'GİZLİ',
}

export default function SensitiveFileShare({ scenario, sessionId, onComplete }) {
  const [recipient, setRecipient] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  const handleShare = (e) => {
    e.preventDefault()
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'FORM_SUBMITTED' })
    if (scenario.warning_level !== 'NONE') {
      setShowWarning(true)
    } else {
      onComplete('UNSAFE_ACTION')
    }
  }

  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
        Aşağıdaki gizli dosyayı paylaşmanız gerekiyor. Alıcı e-posta adresini girin ve gönderin.
      </p>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2rem' }}>📊</div>
          <div>
            <div style={{ fontWeight: 600 }}>{FILE.name}</div>
            <div style={{ fontSize: '.8rem', color: '#64748b' }}>{FILE.size}</div>
            <span style={{
              display: 'inline-block', marginTop: '.25rem',
              padding: '.15rem .5rem', borderRadius: '4px',
              background: '#fee2e2', color: '#b91c1c',
              fontSize: '.75rem', fontWeight: 600,
            }}>{FILE.classification}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleShare}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 500, marginBottom: '.35rem' }}>
            Alıcı E-posta
          </label>
          <input
            type="email"
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ornek@sirket.com"
            style={{
              width: '100%', padding: '.5rem .75rem',
              border: '1.5px solid #e2e8f0', borderRadius: '6px',
              fontSize: '.9rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button type="submit" className="btn btn-primary">Dosyayı Paylaş</button>
          <button type="button" className="btn btn-ghost" onClick={() => onComplete('COMPLETED_SAFE')}>
            İptal Et
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onComplete('ABANDONED')}>
            Atla
          </button>
        </div>
      </form>

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
