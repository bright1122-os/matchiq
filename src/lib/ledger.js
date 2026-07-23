import { supabase } from './supabase.js'
import { edgeToOutcome } from './analysis.js'

/* The prediction ledger — a permanent Supabase record written alongside (never
 * instead of) analysisCache. Every write is best-effort: failures are logged and
 * swallowed so the analysisCache-based UI keeps working regardless. */

const num = (v) => (v == null || v === '' || Number.isNaN(parseFloat(v)) ? null : parseFloat(v))

/* An agent's directional call in the final pick's shape, or null when it holds
 * no directional opinion (neutral form/tactical, or market 'none'). Null means
 * "abstained" and is excluded from accuracy denominators later. */
function agentOutcome(agentType, analysis) {
  if (agentType === 'form') {
    const e = analysis.form_analysis?.form_edge
    return !e || e === 'neutral' ? null : edgeToOutcome(e)
  }
  if (agentType === 'tactical') {
    const e = analysis.tactical_analysis?.tactical_edge
    return !e || e === 'neutral' ? null : edgeToOutcome(e)
  }
  if (agentType === 'market') {
    const vb = analysis.market_analysis?.value_bet
    return !vb || vb === 'none' ? null : edgeToOutcome(vb)
  }
  return null
}

/* The raw edge string stored in prediction_agents.edge */
function agentEdgeValue(agentType, analysis, finalPick) {
  if (agentType === 'form') return analysis.form_analysis?.form_edge ?? null
  if (agentType === 'tactical') return analysis.tactical_analysis?.tactical_edge ?? null
  if (agentType === 'market') return analysis.market_analysis?.value_bet ?? null
  if (agentType === 'synthesis') return finalPick === 'home_win' ? 'home' : finalPick === 'away_win' ? 'away' : 'draw'
  return null
}

function agentVerdict(agentType, analysis) {
  const f = analysis.form_analysis || {}
  const t = analysis.tactical_analysis || {}
  const m = analysis.market_analysis || {}
  const r = analysis.recommendation || {}
  if (agentType === 'form') return [f.home_verdict, f.away_verdict].filter(Boolean).join(' · ') || null
  if (agentType === 'tactical') return t.matchup_insight || null
  if (agentType === 'market') return m.market_signal || null
  if (agentType === 'synthesis') return r.reasoning || null
  return null
}

function agentKeyFactors(agentType, analysis) {
  if (agentType === 'form') return analysis.form_analysis?.key_factors || []
  if (agentType === 'tactical') return analysis.tactical_analysis?.key_factors || []
  if (agentType === 'synthesis') return analysis.recommendation?.red_flags || []
  return []
}

/* Convert a stored edge string back to an outcome, or null for abstentions. */
function storedEdgeToOutcome(edge) {
  if (edge === 'home') return 'home_win'
  if (edge === 'away') return 'away_win'
  if (edge === 'draw') return 'draw'
  return null // 'neutral' | 'none' | null
}

/* Part 2 — insert one predictions row + four prediction_agents rows. */
export async function writePredictionToLedger(user, fixture, analysis) {
  if (!supabase || !user || !analysis?.recommendation?.pick) return { skipped: true }
  const r = analysis.recommendation
  const m = analysis.market_analysis || {}
  const odds = fixture.odds || {}
  const finalPick = r.pick
  try {
    const { data: pred, error: pErr } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        fixture_id: String(fixture.id),
        home_team: fixture.homeTeam,
        away_team: fixture.awayTeam,
        competition: fixture.competition,
        competition_code: fixture.competitionCode || null,
        kickoff_at: fixture.kickoffDate ? new Date(fixture.kickoffDate).toISOString() : new Date().toISOString(),
        odds_home: num(odds.home), odds_draw: num(odds.draw), odds_away: num(odds.away),
        implied_home_prob: num(m.implied_home_prob),
        implied_draw_prob: num(m.implied_draw_prob),
        implied_away_prob: num(m.implied_away_prob),
        pick: finalPick,
        confidence: num(r.confidence) ?? 0,
        confidence_label: r.confidence_label || null,
        model_probability: num(r.model_probability),
        value_edge: num(r.value_edge),
        bet_units: num(r.bet_units),
        reasoning: r.reasoning || null,
        data_quality: analysis.data_quality || null,
      })
      .select('id')
      .single()
    if (pErr) throw pErr

    const agentRows = ['form', 'tactical', 'market', 'synthesis'].map((type) => {
      const outcome = agentOutcome(type, analysis)
      // agreed_with_final is known now — it just compares two existing values.
      const agreed = type === 'synthesis' ? true : outcome == null ? null : outcome === finalPick
      return {
        prediction_id: pred.id,
        agent_type: type,
        edge: agentEdgeValue(type, analysis, finalPick),
        verdict_text: agentVerdict(type, analysis),
        key_factors: agentKeyFactors(type, analysis),
        agreed_with_final: agreed,
      }
    })
    const { error: aErr } = await supabase.from('prediction_agents').insert(agentRows)
    if (aErr) throw aErr
    return { id: pred.id }
  } catch (e) {
    console.warn('[ledger] write failed:', e?.message || e)
    return { error: e?.message || String(e) }
  }
}

/* Part 3 — write real match outcome back to the ledger. Only touches rows still
 * unresolved, so auto-resolution takes priority and won't clobber prior results. */
export async function autoResolveInLedger(user, fixture, actualResult) {
  if (!supabase || !user || !actualResult) return
  try {
    const { data: rows, error: qErr } = await supabase
      .from('predictions')
      .select('id, pick')
      .eq('user_id', user.id)
      .eq('fixture_id', String(fixture.id))
      .eq('resolved', false)
    if (qErr) throw qErr
    for (const row of rows || []) {
      const { error: uErr } = await supabase
        .from('predictions')
        .update({
          resolved: true,
          actual_result: actualResult,
          final_score_home: fixture.goalsHome ?? null,
          final_score_away: fixture.goalsAway ?? null,
          correct: row.pick === actualResult,
          resolved_at: new Date().toISOString(),
          resolution_method: 'auto',
        })
        .eq('id', row.id)
      if (uErr) throw uErr

      const { data: agents } = await supabase
        .from('prediction_agents')
        .select('id, agent_type, edge')
        .eq('prediction_id', row.id)
      for (const ag of agents || []) {
        const outcome = ag.agent_type === 'synthesis' ? row.pick : storedEdgeToOutcome(ag.edge)
        const correct = outcome == null ? null : outcome === actualResult
        await supabase.from('prediction_agents').update({ correct }).eq('id', ag.id)
      }
    }
  } catch (e) {
    console.warn('[ledger] auto-resolve failed:', e?.message || e)
  }
}

/* Manual resolution has no real score or per-agent truth, so it only records the
 * user's yes/no on unresolved rows — auto-resolution, when available, wins. */
export async function manualResolveInLedger(user, fixtureId, correct) {
  if (!supabase || !user) return
  try {
    await supabase
      .from('predictions')
      .update({ resolved: true, correct, resolved_at: new Date().toISOString(), resolution_method: 'manual' })
      .eq('user_id', user.id)
      .eq('fixture_id', String(fixtureId))
      .eq('resolved', false)
  } catch (e) {
    console.warn('[ledger] manual-resolve failed:', e?.message || e)
  }
}
