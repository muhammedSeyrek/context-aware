import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Participant flow
import Welcome from './pages/ParticipantFlow/Welcome'
import ScenarioRunner from './pages/ParticipantFlow/ScenarioRunner'
import { NasaTLXSurvey } from './pages/ParticipantFlow/Survey'
import ThankYou from './pages/ParticipantFlow/ThankYou'

// Researcher dashboard
import DashboardLayout from './pages/ResearcherDashboard/Layout'
import Overview from './pages/ResearcherDashboard/Overview'
import MetricsCharts from './pages/ResearcherDashboard/MetricsCharts'
import ParticipantList from './pages/ResearcherDashboard/ParticipantList'
import ExportPanel from './pages/ResearcherDashboard/ExportPanel'
import DatasetAnalysis from './pages/ResearcherDashboard/DatasetAnalysis'

// ─── Participant Flow (stateful, single-page wizard) ─────────────────────────

function ParticipantApp() {
  const [phase, setPhase] = useState('welcome')  // welcome | scenarios | nasa-tlx | done
  const [sessionData, setSessionData] = useState(null)

  if (phase === 'welcome') {
    return (
      <Welcome
        onStart={(data) => { setSessionData(data); setPhase('scenarios') }}
      />
    )
  }

  if (phase === 'scenarios') {
    return (
      <ScenarioRunner
        sessionData={sessionData}
        onComplete={() => setPhase('nasa-tlx')}
      />
    )
  }

  if (phase === 'nasa-tlx') {
    return (
      <NasaTLXSurvey
        sessionId={sessionData.session_id}
        onComplete={() => setPhase('done')}
      />
    )
  }

  return <ThankYou />
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Participant flow */}
      <Route path="/" element={<ParticipantApp />} />

      {/* Researcher dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="scenarios" element={<MetricsCharts />} />
        <Route path="participants" element={<ParticipantList />} />
        <Route path="export" element={<ExportPanel />} />
        <Route path="dataset" element={<DatasetAnalysis />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
