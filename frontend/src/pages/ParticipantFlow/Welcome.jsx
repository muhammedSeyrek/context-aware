import { useState } from 'react'
import { createSession } from '../../services/api'

export default function Welcome({ onStart }) {
  const [consent, setConsent] = useState(false)
  const [demographics, setDemographics] = useState({ age_group: '', tech_experience: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleStart = async () => {
    if (!consent) return
    setLoading(true)
    setError(null)
    try {
      const res = await createSession({ demographics })
      onStart(res.data)
    } catch (e) {
      setError('Oturum başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div>
        <div className="card">
          <h1 style={{ fontSize: '1.4rem', marginBottom: '.5rem' }}>
            Bağlama Duyarlı Güvenlik Davranışı Çalışması
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '.9rem' }}>
            Bu çalışmada farklı güvenlik senaryolarıyla karşılaşacaksınız. Sistemi bir iş yerinde kullanıyor gibi
            doğal tepkilerinizi göstermeniz beklenmektedir. Doğru ya da yanlış cevap yoktur.
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem', fontSize: '.875rem', lineHeight: 1.7 }}>
            <strong>Çalışma Hakkında:</strong>
            <ul style={{ marginTop: '.5rem', paddingLeft: '1.25rem' }}>
              <li>Toplam 5 senaryo tamamlanacak (~10–15 dakika)</li>
              <li>Her senaryonun ardından kısa bir anket doldurulacak</li>
              <li>Sonunda NASA-TLX bilişsel yük anketi uygulanacak</li>
              <li>Verileriniz anonim tutulacak, yalnızca araştırma amacıyla kullanılacak</li>
            </ul>
          </div>

          {/* Demographics (optional) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 500, marginBottom: '.35rem' }}>
              Yaş Grubu (isteğe bağlı)
            </label>
            <select
              value={demographics.age_group}
              onChange={(e) => setDemographics(d => ({ ...d, age_group: e.target.value }))}
              style={{ padding: '.45rem .75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '.875rem', width: '200px' }}
            >
              <option value="">Belirtmek istemiyorum</option>
              <option value="18-24">18–24</option>
              <option value="25-34">25–34</option>
              <option value="35-44">35–44</option>
              <option value="45-54">45–54</option>
              <option value="55+">55+</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 500, marginBottom: '.35rem' }}>
              Teknoloji Deneyimi (isteğe bağlı)
            </label>
            <select
              value={demographics.tech_experience}
              onChange={(e) => setDemographics(d => ({ ...d, tech_experience: e.target.value }))}
              style={{ padding: '.45rem .75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '.875rem', width: '200px' }}
            >
              <option value="">Belirtmek istemiyorum</option>
              <option value="beginner">Başlangıç</option>
              <option value="intermediate">Orta</option>
              <option value="advanced">İleri</option>
              <option value="expert">Uzman</option>
            </select>
          </div>

          {/* Consent */}
          <label style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: '.2rem', flexShrink: 0 }}
            />
            <span style={{ fontSize: '.875rem', color: '#475569' }}>
              Katılım koşullarını okudum ve anladım. Verilerimin bu araştırma kapsamında anonim biçimde
              kullanılmasına onay veriyorum.
            </span>
          </label>

          {error && <p style={{ color: '#ef4444', fontSize: '.875rem', marginBottom: '1rem' }}>{error}</p>}

          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={!consent || loading}
            style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '.75rem' }}
          >
            {loading ? 'Başlatılıyor...' : 'Çalışmaya Başla'}
          </button>
        </div>
      </div>
    </div>
  )
}
