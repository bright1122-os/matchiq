import { useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

/* Read layer over the prediction ledger. Every query is scoped to the signed-in
 * user (RLS enforces this server-side too); all return safe empties on failure. */
export function usePredictionLedger(user) {
  const getRecentPredictions = useCallback(async (limit = 20) => {
    if (!supabase || !user) return []
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false })
      .limit(limit)
    if (error) { console.warn('[ledger] recent failed:', error.message); return [] }
    return data || []
  }, [user])

  const getResolvedPredictions = useCallback(async () => {
    if (!supabase || !user) return []
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('resolved', true)
      .order('resolved_at', { ascending: false })
    if (error) { console.warn('[ledger] resolved failed:', error.message); return [] }
    return data || []
  }, [user])

  /* Per-agent accuracy across resolved predictions — the query that will later
   * power the agent-performance section. Abstentions (correct = null) are excluded. */
  const getAgentAccuracy = useCallback(async () => {
    if (!supabase || !user) return {}
    const { data, error } = await supabase
      .from('prediction_agents')
      .select('agent_type, correct, predictions!inner(user_id, resolved)')
      .eq('predictions.user_id', user.id)
      .eq('predictions.resolved', true)
    if (error) { console.warn('[ledger] agent accuracy failed:', error.message); return {} }
    const acc = {}
    for (const row of data || []) {
      if (row.correct == null) continue
      const k = row.agent_type
      acc[k] = acc[k] || { correct: 0, total: 0 }
      acc[k].total++
      if (row.correct) acc[k].correct++
    }
    for (const k of Object.keys(acc)) {
      acc[k].rate = acc[k].total ? Math.round((acc[k].correct / acc[k].total) * 100) : null
    }
    return acc
  }, [user])

  /* Confidence-bucket calibration over resolved predictions. */
  const getCalibration = useCallback(async () => {
    const resolved = await getResolvedPredictions()
    const buckets = [
      { key: '50–60', min: 0.5, max: 0.6 },
      { key: '60–70', min: 0.6, max: 0.7 },
      { key: '70–80', min: 0.7, max: 0.8 },
      { key: '80+', min: 0.8, max: 1.01 },
    ].map((b) => ({ ...b, n: 0, correct: 0 }))
    for (const p of resolved) {
      const c = p.confidence || 0
      const b = buckets.find((x) => c >= x.min && c < x.max)
      if (b) { b.n++; if (p.correct) b.correct++ }
    }
    return buckets.map((b) => ({
      key: b.key, n: b.n,
      rate: b.n ? Math.round((b.correct / b.n) * 100) : null,
    }))
  }, [getResolvedPredictions])

  return { getRecentPredictions, getResolvedPredictions, getAgentAccuracy, getCalibration }
}
