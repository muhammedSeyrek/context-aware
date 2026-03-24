import { useState } from 'react'
import { tracker } from '../../services/metricsTracker'
import WarningModal from '../WarningModal'

const DOWNLOAD = {
  name: 'musteri_veritabani_tam_export_2025.zip',
  size: '847 MB',
  records: '124.000 kayıt',
  time: '03:22',
}

export default function UnusualDownload({ scenario, sessionId, onComplete }) {
  const [showWarning, setShowWarning] = useState(false)

  const handleDownload = () => {
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
        Müşteri veritabanının tam dışa aktarımını indirmek istiyorsunuz. Raporu hazırlamak için ihtiyacınız olduğunu düşünüyorsunuz.
      </p>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2rem' }}>🗃️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block' }}>{DOWNLOAD.name}</strong>
            <div style={{ fontSize: '.8rem', color: '#64748b', marginTop: '.25rem', lineHeight: 1.8 }}>
              <div>Boyut: {DOWNLOAD.size}</div>
              <div>İçerik: {DOWNLOAD.records} (ad, e-posta, TCKN, finansal bilgi)</div>
              <div>İstek zamanı: gece {DOWNLOAD.time}</div>
            </div>
            <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '.15rem .5rem', borderRadius: '4px', fontSize: '.75rem', fontWeight: 600 }}>KVKK KAPSAMINDA</span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '.15rem .5rem', borderRadius: '4px', fontSize: '.75rem', fontWeight: 600 }}>MESAI DIŞI</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button className="btn btn-primary" onClick={handleDownload}>İndirmeyi Başlat</button>
        <button className="btn btn-ghost" onClick={() => onComplete('COMPLETED_SAFE')}>Sadece Özet Rapor İndir</button>
        <button className="btn btn-ghost" onClick={() => onComplete('ABANDONED')}>Atla</button>
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
