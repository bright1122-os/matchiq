import { useCallback, useState } from 'react'

/* Shared health/status surface for the three external APIs.
 *
 * All fetchers write here and DiagnosticPanel + MorePanel read from it, so it
 * stays a single object rather than per-hook slices — the consumers expect one
 * shape. Injected into useFixtures / useOdds / useAnalysis / useCompetitionData. */

const EMPTY_STATUS = { football: 'unknown', odds: 'unknown', analysis: 'unknown' }

const EMPTY_HEALTH = {
  football: { code: null, msg: null, count: null, at: null },
  odds:     { code: null, msg: null, count: null, at: null, remaining: null },
  analysis: { code: null, msg: null, at: null },
}

export function useApiHealth() {
  const [apiStatus, setApiStatus] = useState(EMPTY_STATUS)
  const [apiHealth, setApiHealth] = useState(EMPTY_HEALTH)

  /* 'operational' | 'degraded' | 'unknown' */
  const setStatus = useCallback((key, value) => {
    setApiStatus(s => ({ ...s, [key]: value }))
  }, [])

  /* Replaces the whole slice for `key`, matching the previous
   * setApiHealth(h => ({ ...h, football: { ... } })) call sites. */
  const setHealth = useCallback((key, slice) => {
    setApiHealth(h => ({ ...h, [key]: slice }))
  }, [])

  return { apiStatus, apiHealth, setStatus, setHealth }
}
