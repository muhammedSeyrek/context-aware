import { useState } from 'react'
import { tracker } from '../../services/metricsTracker'
import WarningModal from '../WarningModal'

const PHISHING_EMAIL = {
  from: 'it-support@company-helpdesk.net',
  fromDisplay: 'IT Destek Birimi <it-support@company-helpdesk.net>',
  subject: 'Acil: Hesabınız 24 Saat İçinde Askıya Alınacak',
  date: 'Bugün, 09:14',
  body: `Merhaba,

Güvenlik sistemimiz hesabınızda şüpheli aktivite tespit etti. Hesabınızı aktif tutmak için aşağıdaki bağlantıya tıklayarak kimliğinizi doğrulamanız gerekmektedir.

Eğer 24 saat içinde doğrulama yapmazsanız hesabınız geçici olarak askıya alınacaktır.`,
  linkText: 'Hesabımı Doğrula →',
  linkHref: '#phishing-link',
}

export default function PhishingEmail({ scenario, sessionId, onComplete }) {
  const [emailOpen, setEmailOpen] = useState(false)
  const [linkHovered, setLinkHovered] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [linkClicked, setLinkClicked] = useState(false)

  const handleEmailOpen = () => {
    setEmailOpen(true)
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'SCENARIO_STARTED' })
  }

  const handleLinkClick = (e) => {
    e.preventDefault()
    setLinkClicked(true)
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'LINK_CLICKED' })

    if (scenario.warning_level !== 'NONE') {
      setShowWarning(true)
    } else {
      // No warning → direct unsafe action
      onComplete('UNSAFE_ACTION')
    }
  }

  const handleWarningCancel = () => {
    setShowWarning(false)
    setLinkClicked(false)
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'ACTION_SAFE' })
    onComplete('COMPLETED_SAFE')
  }

  const handleWarningProceed = () => {
    setShowWarning(false)
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'ACTION_UNSAFE' })
    onComplete('BYPASSED')
  }

  const handleDelete = () => {
    tracker.track({ scenarioRunId: scenario.id, sessionId, eventType: 'ACTION_SAFE' })
    onComplete('COMPLETED_SAFE')
  }

  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
        Kurumsal e-posta gelen kutunuza bir mesaj geldi. Lütfen normal çalışma rutininizi sürdürün.
      </p>

      {/* Inbox preview */}
      {!emailOpen ? (
        <div
          onClick={handleEmailOpen}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            cursor: 'pointer',
            background: '#fff',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#3b82f6', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '.9rem', flexShrink: 0,
          }}>IT</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '.9rem' }}>IT Destek Birimi</strong>
              <span style={{ fontSize: '.8rem', color: '#94a3b8' }}>{PHISHING_EMAIL.date}</span>
            </div>
            <div style={{ fontSize: '.875rem', fontWeight: 600 }}>{PHISHING_EMAIL.subject}</div>
            <div style={{ fontSize: '.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Güvenlik sistemimiz hesabınızda şüpheli aktivite tespit etti...
            </div>
          </div>
        </div>
      ) : (
        /* Email detail view */
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
          {/* Email header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem' }}>{PHISHING_EMAIL.subject}</h3>
            <div style={{ fontSize: '.8rem', color: '#64748b', lineHeight: 1.8 }}>
              <div><strong>Gönderen:</strong> {PHISHING_EMAIL.fromDisplay}</div>
              <div><strong>Tarih:</strong> {PHISHING_EMAIL.date}</div>
            </div>
          </div>

          {/* Email body */}
          <div style={{ padding: '1.25rem', whiteSpace: 'pre-line', fontSize: '.9rem', lineHeight: 1.7 }}>
            {PHISHING_EMAIL.body}

            <div style={{ margin: '1.5rem 0' }}>
              <a
                href={PHISHING_EMAIL.linkHref}
                onClick={handleLinkClick}
                onMouseEnter={() => setLinkHovered(true)}
                onMouseLeave={() => setLinkHovered(false)}
                style={{
                  display: 'inline-block',
                  padding: '.6rem 1.2rem',
                  background: '#3b82f6',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                }}
              >
                {PHISHING_EMAIL.linkText}
              </a>
              {linkHovered && (
                <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: '.25rem' }}>
                  Hedef: http://company-helpdesk.net.malicious-domain.xyz/verify
                </div>
              )}
            </div>

            <div style={{ fontSize: '.8rem', color: '#94a3b8' }}>
              Bu e-postayı almak istemiyorsanız aboneliğinizi iptal edebilirsiniz.
              <br />IT Destek Birimi | it-support@company-helpdesk.net
            </div>
          </div>

          {/* Action bar */}
          <div style={{ padding: '.75rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-ghost" style={{ fontSize: '.8rem' }} onClick={handleDelete}>
              🗑 Sil
            </button>
            <button className="btn btn-ghost" style={{ fontSize: '.8rem' }} onClick={() => onComplete('ABANDONED')}>
              Atla (Karar Veremiyorum)
            </button>
          </div>
        </div>
      )}

      {showWarning && (
        <WarningModal
          warningLevel={scenario.warning_level}
          scenarioRunId={scenario.id}
          sessionId={sessionId}
          contextFactors={scenario.extra_data?.context_factors}
          onCancel={handleWarningCancel}
          onProceed={handleWarningProceed}
        />
      )}
    </div>
  )
}
