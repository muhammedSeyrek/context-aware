export default function ThankYou() {
  return (
    <div className="page-center">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '.75rem' }}>Çalışmayı Tamamladınız!</h1>
        <p style={{ color: '#64748b', fontSize: '.95rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Katılımınız için teşekkür ederiz. Verileriniz anonim olarak kaydedilmiştir ve
          yalnızca bu bilimsel araştırma kapsamında kullanılacaktır.
        </p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '1rem', fontSize: '.875rem', color: '#166534' }}>
          Bu çalışma bağlama duyarlı güvenlik sistemlerinin kullanıcı davranışı üzerindeki
          etkisini ölçmektedir. Sorularınız için araştırmacıyla iletişime geçebilirsiniz.
        </div>
      </div>
    </div>
  )
}
