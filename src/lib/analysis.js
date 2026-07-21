/* Analysis maths and secondary-market agent calls.
 * The Groq endpoint, model and auth header pattern are unchanged. */

import {
  MARKET_SYSTEM_PROMPT,
  buildOverUnderPrompt,
  buildBTTSPrompt,
} from './prompts.js'

export function calculateKelly(analysis, fixture) {
  const pick = analysis?.recommendation?.pick
  const modelProb = analysis?.recommendation?.model_probability
  const odds = pick === 'home_win' ? fixture?.odds?.home
    : pick === 'away_win' ? fixture?.odds?.away
    : pick === 'draw' ? fixture?.odds?.draw
    : null
  if (!odds || !modelProb) {
    return { full: null, half: null, fullPercent: null, halfPercent: null,
      label: 'No odds available for Kelly calculation' }
  }
  const b = parseFloat(odds) - 1
  const p = modelProb
  const q = 1 - p
  const kelly = b > 0 ? (b * p - q) / b : 0
  const fullKelly = Math.max(0, kelly)
  const halfKelly = fullKelly / 2
  return {
    full: parseFloat(fullKelly.toFixed(4)),
    half: parseFloat(halfKelly.toFixed(4)),
    fullPercent: parseFloat((fullKelly * 100).toFixed(1)),
    halfPercent: parseFloat((halfKelly * 100).toFixed(1)),
    label: fullKelly <= 0 ? 'No edge detected — do not bet'
      : halfKelly < 0.01 ? 'Marginal edge — minimal stake'
      : 'Positive edge detected',
  }
}

export async function runMultiMarketAnalysis(fixture, mainAnalysis) {
  const markets = [
    { key: 'over_under', label: 'Over/Under 2.5 Goals', prompt: buildOverUnderPrompt(fixture, mainAnalysis) },
    { key: 'btts', label: 'Both Teams to Score', prompt: buildBTTSPrompt(fixture, mainAnalysis) },
  ]
  const results = await Promise.allSettled(markets.map(async (market) => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: MARKET_SYSTEM_PROMPT },
          { role: 'user', content: market.prompt },
        ],
        max_tokens: 500, temperature: 0.7,
      }),
    })
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || ''
    const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    const clean = noThink.replace(/```json|```/g, '').trim()
    const first = clean.indexOf('{'); const last = clean.lastIndexOf('}')
    if (first === -1 || last === -1) throw new Error('no json')
    const parsed = JSON.parse(clean.slice(first, last + 1))
    return { key: market.key, label: market.label, result: parsed }
  }))
  return results.filter(r => r.status === 'fulfilled').map(r => r.value)
}

export function edgeToOutcome(edge) {
  if (edge === 'home') return 'home_win'
  if (edge === 'away') return 'away_win'
  return 'draw'
}

export function updateAgentPerformance(prev, analysis) {
  const actual = analysis.actualResult
  if (!actual) return prev
  const next = { ...(prev || {}),
    form: { ...(prev?.form || { correct: 0, total: 0 }) },
    tactical: { ...(prev?.tactical || { correct: 0, total: 0 }) },
    market: { ...(prev?.market || { correct: 0, total: 0 }) },
  }
  const formPred = edgeToOutcome(analysis.form_analysis?.form_edge)
  const tacPred  = edgeToOutcome(analysis.tactical_analysis?.tactical_edge)
  const mktRaw = analysis.market_analysis?.value_bet
  const mktPred = mktRaw === 'none' ? 'draw' : edgeToOutcome(mktRaw)
  next.form.total++; if (formPred === actual) next.form.correct++
  next.tactical.total++; if (tacPred === actual) next.tactical.correct++
  next.market.total++; if (mktPred === actual) next.market.correct++
  return next
}

export function autoResolve(analysis, fixture) {
  if (!analysis || analysis.resolved) return null
  if (fixture?.status !== 'FINISHED') return null
  const home = fixture.goalsHome
  const away = fixture.goalsAway
  if (home == null || away == null) return null
  const actualResult = home > away ? 'home_win' : away > home ? 'away_win' : 'draw'
  const correct = analysis.recommendation?.pick === actualResult
  return {
    ...analysis,
    resolved: true,
    autoResolved: true,
    actualResult,
    correct,
    finalScore: `${home} – ${away}`,
    resolvedAt: Date.now(),
  }
}

export const AGENT_PERF_EMPTY = {
  form:     { correct: 0, total: 0 },
  tactical: { correct: 0, total: 0 },
  market:   { correct: 0, total: 0 },
}
