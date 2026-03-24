/**
 * Frontend metrics tracker.
 * Measures timing events that cannot be computed server-side:
 *   - Warning reading time (time from shown → dismissed/actioned)
 *   - Dismiss time (time from first click intent → dismiss)
 *   - Warning shown timestamp
 */

import { recordEvent } from './api'

class MetricsTracker {
  constructor() {
    this._timers = {}
  }

  /** Call when a warning is displayed. */
  warningShown({ scenarioRunId, sessionId }) {
    const now = Date.now()
    this._timers[scenarioRunId] = { shownAt: now }
    recordEvent({
      scenario_run_id: scenarioRunId,
      session_id: sessionId,
      event_type: 'WARNING_SHOWN',
    }).catch(() => {})
  }

  /** Call when user dismisses a warning (clicks dismiss/close). */
  warningDismissed({ scenarioRunId, sessionId }) {
    const timer = this._timers[scenarioRunId]
    const now = Date.now()
    const duration_ms = timer ? now - timer.shownAt : null

    recordEvent({
      scenario_run_id: scenarioRunId,
      session_id: sessionId,
      event_type: 'WARNING_DISMISSED',
      duration_ms,
    }).catch(() => {})

    // Track dismiss start for potential return
    if (timer) timer.dismissedAt = now
  }

  /** Call when user reads/focuses on warning content. */
  warningRead({ scenarioRunId, sessionId, duration_ms }) {
    recordEvent({
      scenario_run_id: scenarioRunId,
      session_id: sessionId,
      event_type: 'WARNING_READ',
      duration_ms,
    }).catch(() => {})
  }

  /** Call when user returns to task after dismissing warning. */
  returnToWarning({ scenarioRunId, sessionId }) {
    recordEvent({
      scenario_run_id: scenarioRunId,
      session_id: sessionId,
      event_type: 'RETURN_TO_WARNING',
    }).catch(() => {})
  }

  /** General event recording. */
  track({ scenarioRunId, sessionId, eventType, duration_ms, metadata }) {
    recordEvent({
      scenario_run_id: scenarioRunId,
      session_id: sessionId,
      event_type: eventType,
      duration_ms: duration_ms ?? null,
      metadata: metadata ?? null,
    }).catch(() => {})
  }

  /** Measure time user spent reading warning by watching visibility. */
  startReadTimer(scenarioRunId) {
    if (this._timers[scenarioRunId]) {
      this._timers[scenarioRunId].readStart = Date.now()
    }
  }

  stopReadTimer(scenarioRunId) {
    const timer = this._timers[scenarioRunId]
    if (timer && timer.readStart) {
      return Date.now() - timer.readStart
    }
    return null
  }

  cleanup(scenarioRunId) {
    delete this._timers[scenarioRunId]
  }
}

export const tracker = new MetricsTracker()
