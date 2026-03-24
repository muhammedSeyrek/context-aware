import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Sessions ─────────────────────────────────────────────────────────────────

export const createSession = (body = {}) => api.post('/sessions/create', body)
export const getSession = (sessionId) => api.get(`/sessions/${sessionId}`)
export const completeSession = (sessionId) => api.post(`/sessions/${sessionId}/complete`)

// ── Scenarios ─────────────────────────────────────────────────────────────────

export const listSessionScenarios = (sessionId) => api.get(`/scenarios/session/${sessionId}`)
export const getNextScenario = (sessionId) => api.get(`/scenarios/session/${sessionId}/next`)
export const completeScenario = (runId, outcome) =>
  api.post(`/scenarios/${runId}/complete`, { outcome })

// ── Events ────────────────────────────────────────────────────────────────────

export const recordEvent = (payload) => api.post('/scenarios/events', payload)

// ── Surveys ───────────────────────────────────────────────────────────────────

export const submitPostScenarioSurvey = (payload) => api.post('/surveys/post-scenario', payload)
export const submitNasaTLX = (payload) => api.post('/surveys/nasa-tlx', payload)

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboardMetrics = () => api.get('/dashboard/metrics')
export const getMetricsByScenario = () => api.get('/dashboard/metrics/by-scenario')
export const getParticipants = () => api.get('/dashboard/participants')

export const exportUrl = (type) => `/api/dashboard/export/${type}`

export default api
