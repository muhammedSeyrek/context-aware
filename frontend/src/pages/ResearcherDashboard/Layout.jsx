import { useState } from 'react'
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom'

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '.25rem' }}>
            🔒 Context-Aware
          </div>
          <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>Araştırmacı Paneli</div>
        </div>

        <h2>Navigasyon</h2>
        <nav>
          <Link to="/dashboard" className={isActive('/dashboard')}>Genel Bakış</Link>
          <Link to="/dashboard/scenarios" className={isActive('/dashboard/scenarios')}>Senaryo Analizi</Link>
          <Link to="/dashboard/participants" className={isActive('/dashboard/participants')}>Katılımcılar</Link>
          <Link to="/dashboard/export" className={isActive('/dashboard/export')}>Veri Dışa Aktarım</Link>
          <Link to="/dashboard/dataset" className={isActive('/dashboard/dataset')}>Dataset Analizi</Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <Link
            to="/"
            style={{ fontSize: '.8rem', color: '#64748b', textDecoration: 'none', display: 'block', padding: '.5rem .75rem' }}
          >
            ← Katılımcı Arayüzüne Dön
          </Link>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

function isActive(path) {
  const loc = window.location.pathname
  return loc === path ? 'active' : ''
}
