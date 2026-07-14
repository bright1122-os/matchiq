import React, { useEffect, useMemo, useRef, useState } from 'react'

// DESIGN — token surface. Colors/shadows read from CSS vars (theme-swappable);
// motion and typography are constants.
const DESIGN = {
  // Surfaces (layered depth — each level feels closer to the viewer)
  bg0:      'var(--miq-bg0)',      // deepest — space
  surface0: 'var(--miq-surface0)', // page
  surface1: 'var(--miq-surface1)', // primary cards
  surface2: 'var(--miq-surface2)', // elevated cards
  surface3: 'var(--miq-surface3)', // inputs / chips
  surface4: 'var(--miq-surface4)', // hover peaks

  // Borders (subtle, tinted to match the mode)
  border:   'var(--miq-border)',
  borderMd: 'var(--miq-borderMd)',
  borderHi: 'var(--miq-borderHi)',

  // Brand
  accent:       'var(--miq-accent)',
  accentSoft:   'var(--miq-accentSoft)',
  accentBg:     'var(--miq-accentBg)',
  accentBorder: 'var(--miq-accentBorder)',
  accentGlow:   'var(--miq-accentGlow)',

  // Semantic
  positive: 'var(--miq-positive)',
  warning:  'var(--miq-warning)',
  danger:   'var(--miq-danger)',
  info:     'var(--miq-info)',
  live:     'var(--miq-live)',

  // Text tiers (0 = most emphasis, 3 = least)
  text0: 'var(--miq-text0)',
  text1: 'var(--miq-text1)',
  text2: 'var(--miq-text2)',
  text3: 'var(--miq-text3)',

  // Elevation — soft, luminous, mode-tinted
  shadowSm: 'var(--miq-shadowSm)',
  shadowMd: 'var(--miq-shadowMd)',
  shadowLg: 'var(--miq-shadowLg)',

  // Overlays
  scrim: 'var(--miq-scrim)',

  // Typography
  mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  sans: "-apple-system, 'Inter', ui-sans-serif, system-ui, sans-serif",

  // Motion — physical, considered
  durFast:  '120ms',
  durBase:  '200ms',
  durSlow:  '320ms',
  ease:     'cubic-bezier(0.2, 0, 0, 1)',        // decel — objects settling
  easeInOut:'cubic-bezier(0.4, 0, 0.2, 1)',
  easeSpring:'cubic-bezier(0.34, 1.4, 0.64, 1)', // subtle overshoot
}
const D = DESIGN

// OBSIDIAN — matte black instrument. Warm graphite undertones, burnt amber signal.
const DARK_PALETTE = {
  bg0:      '#08080A',
  surface0: '#0E0E11',
  surface1: '#15151A',
  surface2: '#1C1C22',
  surface3: '#25252C',
  surface4: '#33333C',

  border:   'rgba(255,220,180,0.06)',
  borderMd: 'rgba(255,220,180,0.12)',
  borderHi: 'rgba(255,220,180,0.24)',

  accent:       '#FFA537',
  accentSoft:   '#FFC98A',
  accentBg:     'rgba(255,165,55,0.10)',
  accentBorder: 'rgba(255,165,55,0.34)',
  accentGlow:   '0 0 28px rgba(255,165,55,0.28)',

  positive: '#5DD39E',
  warning:  '#FFCE5C',
  danger:   '#F76B6B',
  info:     '#7DB9FF',
  live:     '#F76B6B',

  text0: '#F2EDE4',
  text1: '#B8B0A2',
  text2: '#6E675C',
  text3: '#3E3A34',

  shadowSm: 'inset 0 1px 0 rgba(255,220,180,0.03), 0 1px 2px rgba(0,0,0,0.55)',
  shadowMd: 'inset 0 1px 0 rgba(255,220,180,0.04), 0 8px 24px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.6)',
  shadowLg: 'inset 0 1px 0 rgba(255,220,180,0.05), 0 24px 60px rgba(0,0,0,0.65), 0 4px 10px rgba(0,0,0,0.55)',

  scrim: 'rgba(6,6,8,0.72)',
}

// IVORY — warm paper. Charcoal ink, burnt gold signal.
const LIGHT_PALETTE = {
  bg0:      '#ECE6D6',
  surface0: '#F5F0E1',
  surface1: '#FFFFFF',
  surface2: '#F1EBDB',
  surface3: '#E6DFCB',
  surface4: '#D7CFB6',

  border:   'rgba(40,28,8,0.07)',
  borderMd: 'rgba(40,28,8,0.13)',
  borderHi: 'rgba(40,28,8,0.24)',

  accent:       '#B8720A',
  accentSoft:   '#D89A3A',
  accentBg:     'rgba(184,114,10,0.10)',
  accentBorder: 'rgba(184,114,10,0.34)',
  accentGlow:   '0 0 24px rgba(184,114,10,0.22)',

  positive: '#2F7A17',
  warning:  '#B8720A',
  danger:   '#C13E36',
  info:     '#2E6DC7',
  live:     '#C13E36',

  text0: '#1A150C',
  text1: '#4B4335',
  text2: '#7A705E',
  text3: '#B0A78F',

  shadowSm: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(60,45,15,0.06)',
  shadowMd: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 24px rgba(60,45,15,0.10), 0 2px 4px rgba(60,45,15,0.06)',
  shadowLg: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 60px rgba(60,45,15,0.16), 0 4px 10px rgba(60,45,15,0.08)',

  scrim: 'rgba(30,20,5,0.42)',
}

const paletteCSS = (p) => Object.entries(p).map(([k, v]) => `--miq-${k}:${v};`).join('')
const LS_THEME = 'matchiq_theme'

const TYPE = {
  display: { fontSize: 28, lineHeight: 1.15, fontWeight: 800, fontFamily: D.sans },
  title:   { fontSize: 20, lineHeight: 1.25, fontWeight: 700, fontFamily: D.sans },
  body:    { fontSize: 15, lineHeight: 1.55, fontWeight: 400, fontFamily: D.sans },
  label:   { fontSize: 12, lineHeight: 1.0,  fontWeight: 600, fontFamily: D.sans, letterSpacing: '0.08em', textTransform: 'uppercase' },
  caption: { fontSize: 11, lineHeight: 1.4,  fontWeight: 400, fontFamily: D.sans },
  data:    { fontSize: 13, lineHeight: 1.0,  fontWeight: 500, fontFamily: D.mono },
  dataSm:  { fontSize: 11, lineHeight: 1.0,  fontWeight: 500, fontFamily: D.mono },
}

const RADIUS = { sm: 3, md: 5, lg: 8, xl: 12, full: 999 }

const COMPETITION_CONTEXT = {
  PL:  'Premier League — highest-pace top flight, home advantage compressed by parity in the top half, strong sides drop points away to mid-table more than in other leagues.',
  CL:  'UEFA Champions League — group-stage form deceptive; knockout ties often decided by away-goal aggression and squad depth over 180 minutes.',
  PD:  'La Liga — technical, possession-based, low-mid scoring outside top-two clashes; disciplined home records at fortress grounds are the norm.',
  BL1: 'Bundesliga — high-tempo, high-scoring, aggressive pressing; home advantage strong for the traditional powers.',
  SA:  'Serie A — tactically defensive average, high draw rate, tight fixtures often settled by set-pieces and individual moments.',
  FL1: 'Ligue 1 — PSG dominance historically distorts market pricing; mid-table home teams often undervalued.',
  PPL: 'Primeira Liga — big three (Benfica, Porto, Sporting) dominate; mid-table matches skew toward under-2.5 goals.',
  BSA: 'Campeonato Brasileirão — long season, congested schedule, strong home records driven by travel fatigue for visitors.',
  WC:  'FIFA World Cup — knockout intensity, form volatility, group-stage tactical caution often shifts to open play in later rounds.',
  EC:  'UEFA European Championship — compressed schedule, defensive setups in group stage, quality gap between top and lesser-ranked nations widens under fatigue.',
  ELC: 'EFL Championship — physically demanding, high-tempo, home advantage substantial due to travel and packed midweek fixtures.',
  DED: 'Eredivisie — attacking, high-scoring, big three (Ajax, PSV, Feyenoord) dominate; smaller sides often over-perform expected goals at home.',
}

const ODDS_SPORTS = [
  'soccer_fifa_world_cup',
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_1',
  'soccer_uefa_champs_league',
]

const LS_ANALYSIS = 'matchiq_analysis_cache'
const LS_TRACKED  = 'matchiq_tracked'
const LS_AGENT_PERF = 'matchiq_agent_performance'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

const SYSTEM_PROMPT = `You are an elite football intelligence analyst with 20 years of professional experience in data-driven match analysis, betting market research, and tactical scouting. Your work has been used by professional sports trading desks.

You think rigorously. You never hedge without a reason. You make specific, substantive claims grounded in the data provided. When data is sparse, you reason explicitly from what is available — competition characteristics, home advantage patterns, market signals — rather than retreating to generic statements.

CRITICAL OUTPUT RULES:
1. Return ONLY valid JSON. No markdown. No fences. No explanation before or after. Pure JSON.
2. Every string field must contain substantive analytical content. Never return empty strings.
3. The reasoning field must be a minimum of 4 complete sentences that trace your analytical logic. Not a summary of the pick — the reasoning BEHIND the pick.
4. key_factors arrays must contain specific, concrete observations — not generic statements like "home advantage is important."
5. model_probability must reflect genuine probabilistic reasoning, not just confidence converted to a percentage.
6. value_edge must be calculated as an integer: (model_probability * 100) minus the market implied probability derived from the odds. If no odds: set value_edge to 0.
7. Never write "data unavailable" in a reasoning or factor field. If specific stats are missing, reason from what IS present.

REASONING QUALITY STANDARD:
Bad reasoning: "Arsenal have good form and the market favors them, so Arsenal win."

Good reasoning: "Arsenal's recent sequence shows 3 wins and 1 draw in their last 5, conceding only 1 goal across those fixtures — suggesting a defensive solidity that creates asymmetric value against an opponent whose xGA suggests they struggle to create quality chances. The market has priced Arsenal at 1.95, implying 51.3% probability, but when you adjust for home advantage in this competition — where home sides win 58% of matches — and the form divergence, a true probability closer to 62% is defensible. The value edge is meaningful."

TACTICAL ANALYSIS DEPTH:
Always consider: pressing intensity vs defensive block effectiveness, set piece threat, transition patterns, and how team styles interact specifically — not generically.

MARKET ANALYSIS DEPTH:
If odds are available: calculate implied probabilities, normalize the overround, identify which outcome the market is underweighting, and explain the line movement signal if provided.
If no odds: analyze from pure form and tactical signals and set data_quality to "low".

JSON SCHEMA (every field required):
{
  "form_analysis": {
    "home_verdict": "2-3 sentences of specific form analysis for the home team",
    "away_verdict": "2-3 sentences of specific form analysis for the away team",
    "form_edge": "home | away | neutral",
    "key_factors": [
      "specific concrete factor 1",
      "specific concrete factor 2",
      "specific concrete factor 3"
    ]
  },
  "tactical_analysis": {
    "matchup_insight": "2-3 sentences analyzing the specific tactical dynamic between these two teams — styles, shape, pressing, set pieces",
    "tactical_edge": "home | away | neutral",
    "key_factors": [
      "specific tactical factor 1",
      "specific tactical factor 2"
    ]
  },
  "market_analysis": {
    "implied_home_prob": 0.00,
    "implied_draw_prob": 0.00,
    "implied_away_prob": 0.00,
    "market_signal": "1-2 sentences about what the odds and line movement indicate about where informed money is positioned",
    "value_bet": "home | draw | away | none"
  },
  "recommendation": {
    "pick": "home_win | draw | away_win",
    "confidence": 0.00,
    "confidence_label": "low | medium | medium-high | high",
    "model_probability": 0.00,
    "value_edge": 0,
    "reasoning": "Minimum 4 sentences. Must explain the analytical process: why the form edge exists, whether the tactical matchup confirms or contradicts it, what the market is pricing in versus what you believe the true probability is, and why this pick represents value or the best available outcome given the data.",
    "red_flags": [
      "specific risk factor 1",
      "specific risk factor 2"
    ],
    "bet_units": 0.5,
    "data_quality": "high | medium | low"
  }
}`

function buildPrompt(fixture) {
  const homeForm = fixture.homeForm || []
  const awayForm = fixture.awayForm || []

  const formStr = (form) => {
    if (!form || form.length === 0) return 'Not available'
    const w = form.filter(r => r === 'W').length
    const d = form.filter(r => r === 'D').length
    const l = form.filter(r => r === 'L').length
    return `${form.join('-')} (${w}W ${d}D ${l}L in last ${form.length})`
  }

  const oddsStr = fixture.odds?.home ? (() => {
    const homeOdds = parseFloat(fixture.odds.home)
    const drawOdds = parseFloat(fixture.odds.draw)
    const awayOdds = parseFloat(fixture.odds.away)
    const homeImplied = (1 / homeOdds * 100).toFixed(1)
    const drawImplied = (1 / drawOdds * 100).toFixed(1)
    const awayImplied = (1 / awayOdds * 100).toFixed(1)
    const overround = (1 / homeOdds + 1 / drawOdds + 1 / awayOdds).toFixed(3)
    return `Home Win: ${homeOdds} (${homeImplied}% implied) | Draw: ${drawOdds} (${drawImplied}% implied) | Away Win: ${awayOdds} (${awayImplied}% implied) | Market overround: ${overround}`
  })() : 'Odds not available — use form and tactical analysis only'

  const h2hStr = fixture.h2h?.matches?.length > 0 ? (() => {
    const matches = fixture.h2h.matches.slice(0, 5)
    const homeWins = matches.filter(m => m.winner === 'HOME_TEAM').length
    const awayWins = matches.filter(m => m.winner === 'AWAY_TEAM').length
    const draws = matches.filter(m => m.winner === 'DRAW').length
    const results = matches.map(m => {
      const dt = m.utcDate ? new Date(m.utcDate).toISOString().split('T')[0] : (m.date || 'unknown')
      const ht = m.homeTeam?.name || m.homeTeam || 'Home'
      const at = m.awayTeam?.name || m.awayTeam || 'Away'
      const hs = m.score?.fullTime?.home ?? m.homeScore ?? '?'
      const as = m.score?.fullTime?.away ?? m.awayScore ?? '?'
      const comp = m.competition?.name || m.competition || ''
      return `${ht} ${hs}-${as} ${at} (${dt}${comp ? ' · ' + comp : ''})`
    }).join('\n')
    return `Last ${matches.length} meetings: ${fixture.homeTeam} wins ${homeWins}, draws ${draws}, ${fixture.awayTeam} wins ${awayWins}\n${results}`
  })() : 'Head-to-head history not available'

  const marketContext = fixture.marketMovement && !/Fetching|Live odds/i.test(fixture.marketMovement)
    ? fixture.marketMovement
    : 'No market movement data available'

  const competitionContext = (() => {
    const comp = fixture.competition || 'Unknown'
    const contexts = {
      'Premier League': 'High intensity, physical, avg 2.8 goals/game, strong home record (45% home win rate)',
      'La Liga': 'Technical, possession-based, avg 2.7 goals/game, historically high draw rate',
      'Bundesliga': 'High scoring, avg 3.1 goals/game, away teams score more than most leagues',
      'Serie A': 'Tactically conservative, avg 2.5 goals/game, very low scoring in top fixtures',
      'Ligue 1': 'PSG-dominated, avg 2.6 goals/game, home advantage significant',
      'UEFA Champions League': 'Elite level, conservative early stages, avg 2.7 goals/game',
      'FIFA World Cup': 'International, avg 2.5 goals/game, knockout format pressure significant',
      'Danish Superliga': 'Competitive mid-table, avg 2.9 goals/game, strong home record',
      'Scottish Premiership': 'Physical, avg 2.6 goals/game, Celtic dominant but upsets common',
      'Primeira Liga': 'Big three dominate, avg 2.5 goals/game, mid-table slightly under-goals',
      'Eredivisie': 'Attacking football, avg 3.0 goals/game, strong home performances',
      'Campeonato Brasileiro Série A': 'Long season, avg 2.4 goals/game, travel fatigue amplifies home edge',
    }
    return contexts[comp] || COMPETITION_CONTEXT[fixture.competitionCode] || `${comp} — analyze based on available data`
  })()

  return `MATCH ANALYSIS REQUEST

FIXTURE: ${fixture.homeTeam} vs ${fixture.awayTeam}
COMPETITION: ${fixture.competition} (${fixture.region || 'Unknown region'})
CONTEXT: ${competitionContext}
KICKOFF: ${fixture.kickoff} | VENUE: ${fixture.venue || 'Unknown'}
STATUS: ${fixture.status}

═══ FORM DATA ═══
${fixture.homeTeam} recent form (newest first):
  ${formStr(homeForm)}

${fixture.awayTeam} recent form (newest first):
  ${formStr(awayForm)}

═══ HEAD TO HEAD ═══
${h2hStr}

═══ MARKET DATA ═══
${oddsStr}
Market context: ${marketContext}

═══ ANALYTICAL INSTRUCTIONS ═══
1. Analyze form sequences for momentum and defensive/offensive trends, not just win/loss counts.
2. Use H2H to identify structural patterns between these specific teams — not just overall records.
3. If odds available: calculate normalized implied probabilities and identify market inefficiencies.
4. Consider venue and competition context in your probability estimate.
5. The reasoning must explain your actual analytical process, not just state the conclusion.
6. Set data_quality based on: high (form + H2H + odds), medium (form + odds OR form + H2H), low (form only OR no form).

Respond with the JSON schema only.`
}

function calculateKelly(analysis, fixture) {
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

const MARKET_SYSTEM_PROMPT = `You are a football betting market analyst specializing in goals markets.
Respond ONLY with valid JSON. No markdown, no code fences, no prose.

Schema:
{
  "recommendation": "over" | "under" | "yes" | "no",
  "model_probability": 0.00,
  "reasoning": "2-3 sentences explaining the prediction",
  "key_factors": ["factor 1", "factor 2"],
  "confidence": 0.00,
  "confidence_label": "low | medium | medium-high | high"
}`

function buildOverUnderPrompt(f, main) {
  const formStr = (arr) => Array.isArray(arr) && arr.length ? arr.join(' ') : 'no recent log'
  const seasonGoals = (s) => s && s.played > 0
    ? `${(s.gf / s.played).toFixed(2)} scored, ${(s.ga / s.played).toFixed(2)} conceded per match`
    : 'season stats unavailable'
  return `MARKET: OVER/UNDER 2.5 GOALS

FIXTURE
${f.homeTeam} vs ${f.awayTeam} — ${f.competition}

FORM
${f.homeTeam}: ${formStr(f.homeForm)}
${f.awayTeam}: ${formStr(f.awayForm)}

GOALS PROFILE
${f.homeTeam}: ${seasonGoals(f.homeSeason)}
${f.awayTeam}: ${seasonGoals(f.awaySeason)}

MAIN ANALYSIS CONTEXT
Pick: ${main?.recommendation?.pick || 'unknown'} at ${Math.round((main?.recommendation?.confidence || 0) * 100)}% confidence

Predict whether total goals will be OVER or UNDER 2.5. Respond with the JSON schema exactly.`
}

function buildBTTSPrompt(f, main) {
  const formStr = (arr) => Array.isArray(arr) && arr.length ? arr.join(' ') : 'no recent log'
  const cleanSheets = (s) => s && s.played > 0
    ? `${(s.ga / s.played).toFixed(2)} conceded per match`
    : 'defensive stats unavailable'
  return `MARKET: BOTH TEAMS TO SCORE

FIXTURE
${f.homeTeam} vs ${f.awayTeam} — ${f.competition}

FORM
${f.homeTeam}: ${formStr(f.homeForm)}
${f.awayTeam}: ${formStr(f.awayForm)}

DEFENSIVE PROFILE
${f.homeTeam}: ${cleanSheets(f.homeSeason)}
${f.awayTeam}: ${cleanSheets(f.awaySeason)}

MAIN ANALYSIS CONTEXT
Pick: ${main?.recommendation?.pick || 'unknown'} at ${Math.round((main?.recommendation?.confidence || 0) * 100)}% confidence

Predict whether BOTH teams will score (YES) or not (NO). Respond with the JSON schema exactly.`
}

async function runMultiMarketAnalysis(fixture, mainAnalysis) {
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

function edgeToOutcome(edge) {
  if (edge === 'home') return 'home_win'
  if (edge === 'away') return 'away_win'
  return 'draw'
}

function updateAgentPerformance(prev, analysis) {
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

function autoResolve(analysis, fixture) {
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

/* ============================================================
 * Icons — all inline SVG, currentColor
 * ============================================================ */

function Icon({ size = 16, color = 'currentColor', label, children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16"
      fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={label ? undefined : true} aria-label={label} focusable="false">
      {children}
    </svg>
  )
}
const ChevronRight = (p) => <Icon {...p}><path d="M6 3l5 5-5 5" /></Icon>
const ChevronLeft  = (p) => <Icon {...p}><path d="M10 3l-5 5 5 5" /></Icon>
const Search = (p) => <Icon {...p}><circle cx="7" cy="7" r="4.5" /><path d="M11 11l3 3" /></Icon>
const Bell   = (p) => <Icon {...p}><path d="M3.5 12h9M5 12V8a3 3 0 016 0v4M7 14a1 1 0 002 0" /></Icon>
const Menu   = (p) => <Icon {...p}><path d="M2 4h12M2 8h12M2 12h12" /></Icon>
const Bookmark = ({ size = 16, color = 'currentColor', active = false, label }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16"
    fill={active ? color : 'none'} stroke={color} strokeWidth="1.5" strokeLinejoin="round"
    aria-hidden={label ? undefined : true} aria-label={label} focusable="false">
    <path d="M4 2h8v12l-4-3-4 3V2z" />
  </svg>
)
const X = (p) => <Icon {...p}><path d="M3 3l10 10M13 3L3 13" /></Icon>
const Sun = (p) => <Icon {...p}><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" /></Icon>
const Moon = (p) => <Icon {...p}><path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z" /></Icon>
const ExternalLink = (p) => <Icon {...p}><path d="M6 3H3v10h10v-3M9 3h4v4M8 8l5-5" /></Icon>
const Check = (p) => <Icon {...p}><path d="M3 8l3 3 7-7" /></Icon>
const AnalyzeIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false">
    <circle cx="10" cy="10" r="7"/>
    <path d="M10 7v3l2 2"/>
    <path d="M13 4.5l1.5-1.5M16 10h1.5M13 15.5l1.5 1.5M10 16.5V18M7 15.5l-1.5 1.5M4 10H2.5M7 4.5L5.5 3"/>
  </svg>
)
const XCircle = (p) => <Icon {...p}><circle cx="8" cy="8" r="6" /><path d="M6 6l4 4M10 6l-4 4" /></Icon>

const GitHub = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
)
const LinkedIn = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 01.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
  </svg>
)
const XSocial = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/>
  </svg>
)
const Mail = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="3" width="14" height="10" rx="2" />
    <path d="M1 5l7 5 7-5" />
  </svg>
)

const CONTACT_EMAIL = 'agwunobisomtochukwu@gmail.com'
const SOCIAL_LINKS = {
  github:   'https://github.com/bright1122-os',
  linkedin: 'https://www.linkedin.com/in/agwunobi-somtochukwu-a61870342',
  x:        'https://x.com/gramzfgs',
  email:    `mailto:${CONTACT_EMAIL}`,
}
const mailto = (subject) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`

/* ============================================================
 * Global styles — focus, skeleton, sidebar slide
 * ============================================================ */

function GlobalStyles() {
  return (
    <style>{`
      [data-theme="dark"]  { ${paletteCSS(DARK_PALETTE)} color-scheme: dark; }
      [data-theme="light"] { ${paletteCSS(LIGHT_PALETTE)} color-scheme: light; }

      /* Global transitions — considered, tuned per property */
      [data-theme] * {
        transition:
          background-color ${D.durBase} ${D.ease},
          color ${D.durBase} ${D.ease},
          border-color ${D.durBase} ${D.ease},
          box-shadow ${D.durBase} ${D.ease};
      }

      /* Focus — luminous, not surgical */
      *:focus { outline: none; }
      button:focus-visible, a:focus-visible, input:focus-visible, [tabindex]:focus-visible {
        outline: 2px solid ${D.accent};
        outline-offset: 2px;
        border-radius: 6px;
        box-shadow: ${D.accentGlow};
      }

      /* Skeleton — subtle breath, no flicker */
      @keyframes miq-skeleton {
        0%   { opacity: 0.35; }
        50%  { opacity: 0.65; }
        100% { opacity: 0.35; }
      }
      .miq-skeleton {
        animation: miq-skeleton 1.6s ${D.easeInOut} infinite;
        background: ${D.surface3};
        border-radius: ${RADIUS.sm}px;
      }

      /* Confidence bar — settles into place */
      @keyframes miq-conf-fill { from { width: 0%; } }
      .miq-conf { animation: miq-conf-fill 640ms ${D.ease}; }

      /* Sidebar / sheet transforms */
      .miq-sidebar-enter { transform: translateX(-100%); }
      .miq-sidebar-open  { transform: translateX(0); }
      .miq-sidebar-panel { transition: transform ${D.durSlow} ${D.ease}; }
      .miq-overlay-fade  { transition: opacity ${D.durBase} ${D.ease}; }

      /* Pick card — tactile lift + luminous edge on hover */
      .miq-pickcard {
        transition:
          transform ${D.durBase} ${D.ease},
          box-shadow ${D.durBase} ${D.ease},
          border-color ${D.durBase} ${D.ease};
        will-change: transform;
      }
      .miq-pickcard:hover {
        transform: translateY(-1px);
        border-color: ${D.borderMd};
        box-shadow: ${D.shadowMd}, ${D.accentGlow};
      }
      .miq-pickcard:active { transform: translateY(0); transition-duration: ${D.durFast}; }

      /* Row hover — a wash, not a jolt */
      .miq-row-hover {
        transition: background-color ${D.durFast} ${D.ease};
        position: relative;
      }
      .miq-row-hover:hover { background: ${D.surface2}; }

      /* Segmented control */
      .miq-seg { transition: background-color ${D.durBase} ${D.ease}, color ${D.durBase} ${D.ease}; }

      /* Card elevation — atmospheric depth */
      .miq-card {
        transition:
          transform ${D.durBase} ${D.ease},
          border-color ${D.durBase} ${D.ease},
          box-shadow ${D.durBase} ${D.ease};
      }
      .miq-card:hover { border-color: ${D.borderMd}; box-shadow: ${D.shadowMd}; }

      /* Rise-in — used for hero blocks and analysis */
      @keyframes miq-rise {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .miq-rise { animation: miq-rise 380ms ${D.ease} both; }

      /* Fade-in for less physical elements */
      @keyframes miq-fade { from { opacity: 0; } to { opacity: 1; } }

      /* Intelligence feed — Bloomberg-terminal ticker */
      @keyframes miq-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes miq-glow {
        0%, 100% { box-shadow: 0 0 0 0 ${D.accent}; opacity: 1; }
        50%      { box-shadow: 0 0 10px 2px ${D.accent}; opacity: 0.75; }
      }
      .miq-ticker-track { animation: miq-ticker linear infinite; will-change: transform; }
      .miq-ticker-track:hover { animation-play-state: paused; }
      .miq-ticker-pulse { animation: miq-glow 2s ease-in-out infinite; }
      .miq-fade { animation: miq-fade ${D.durSlow} ${D.ease} both; }

      /* Selection uses accent */
      ::selection { background: ${D.accentBg}; color: ${D.text0}; }

      /* Scrollbar — thin, tinted */
      [data-theme] *::-webkit-scrollbar { width: 10px; height: 10px; }
      [data-theme] *::-webkit-scrollbar-track { background: transparent; }
      [data-theme] *::-webkit-scrollbar-thumb {
        background: ${D.borderMd};
        border-radius: ${RADIUS.full}px;
        border: 3px solid transparent;
        background-clip: padding-box;
      }
      [data-theme] *::-webkit-scrollbar-thumb:hover { background: ${D.borderHi}; background-clip: padding-box; }

      input::placeholder { color: ${D.text2}; }

      html, body, #root { margin: 0; padding: 0; min-height: 100%; }
      body {
        color: ${D.text0};
        font-family: ${D.sans};
        font-feature-settings: 'ss01', 'cv11';
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        overflow-x: hidden;
      }

      /* Global mobile hygiene — prevent overflow anywhere */
      *, *::before, *::after {
        overflow-wrap: break-word;
        word-break: break-word;
      }
      button { font-family: inherit; }

      /* Mobile-specific tweaks */
      @media (max-width: 767px) {
        .miq-mobile-scroll-x {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .miq-mobile-scroll-x::-webkit-scrollbar { height: 3px; }
      }

      /* Instrument surface — a working panel. No atmospheric bloom.
         Dark: matte obsidian with a soft top-edge amber warmth, hairline horizon at the bottom.
         Light: warm laid paper with a subtle top-light and a faint horizontal grain. */
      [data-theme="dark"] body {
        background:
          linear-gradient(180deg, rgba(255,165,55,0.045) 0%, transparent 240px),
          linear-gradient(180deg, transparent 0, transparent calc(100% - 1px), ${D.borderMd} 100%),
          ${D.bg0};
        background-attachment: fixed;
      }
      [data-theme="light"] body {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 320px),
          repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(60,45,15,0.012) 3px, rgba(60,45,15,0.012) 4px),
          ${D.bg0};
        background-attachment: fixed;
      }

      /* Reduced motion — respect the user */
      @media (prefers-reduced-motion: reduce) {
        [data-theme] *,
        [data-theme] *::before,
        [data-theme] *::after {
          animation-duration: 0.001ms !important;
          transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  )
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    try {
      const saved = localStorage.getItem(LS_THEME)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    try { localStorage.setItem(LS_THEME, theme) } catch {}
  }, [theme])
  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  return [theme, toggle]
}

/* ============================================================
 * Hooks
 * ============================================================ */

function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, onClose])
}

/* ============================================================
 * Small atoms
 * ============================================================ */

function Wordmark({ size = 20 }) {
  return (
    <span style={{
      fontFamily: D.sans, color: D.text0,
      fontSize: size, fontWeight: 800, letterSpacing: '-0.02em',
      display: 'inline-flex', alignItems: 'baseline', gap: Math.round(size * 0.1),
    }}>
      MATCH
      <span style={{
        display: 'inline-block',
        width: Math.round(size * 0.28), height: Math.round(size * 0.28),
        borderRadius: 2, background: D.accent,
        transform: 'translateY(-1px)',
      }} />
      IQ
    </span>
  )
}

function Label({ children, color = D.text2, style }) {
  return <div style={{ ...TYPE.label, color, ...style }}>{children}</div>
}

function EmptyMark({ variant = 'fixtures' }) {
  if (variant === 'picks') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 9-7 9-7-9 7-9z" stroke={D.borderHi} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  if (variant === 'tracking') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke={D.text3} strokeWidth="1.5" />
        <path d="M12 8v8M8 12h8" stroke={D.text3} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 4, height: 24 }}>
      <span style={{ width: 2, height: 24, background: D.accent, borderRadius: 1 }} />
      <span style={{ width: 2, height: 16, background: D.accent, borderRadius: 1 }} />
    </div>
  )
}

function EmptyState({ title, hint, variant, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40, gap: 12,
    }}>
      <EmptyMark variant={variant} />
      <div style={{ ...TYPE.body, color: D.text1 }}>{title}</div>
      {hint && <div style={{ ...TYPE.caption, color: D.text2, maxWidth: 320 }}>{hint}</div>}
      {action}
    </div>
  )
}

function Pill({ children, tone = 'muted', style }) {
  const bg = tone === 'accent' ? D.accent : D.surface3
  const color = tone === 'accent' ? D.surface0 : D.text1
  const border = tone === 'accent' ? 'transparent' : D.borderMd
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color,
      border: `1px solid ${border}`,
      borderRadius: RADIUS.sm,
      padding: '3px 8px',
      ...TYPE.label,
      fontSize: 10,
      ...style,
    }}>{children}</span>
  )
}

function DataChip({ children, tone = 'muted' }) {
  const bg = tone === 'accent' ? D.accent : D.surface2
  const color = tone === 'accent' ? D.surface0 : D.text0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color,
      borderRadius: RADIUS.sm,
      padding: '2px 8px',
      ...TYPE.dataSm,
    }}>{children}</span>
  )
}

function Card({ children, style, interactive = false, onClick }) {
  return (
    <div
      className={interactive ? 'miq-card' : undefined}
      onClick={onClick}
      style={{
        background: D.surface1,
        border: `1px solid ${D.border}`,
        borderRadius: RADIUS.lg,
        padding: 16,
        boxShadow: D.shadowSm,
        ...style,
      }}>{children}</div>
  )
}

function IconButton({ onClick, label, children, style }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      background: 'transparent', border: 'none', color: D.text0,
      padding: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', borderRadius: RADIUS.sm,
      ...style,
    }}>{children}</button>
  )
}

function PrimaryButton({ onClick, children, style }) {
  return (
    <button onClick={onClick} style={{
      background: D.accent, color: D.surface0, border: 'none',
      borderRadius: RADIUS.md, padding: '10px 16px',
      fontFamily: D.sans, fontWeight: 700, fontSize: 13, cursor: 'pointer',
      ...style,
    }}>{children}</button>
  )
}

function SecondaryButton({ onClick, children, style }) {
  return (
    <button onClick={onClick} style={{
      background: D.surface2, color: D.text0, border: `1px solid ${D.border}`,
      borderRadius: RADIUS.md, padding: '8px 14px',
      fontFamily: D.sans, fontWeight: 600, fontSize: 13, cursor: 'pointer',
      ...style,
    }}>{children}</button>
  )
}

function SegmentedControl({ options, value, onChange, style }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: D.surface1, border: `1px solid ${D.borderMd}`,
      borderRadius: RADIUS.md, padding: 2, gap: 2,
      ...style,
    }}>
      {options.map(o => {
        const on = o.key === value
        return (
          <button key={o.key} onClick={() => onChange(o.key)} className="miq-seg" style={{
            background: on ? D.surface3 : 'transparent',
            color: on ? D.text0 : D.text1,
            border: 'none', borderRadius: RADIUS.sm - 1,
            padding: '6px 14px',
            fontFamily: D.sans, fontSize: 13, fontWeight: on ? 600 : 500,
            cursor: 'pointer',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

function Skeleton({ w = '100%', h = 12, style }) {
  return <div className="miq-skeleton" style={{ width: w, height: h, ...style }} />
}

function FixtureListSkeleton() {
  const rowWidths = [
    ['62%', '18%'], ['54%', '14%'], ['58%', '16%'], ['66%', '14%'],
  ]
  return (
    <div style={{ background: D.surface1, border: `1px solid ${D.border}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
      {[0, 1, 2].map(gi => (
        <div key={gi} style={{ marginTop: gi === 0 ? 0 : 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px 8px', borderBottom: `1px solid ${D.border}`,
          }}>
            <Skeleton w={90} h={10} />
            <Skeleton w={20} h={10} />
          </div>
          {rowWidths.map(([teamW, statusW], ri) => (
            <div key={ri} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              minHeight: 48, padding: '8px 16px',
              borderBottom: `1px solid ${D.border}`,
            }}>
              <div style={{ width: 64, flexShrink: 0 }}><Skeleton w={40} h={10} /></div>
              <div style={{ flex: 1 }}><Skeleton w={teamW} h={14} /></div>
              <Skeleton w={16} h={16} style={{ borderRadius: 4 }} />
              <div style={{ width: 32, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <Skeleton w={statusW} h={12} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ============================================================
 * Header (mobile + desktop variants)
 * ============================================================ */

function Header({ onSearch, onBell, unread, theme, onToggleTheme, apiStatus, liveCount, refreshTimer, analysedCount }) {
  const allOk = apiStatus && Object.values(apiStatus).every(v => v === 'operational' || v === 'unknown')
  const anyDegraded = apiStatus && Object.values(apiStatus).some(v => v === 'degraded')
  const ledColor = anyDegraded ? D.danger : allOk ? D.accent : D.text2

  const tickerItems = [
    { l: 'STATUS', v: anyDegraded ? 'DEGRADED' : 'ACTIVE', c: anyDegraded ? D.danger : D.accent },
    { l: 'LIVE',   v: (liveCount ?? 0).toString().padStart(2, '0'), c: (liveCount ?? 0) > 0 ? D.live : D.text2 },
    { l: 'ANALYSED', v: (analysedCount ?? 0).toString().padStart(2, '0'), c: D.text1 },
    { l: 'REFRESH', v: `${refreshTimer ?? 0}s`.padStart(4, ' '), c: D.text1 },
  ]

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 101 }}>
      {/* Ticker strip — the instrument LED bar */}
      <div style={{
        background: D.bg0,
        borderBottom: `1px solid ${D.border}`,
        height: 24, padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
          {tickerItems.map(t => (
            <span key={t.l} style={{
              display: 'inline-flex', alignItems: 'baseline', gap: 6,
              fontFamily: D.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>
              <span style={{ color: D.text3, fontWeight: 500 }}>{t.l}</span>
              <span style={{ color: t.c, fontWeight: 700 }}>{t.v}</span>
            </span>
          ))}
        </div>
        <span style={{
          fontFamily: D.mono, fontSize: 10, letterSpacing: '0.14em', color: D.text3, fontWeight: 500,
        }}>MATCHIQ · v1.0</span>
      </div>

      {/* Main bar */}
      <div style={{
        background: `color-mix(in oklab, ${D.surface0} 88%, transparent)`,
        backdropFilter: 'blur(14px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
        borderBottom: `1px solid ${D.border}`,
        boxShadow: D.shadowSm,
        height: 56, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Status LED */}
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: ledColor,
            boxShadow: `0 0 10px ${ledColor}`,
            display: 'inline-block',
          }} />
          <Wordmark size={19} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconButton onClick={onSearch} label="Search"><Search size={18} /></IconButton>
          <div style={{ position: 'relative' }}>
            <IconButton onClick={onBell} label="Notifications"><Bell size={18} /></IconButton>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 14, height: 14, padding: '0 3px',
                background: D.accent, color: D.bg0,
                borderRadius: RADIUS.full, fontFamily: D.mono, fontSize: 9, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{unread}</span>
            )}
          </div>
          <IconButton onClick={onToggleTheme} label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </div>
      </div>
    </div>
  )
}

function buildTickerItems(fixtures, analysisCache, scanCount, refreshTimer) {
  const items = []
  const competitionCount = new Set(fixtures.map(f => f.competition)).size

  items.push({
    type: 'status',
    text: `Monitoring ${scanCount} events across ${competitionCount} ${competitionCount === 1 ? 'competition' : 'competitions'} · Refreshed ${refreshTimer}s ago`,
  })

  const liveFixtures = fixtures.filter(f => f.status === 'IN_PLAY' || f.status === 'LIVE')
  liveFixtures.forEach(f => {
    items.push({
      type: 'live',
      homeTeam: f.homeTeam, awayTeam: f.awayTeam,
      homeScore: f.goalsHome ?? '–',
      awayScore: f.goalsAway ?? '–',
    })
  })

  const finished = fixtures
    .filter(f => f.status === 'FINISHED')
    .sort((a, b) => (b.kickoffDate?.getTime?.() ?? 0) - (a.kickoffDate?.getTime?.() ?? 0))
    .slice(0, 5)
  finished.forEach(f => {
    items.push({
      type: 'finished',
      homeTeam: f.homeTeam, awayTeam: f.awayTeam,
      homeScore: f.goalsHome ?? '?',
      awayScore: f.goalsAway ?? '?',
    })
  })

  const fxById = Object.fromEntries(fixtures.map(f => [String(f.id), f]))
  const analyses = Object.entries(analysisCache)
    .filter(([, a]) => a?._ts)
    .sort((a, b) => (b[1]._ts || 0) - (a[1]._ts || 0))
    .slice(0, 6)

  analyses.forEach(([id, a]) => {
    const fx = fxById[String(id)] || { homeTeam: a.homeTeam || 'Home', awayTeam: a.awayTeam || 'Away' }
    const r = a.recommendation || {}
    const conf = Math.round((r.confidence || 0) * 100)
    const edge = r.value_edge || 0
    const pickLabel = r.pick === 'home_win' ? `${fx.homeTeam} Win`
      : r.pick === 'away_win' ? `${fx.awayTeam} Win`
      : 'Draw'
    items.push({
      type: 'analysis',
      homeTeam: fx.homeTeam, awayTeam: fx.awayTeam,
      pickLabel, confidence: conf, edge,
    })
  })

  const highConf = fixtures.filter(f => {
    const cached = analysisCache[f.id]
    return (f.status === 'SCHEDULED' || f.status === 'TIMED') && (cached?.recommendation?.confidence ?? 0) >= 0.65
  }).slice(0, 4)
  highConf.forEach(f => {
    const cached = analysisCache[f.id]
    items.push({
      type: 'upcoming',
      homeTeam: f.homeTeam, awayTeam: f.awayTeam,
      kickoff: f.kickoff,
      confidenceLabel: cached.recommendation.confidence_label || 'high',
    })
  })

  return items
}

function TickerSeparator() {
  return (
    <span style={{
      fontFamily: D.mono, fontSize: 16, color: D.text3,
      margin: '0 16px', userSelect: 'none',
    }}>·</span>
  )
}

function TickerItem({ item }) {
  const Dot = ({ color, size = 5 }) => (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color, marginRight: 6, verticalAlign: 'middle',
      boxShadow: `0 0 6px ${color}`, flexShrink: 0,
    }} />
  )
  const commonSpan = { display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }

  if (item.type === 'status') {
    return (
      <span style={{ ...commonSpan, fontFamily: D.mono, fontSize: 11, color: D.text3 }}>
        {item.text}
      </span>
    )
  }
  if (item.type === 'live') {
    return (
      <span style={commonSpan}>
        <Dot color={D.live} size={6} />
        <span style={{ fontFamily: D.sans, fontSize: 12, fontWeight: 600, color: D.text0 }}>
          {item.homeTeam}
        </span>
        <span style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 700, color: D.live, margin: '0 8px' }}>
          {item.homeScore} – {item.awayScore}
        </span>
        <span style={{ fontFamily: D.sans, fontSize: 12, fontWeight: 600, color: D.text0 }}>
          {item.awayTeam}
        </span>
      </span>
    )
  }
  if (item.type === 'finished') {
    return (
      <span style={commonSpan}>
        <Dot color={D.text3} size={5} />
        <span style={{ fontFamily: D.sans, fontSize: 12, color: D.text1 }}>
          {item.homeTeam}
        </span>
        <span style={{ fontFamily: D.mono, fontSize: 12, color: D.text1, margin: '0 8px', fontWeight: 700 }}>
          {item.homeScore} – {item.awayScore}
        </span>
        <span style={{ fontFamily: D.sans, fontSize: 12, color: D.text1 }}>
          {item.awayTeam}
        </span>
        <span style={{ fontFamily: D.mono, fontSize: 9, color: D.text3, marginLeft: 8, letterSpacing: '0.06em' }}>
          FT
        </span>
      </span>
    )
  }
  if (item.type === 'analysis') {
    const edgeColor = item.edge > 0 ? D.accent : item.edge < 0 ? D.danger : D.text2
    return (
      <span style={commonSpan}>
        <Dot color={D.accent} size={5} />
        <span style={{ fontFamily: D.sans, fontSize: 12, color: D.text1 }}>
          {item.homeTeam} <span style={{ color: D.text3 }}>vs</span> {item.awayTeam}
        </span>
        <span style={{ color: D.text3, margin: '0 8px' }}>·</span>
        <span style={{ fontFamily: D.sans, fontSize: 12, color: D.text0, fontWeight: 600 }}>
          {item.pickLabel}
        </span>
        <span style={{ color: D.text3, margin: '0 8px' }}>·</span>
        <span style={{ fontFamily: D.mono, fontSize: 12, color: D.text1 }}>
          {item.confidence}%
        </span>
        <span style={{ color: D.text3, margin: '0 8px' }}>·</span>
        <span style={{ fontFamily: D.mono, fontSize: 12, color: edgeColor, fontWeight: 700 }}>
          {item.edge > 0 ? '+' : ''}{item.edge}%
        </span>
      </span>
    )
  }
  if (item.type === 'upcoming') {
    return (
      <span style={commonSpan}>
        <Dot color={D.warning} size={5} />
        <span style={{ fontFamily: D.sans, fontSize: 12, color: D.text1 }}>
          {item.homeTeam} <span style={{ color: D.text3 }}>vs</span> {item.awayTeam}
        </span>
        <span style={{ color: D.text3, margin: '0 8px' }}>·</span>
        <span style={{ fontFamily: D.mono, fontSize: 12, color: D.text2 }}>
          {item.kickoff}
        </span>
        <span style={{ color: D.text3, margin: '0 8px' }}>·</span>
        <span style={{ fontFamily: D.sans, fontSize: 12, color: D.text2, textTransform: 'capitalize' }}>
          {item.confidenceLabel} confidence
        </span>
      </span>
    )
  }
  return null
}

function IntelligenceFeed({ fixtures, analysisCache, refreshTimer, topOffset = 80 }) {
  const items = useMemo(
    () => buildTickerItems(fixtures, analysisCache, fixtures.length, refreshTimer),
    [fixtures, analysisCache, refreshTimer]
  )

  // Duration scales with content length so speed feels consistent regardless of item count
  const durationSec = Math.max(30, items.length * 5)

  const Track = () => (
    <>
      {items.map((item, i) => (
        <span key={`a-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <TickerItem item={item} />
          {i < items.length - 1 && <TickerSeparator />}
        </span>
      ))}
      {/* second copy for the seamless loop */}
      <TickerSeparator />
      {items.map((item, i) => (
        <span key={`b-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <TickerItem item={item} />
          {i < items.length - 1 && <TickerSeparator />}
        </span>
      ))}
    </>
  )

  return (
    <div style={{
      position: 'sticky', top: topOffset, zIndex: 99,
      height: 32, width: '100%',
      background: `color-mix(in oklab, ${D.surface0} 92%, transparent)`,
      backdropFilter: 'blur(12px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
      borderBottom: `1px solid ${D.border}`,
      overflow: 'hidden',
      display: 'flex', alignItems: 'center',
    }}>
      {/* LIVE badge — anchored left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
        background: D.accentBg,
        borderRight: `1px solid ${D.accentBorder}`,
      }}>
        <span className="miq-ticker-pulse" style={{
          width: 5, height: 5, borderRadius: '50%', background: D.accent,
        }} />
        <span style={{
          fontFamily: D.mono, fontSize: 9, fontWeight: 800,
          letterSpacing: '0.15em', color: D.accent,
        }}>LIVE</span>
      </div>

      {/* Left fade */}
      <div style={{
        position: 'absolute', left: 68, top: 0, bottom: 0, width: 32, zIndex: 2,
        background: `linear-gradient(90deg, ${D.surface0} 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, zIndex: 2,
        background: `linear-gradient(270deg, ${D.surface0} 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      {/* Scrolling track */}
      <div className="miq-ticker-track" style={{
        paddingLeft: 80, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
        animationDuration: `${durationSec}s`,
      }}>
        <Track />
      </div>
    </div>
  )
}

function DiagnosticPanel({ apiHealth, open, onToggle, onRetryFootball, onRetryOdds }) {
  const fmtAt = (ts) => ts ? new Date(ts).toLocaleTimeString('en-GB', { hour12: false }) : '—'

  const row = (name, h, retry, extra) => {
    const ok = h.code >= 200 && h.code < 300
    const err = h.code === null && h.msg
    const dot = ok ? D.accent : err || (h.code && h.code >= 400) ? D.danger : h.code === 429 ? D.warning : D.text3
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 40px 1fr auto auto',
        gap: 10, alignItems: 'center', padding: '6px 12px',
        borderTop: `1px solid ${D.border}`,
        fontFamily: D.mono, fontSize: 11,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, color: D.text1, fontWeight: 700,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: `0 0 8px ${dot}` }} />
          {name}
        </span>
        <span style={{ color: D.text2 }}>{h.code ?? '—'}</span>
        <span style={{ color: D.text0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={h.msg || ''}>
          {h.msg || 'no request yet'}
          {extra ? <span style={{ color: D.text3 }}>  ·  {extra}</span> : null}
        </span>
        <span style={{ color: D.text3 }}>{fmtAt(h.at)}</span>
        {retry ? (
          <button onClick={retry} style={{
            background: 'transparent', border: `1px solid ${D.borderMd}`,
            color: D.text1, borderRadius: RADIUS.sm, padding: '2px 8px',
            fontFamily: D.mono, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.06em',
          }}>RETRY</button>
        ) : <span />}
      </div>
    )
  }

  if (!open) {
    return (
      <button onClick={onToggle} title="Show API diagnostics" style={{
        position: 'fixed', bottom: 84, right: 12, zIndex: 200,
        background: D.surface2, color: D.text1,
        border: `1px solid ${D.borderMd}`,
        borderRadius: RADIUS.full, padding: '6px 10px',
        fontFamily: D.mono, fontSize: 10, fontWeight: 700, cursor: 'pointer',
        letterSpacing: '0.06em', boxShadow: D.shadowSm,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent, boxShadow: `0 0 8px ${D.accent}` }} />
        DIAG
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', left: 12, right: 12, bottom: 84, zIndex: 200,
      maxWidth: 640, margin: '0 auto',
      background: `color-mix(in oklab, ${D.surface1} 96%, transparent)`,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${D.borderMd}`, borderRadius: RADIUS.md,
      boxShadow: D.shadowLg,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: D.mono, fontSize: 10, fontWeight: 800, color: D.accent, letterSpacing: '0.15em' }}>
            API DIAGNOSTICS
          </span>
          <span style={{ fontFamily: D.mono, fontSize: 10, color: D.text3 }}>· live</span>
        </div>
        <button onClick={onToggle} aria-label="Hide diagnostics" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: D.text2, padding: 4, display: 'inline-flex',
        }}><X size={12} /></button>
      </div>
      {row('FOOTBALL', apiHealth.football, onRetryFootball, apiHealth.football.count != null ? `${apiHealth.football.count} fixtures` : null)}
      {row('ODDS', apiHealth.odds, onRetryOdds, apiHealth.odds.remaining != null ? `${apiHealth.odds.remaining} credits left` : (apiHealth.odds.count != null ? `${apiHealth.odds.count} events` : null))}
      {row('GROQ', apiHealth.analysis, null, null)}
      <div style={{
        padding: '6px 12px', borderTop: `1px solid ${D.border}`,
        fontFamily: D.mono, fontSize: 10, color: D.text3,
      }}>
        Tip: 401/403 = key rejected. 429 = rate limited. `Network:` = dev server / proxy issue.
      </div>
    </div>
  )
}

function StatusDot({ status }) {
  const color = status === 'operational' ? D.accent
    : status === 'degraded' ? D.danger
    : D.text3
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
}

function statusLabel(s) {
  if (s === 'operational') return 'Operational'
  if (s === 'degraded') return 'Degraded'
  return 'Unknown'
}

function MorePanel({ open, onClose, isMobile, apiStatus }) {
  useEscape(open, onClose)
  const width = 320
  const panelStyle = isMobile
    ? {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
        background: D.surface1, borderTop: `1px solid ${D.borderMd}`,
        borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg,
        maxHeight: '85vh', overflowY: 'auto',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 250ms cubic-bezier(0.32,0.72,0,1)',
      }
    : {
        position: 'fixed', right: 0, top: 0, bottom: 0, width, zIndex: 301,
        background: D.surface1, borderLeft: `1px solid ${D.border}`,
        overflowY: 'auto',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 250ms cubic-bezier(0.32,0.72,0,1)',
      }

  const ContactRow = ({ title, sub, href = '#', external = true }) => (
    <a href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="miq-row-hover"
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        minHeight: 44, padding: '10px 4px', textDecoration: 'none',
        borderBottom: `1px solid ${D.border}`, color: D.text1, gap: 12,
      }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...TYPE.body, color: D.text0, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {sub && <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <ExternalLink size={14} color={D.text2} />
    </a>
  )

  const SocialLink = ({ label, href, Icon }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '10px 6px',
      background: D.surface2, border: `1px solid ${D.borderMd}`,
      borderRadius: RADIUS.md, color: D.text1,
      textDecoration: 'none',
      transition: `background ${D.durFast} ${D.ease}, border-color ${D.durFast} ${D.ease}, color ${D.durFast} ${D.ease}`,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = D.surface3; e.currentTarget.style.borderColor = D.accentBorder; e.currentTarget.style.color = D.accent }}
    onMouseLeave={(e) => { e.currentTarget.style.background = D.surface2; e.currentTarget.style.borderColor = D.borderMd; e.currentTarget.style.color = D.text1 }}
    >
      <Icon size={16} color="currentColor" />
      <span style={{ fontFamily: D.mono, fontSize: 10, letterSpacing: '0.06em', fontWeight: 700 }}>{label}</span>
    </a>
  )

  return (
    <>
      <div className="miq-overlay-fade" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: D.scrim,
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        zIndex: 300,
      }} />
      <div style={panelStyle}>
        {isMobile && (
          <div style={{
            width: 32, height: 4, background: D.surface3,
            borderRadius: RADIUS.full, margin: '10px auto 0',
          }} />
        )}

        {/* Section 1 — Product identity */}
        <div style={{ padding: '24px 20px 20px' }}>
          <Wordmark size={22} />
          <div style={{ ...TYPE.caption, color: D.text2, marginTop: 6 }}>
            Prediction intelligence platform
          </div>
          <div style={{ ...TYPE.dataSm, color: D.text3, marginTop: 4 }}>
            v1.0 · Beta
          </div>
        </div>
        <div style={{ height: 1, background: D.border }} />

        {/* Section 2 — Creator */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>BUILT BY</div>
          <div style={{
            marginTop: 8, background: D.surface2, borderRadius: RADIUS.md,
            padding: 12, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: RADIUS.full,
              background: D.surface3, color: D.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...TYPE.body, fontWeight: 700,
            }}>BA</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...TYPE.body, color: D.text0, fontWeight: 700 }}>Bright Agwunobi</div>
              <div style={{ ...TYPE.caption, color: D.text2 }}>Final Year CS · AAUA</div>
            </div>
          </div>
          <div style={{
            marginTop: 12,
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
          }}>
            <SocialLink label="GitHub"   href={SOCIAL_LINKS.github}   Icon={GitHub} />
            <SocialLink label="LinkedIn" href={SOCIAL_LINKS.linkedin} Icon={LinkedIn} />
            <SocialLink label="X"        href={SOCIAL_LINKS.x}        Icon={XSocial} />
            <SocialLink label="Email"    href={SOCIAL_LINKS.email}    Icon={Mail} />
          </div>
        </div>

        {/* Section 3 — Contact */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, marginBottom: 8 }}>CONTACT</div>
          <ContactRow title="Send feedback"    href={mailto('MatchIQ Feedback')} />
          <ContactRow title="Report a bug"     href={mailto('MatchIQ Bug Report')} />
          <ContactRow title="Request a feature" href={mailto('MatchIQ Feature Request')} />
          <ContactRow title="Support" sub={CONTACT_EMAIL} href={SOCIAL_LINKS.email} />
        </div>

        {/* Section 4 — API status */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, marginBottom: 8 }}>API STATUS</div>
          {[
            { key: 'football', name: 'Football Data' },
            { key: 'odds', name: 'Odds API' },
            { key: 'analysis', name: 'Analysis Engine' },
          ].map(s => (
            <div key={s.key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
            }}>
              <span style={{ ...TYPE.body, color: D.text1 }}>{s.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <StatusDot status={apiStatus[s.key]} />
                <span style={{ ...TYPE.caption, color: D.text2 }}>{statusLabel(apiStatus[s.key])}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Section 5 — Legal */}
        <div style={{ height: 1, background: D.border, margin: '0 20px' }} />
        <div style={{ padding: '16px 20px 24px' }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, marginBottom: 8 }}>INFORMATION</div>
          <a href={mailto('Privacy Policy Request')} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', ...TYPE.caption, color: D.text2, padding: '6px 0', textDecoration: 'none' }}>
            Privacy Policy
          </a>
          <a href={mailto('Terms of Service Request')} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', ...TYPE.caption, color: D.text2, padding: '6px 0', textDecoration: 'none' }}>
            Terms of Service
          </a>
          <div style={{ ...TYPE.caption, color: D.text2, padding: '6px 0' }}>
            Data Sources: football-data.org · the-odds-api.com
          </div>
          <div style={{ ...TYPE.caption, color: D.text2, padding: '6px 0' }}>
            AI: Groq · llama-3.3-70b-versatile
          </div>
          <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3, marginTop: 16 }}>
            © 2026 MatchIQ · Bright Agwunobi
          </div>
          <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3 }}>
            Not financial advice. For research only.
          </div>
        </div>
      </div>
    </>
  )
}

/* ============================================================
 * Sidebar
 * ============================================================ */

function SidebarBody({ activeTab, onTab, isMobile, onClose }) {
  const items = [
    { key: 'today',    label: 'Today' },
    { key: 'picks',    label: 'Picks' },
    { key: 'tracking', label: 'Tracking' },
    { key: 'accuracy', label: 'Accuracy' },
  ]
  return (
    <div style={{
      width: 220, height: '100vh',
      background: D.surface2, borderRight: `1px solid ${D.border}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 12px' }}>
        <Wordmark size={20} />
        {isMobile && (
          <IconButton onClick={onClose} label="Close menu" style={{ color: D.text1 }}><X /></IconButton>
        )}
      </div>
      <div style={{ padding: '8px 0' }}>
        {items.map(it => {
          const active = it.key === activeTab
          return (
            <button
              key={it.key}
              onClick={() => { onTab(it.key); if (isMobile) onClose() }}
              className="miq-row-hover"
              style={{
                width: '100%', height: 40, padding: '0 20px',
                textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center',
                background: active ? D.accentBg : 'transparent',
                borderLeft: `3px solid ${active ? D.accent : 'transparent'}`,
                borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                color: active ? D.text0 : D.text1,
                ...TYPE.body, fontWeight: 500,
              }}>{it.label}</button>
          )
        })}
      </div>
      <div style={{ height: 1, background: D.border, margin: '12px 20px' }} />
      <div style={{ padding: '0 20px' }}>
        <Label style={{ marginBottom: 12 }}>Domains</Label>
        <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent }} />
          <span style={{ ...TYPE.caption, color: D.text1, flex: 1 }}>Football</span>
        </div>
        <div style={{ height: 1, background: D.border, margin: '12px 0' }} />
        <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent }} />
          <span style={{ ...TYPE.body, color: D.text0, flex: 1 }}>Football</span>
          <span style={{ ...TYPE.label, fontSize: 10, color: D.accent }}>Active</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      {!isMobile && (
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${D.border}` }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: D.surface3, color: D.text0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>AK</div>
          <span style={{ ...TYPE.caption, color: D.text1 }}>Account</span>
        </div>
      )}
    </div>
  )
}

function MobileSidebar({ open, onClose, activeTab, onTab }) {
  useEscape(open, onClose)
  return (
    <>
      <div className="miq-overlay-fade"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: D.scrim,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          zIndex: 200,
        }} />
      <div className={`miq-sidebar-panel ${open ? 'miq-sidebar-open' : 'miq-sidebar-enter'}`}
        style={{ position: 'fixed', left: 0, top: 0, zIndex: 201 }}>
        <SidebarBody activeTab={activeTab} onTab={onTab} isMobile onClose={onClose} />
      </div>
    </>
  )
}

function DesktopSidebar({ activeTab, onTab }) {
  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
      <SidebarBody activeTab={activeTab} onTab={onTab} isMobile={false} />
    </div>
  )
}

/* ============================================================
 * Bottom tab bar (mobile only)
 * ============================================================ */

function BottomTabBar({ activeTab, onTab, onMore, moreOpen, isMobile }) {
  const tabs = [
    { key: 'today',    label: 'Today',    mobile: 'Today' },
    { key: 'picks',    label: 'Picks',    mobile: 'Picks' },
    { key: 'tracking', label: 'Tracking', mobile: 'Track' },
    { key: 'accuracy', label: 'Accuracy', mobile: 'Stats' },
    { key: 'research', label: 'Research', mobile: 'Research' },
    { key: 'more',     label: 'More',     mobile: 'More' },
  ]
  const labelSize = isMobile ? 10 : 13
  const indicatorWidth = isMobile ? 20 : 28
  const letterSpacing = isMobile ? 0 : '0.02em'
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: `color-mix(in oklab, ${D.surface1} 88%, transparent)`,
      backdropFilter: 'blur(14px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
      borderTop: `1px solid ${D.border}`,
      boxShadow: D.shadowMd,
      height: 56, display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map(t => {
        const isMore = t.key === 'more'
        const on = isMore ? moreOpen : t.key === activeTab
        return (
          <button key={t.key} onClick={() => isMore ? onMore() : onTab(t.key)} style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none', cursor: 'pointer',
            color: on ? D.text0 : D.text2,
            fontFamily: D.sans, fontWeight: on ? 700 : 600, fontSize: labelSize,
            letterSpacing, padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'all 150ms ease',
          }}>
            <span style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: indicatorWidth, height: 2, background: D.accent, borderRadius: 1,
              opacity: on ? 1 : 0, transition: 'opacity 150ms ease',
            }} />
            {isMobile ? t.mobile : t.label}
          </button>
        )
      })}
    </div>
  )
}

/* ============================================================
 * Overlay panel base
 * ============================================================ */

function OverlayPanel({ open, onClose, children }) {
  const ref = useRef(null)
  useEscape(open, onClose)
  useEffect(() => {
    if (!open) return
    const first = ref.current?.querySelector('input, button, [tabindex]')
    first?.focus()
  }, [open])
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: D.scrim,
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      zIndex: 300, overflowY: 'auto',
    }}>
      <div ref={ref} onClick={e => e.stopPropagation()} style={{
        maxWidth: 520, width: 'calc(100% - 24px)',
        margin: '64px auto', background: D.surface1,
        border: `1px solid ${D.borderMd}`, borderRadius: RADIUS.lg,
        padding: 16, boxShadow: D.shadowLg,
      }}>
        {children}
      </div>
    </div>
  )
}

/* ============================================================
 * Search + Notifications palette
 * ============================================================ */

function SearchPalette({ open, initialTab, onClose, fixtures, analysisCache, onOpenFixture, unread }) {
  const [tab, setTab] = useState(initialTab || 'search')
  const [q, setQ] = useState('')
  useEffect(() => { setTab(initialTab || 'search'); setQ('') }, [initialTab, open])

  const analyzedList = useMemo(
    () => fixtures
      .filter(f => analysisCache[f.id])
      .sort((a, b) => (analysisCache[b.id]._ts || 0) - (analysisCache[a.id]._ts || 0)),
    [fixtures, analysisCache]
  )
  const highConviction = useMemo(
    () => analyzedList.filter(f => analysisCache[f.id]?.recommendation?.confidence >= 0.65),
    [analyzedList, analysisCache]
  )

  const filtered = useMemo(() => {
    if (!q) return []
    const s = q.toLowerCase()
    return fixtures.filter(f => f.homeTeam.toLowerCase().includes(s) || f.awayTeam.toLowerCase().includes(s)).slice(0, 8)
  }, [q, fixtures])

  return (
    <OverlayPanel open={open} onClose={onClose}>
      <SegmentedControl
        options={[
          { key: 'search',        label: 'Search' },
          { key: 'notifications', label: `Notifications ${unread}` },
        ]}
        value={tab} onChange={setTab}
        style={{ marginBottom: 16 }}
      />

      {tab === 'search' && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: D.surface2, border: `1px solid ${D.border}`,
            borderRadius: RADIUS.md, padding: '12px 16px', marginBottom: 16,
          }}>
            <span style={{ color: D.text2 }}><Search /></span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search events, leagues, teams"
              autoFocus
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: D.text0, ...TYPE.data,
              }}
            />
          </div>

          {q && filtered.length === 0 && (
            <div style={{ ...TYPE.caption, color: D.text2, padding: '8px 4px' }}>No matches.</div>
          )}

          {q && filtered.map(f => (
            <PaletteRow
              key={f.id}
              left={`${f.homeTeam} vs ${f.awayTeam}`}
              right={`${f.competition}${analysisCache[f.id] ? ` · ${Math.round((analysisCache[f.id].recommendation.confidence || 0) * 100)}%` : ''}`}
              onClick={() => { onOpenFixture(f); onClose() }}
            />
          ))}

          {!q && highConviction.length > 0 && (
            <>
              <Label style={{ margin: '4px 4px 8px' }}>High Conviction Picks</Label>
              {highConviction.slice(0, 5).map(f => (
                <PaletteRow
                  key={f.id}
                  left={`${f.homeTeam} vs ${f.awayTeam}`}
                  right={`${f.competition} · ${Math.round(analysisCache[f.id].recommendation.confidence * 100)}%`}
                  onClick={() => { onOpenFixture(f); onClose() }}
                />
              ))}
            </>
          )}

          {!q && analyzedList.length > 0 && (
            <>
              <Label style={{ margin: '16px 4px 8px' }}>Recent Analyses</Label>
              {analyzedList.slice(0, 5).map(f => (
                <PaletteRow
                  key={f.id}
                  left={`${f.homeTeam} vs ${f.awayTeam}`}
                  right={`${f.competition} · ${Math.round((analysisCache[f.id].recommendation.confidence || 0) * 100)}%`}
                  onClick={() => { onOpenFixture(f); onClose() }}
                />
              ))}
            </>
          )}

          {!q && highConviction.length === 0 && analyzedList.length === 0 && (
            <EmptyState title="Nothing to jump to yet" hint="Run an analysis to populate search results." />
          )}
        </div>
      )}

      {tab === 'notifications' && (
        <NotificationsBody
          fixtures={fixtures}
          analysisCache={analysisCache}
          onOpenFixture={(f) => { onOpenFixture(f); onClose() }}
        />
      )}

      <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3, textAlign: 'center', marginTop: 14 }}>
        ESC to close
      </div>
    </OverlayPanel>
  )
}

function PaletteRow({ left, right, onClick }) {
  return (
    <button onClick={onClick} className="miq-row-hover" style={{
      width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 12px', borderRadius: RADIUS.md,
      color: D.text0,
    }}>
      <span style={{ ...TYPE.body, color: D.text0 }}>{left}</span>
      <span style={{ ...TYPE.dataSm, color: D.text2 }}>{right}</span>
    </button>
  )
}

function NotificationsBody({ fixtures, analysisCache, onOpenFixture }) {
  const items = useMemo(() => {
    const list = fixtures
      .filter(f => analysisCache[f.id])
      .map(f => {
        const a = analysisCache[f.id]
        const label = a.recommendation.confidence_label || ''
        const ts = a._ts || 0
        return { fixture: f, label, ts }
      })
      .sort((a, b) => b.ts - a.ts)
    return list
  }, [fixtures, analysisCache])

  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        hint="Alerts appear when analyses complete and when odds move on tracked fixtures."
      />
    )
  }

  const now = Date.now()
  const timeAgo = (ts) => {
    if (!ts) return ''
    const m = Math.max(1, Math.round((now - ts) / 60000))
    if (m < 60) return `${m}m ago`
    const h = Math.round(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.round(h / 24)}d ago`
  }

  return (
    <div>
      {items.map(({ fixture: f, label, ts }) => (
        <button
          key={f.id}
          onClick={() => onOpenFixture(f)}
          className="miq-row-hover"
          style={{
            display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'transparent', border: 'none',
            borderLeft: `3px solid ${D.info}`,
            padding: '10px 12px', marginBottom: 6, borderRadius: RADIUS.sm,
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ ...TYPE.body, color: D.text0 }}>{f.homeTeam} vs {f.awayTeam}</span>
            <span style={{ ...TYPE.dataSm, color: D.text2 }}>{timeAgo(ts)}</span>
          </div>
          <div style={{ ...TYPE.caption, color: D.text1, marginTop: 2 }}>
            analysis complete — {label} confidence
          </div>
        </button>
      ))}
    </div>
  )
}

/* ============================================================
 * Today screen
 * ============================================================ */

function IntelligenceSummary({
  scanCount, competitionsCount, competitionOptions,
  analyzedCount, highConvictionCount, liveCount, refreshTimer,
  activeComp, setActiveComp,
}) {
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const chipStyle = {
    ...TYPE.dataSm, fontFamily: D.mono, color: D.text1,
    background: D.surface2, border: `1px solid ${D.borderMd}`,
    borderRadius: RADIUS.full, padding: '4px 10px',
  }

  const Stat = ({ v, l }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: D.mono, fontSize: 20, fontWeight: 700, color: D.text0, lineHeight: 1 }}>{v}</div>
      <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>{l}</div>
    </div>
  )
  const VDivider = () => (
    <div style={{ width: 1, height: 24, background: D.surface3, alignSelf: 'center' }} />
  )

  return (
    <div style={{
      background: D.surface0, borderBottom: `2px solid ${D.accent}`,
      padding: 20, margin: '-16px -16px 0',
    }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>MATCHIQ INTELLIGENCE</div>
          <div style={{ ...TYPE.title, fontSize: 22, fontWeight: 800, color: D.text0, marginTop: 4 }}>{dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={chipStyle}>{scanCount} events</span>
          <span style={chipStyle}>{competitionsCount} leagues</span>
        </div>
      </div>

      {/* Row 2 — stats: 2x2 grid on mobile, single row on tablet+ */}
      <div style={{
        marginTop: 14,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        borderTop: `1px solid ${D.border}`, paddingTop: 12,
      }}>
        {[
          { v: analyzedCount, l: 'ANALYSED' },
          { v: highConvictionCount, l: 'HIGH CONVICTION' },
          { v: liveCount, l: 'LIVE NOW' },
          { v: `${refreshTimer}s`, l: 'SINCE REFRESH' },
        ].map(s => (
          <div key={s.l} style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            paddingLeft: 10, borderLeft: `2px solid ${D.border}`,
          }}>
            <div style={{ fontFamily: D.mono, fontSize: 20, fontWeight: 700, color: D.text0, lineHeight: 1 }}>{s.v}</div>
            <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, fontSize: 9 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Row 3 — competition filter pills */}
      {competitionOptions.length > 0 && (
        <div style={{
          borderTop: `1px solid ${D.border}`, marginTop: 14, paddingTop: 12,
          display: 'flex', gap: 6, overflowX: 'auto', whiteSpace: 'nowrap',
        }}>
          {[{ code: 'all', name: 'All' }, ...competitionOptions].map(c => {
            const on = activeComp === c.code
            return (
              <button key={c.code}
                onClick={() => setActiveComp(c.code)}
                style={{
                  ...TYPE.dataSm, fontFamily: D.mono, cursor: 'pointer',
                  background: on ? D.accent : D.surface2,
                  color: on ? D.surface0 : D.text1,
                  border: `1px solid ${on ? D.accent : D.borderMd}`,
                  borderRadius: RADIUS.full, padding: '4px 12px',
                  fontWeight: on ? 700 : 500, flexShrink: 0,
                }}>
                {c.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PickCard({ fixture, analysis, onOpen, parlayActive, onToggleParlay }) {
  const r = analysis.recommendation
  const confPct = Math.round((r.confidence || 0) * 100)
  const edge = r.value_edge || 0
  const edgePositive = edge > 0
  const pickLabel = ({ home_win: fixture.homeTeam, draw: 'Draw', away_win: fixture.awayTeam })[r.pick] || r.pick
  const firstSentence = (r.reasoning || '').split(/(?<=[.!?])\s+/)[0] || r.reasoning
  const halfKellyPct = analysis.kelly?.halfPercent
  const units = halfKellyPct != null && halfKellyPct > 0
    ? (halfKellyPct / 100).toFixed(2)
    : (r.bet_units ?? 0).toFixed?.(1) ?? '0'

  return (
    <div className="miq-pickcard" style={{
      background: D.surface1, border: `1px solid ${D.borderMd}`,
      borderLeft: `4px solid ${D.accent}`,
      borderRadius: RADIUS.lg, padding: 16, marginBottom: 10,
      cursor: 'pointer', color: D.text0,
    }}
      onClick={() => onOpen(fixture)}
    >
      {/* TOP ROW: competition pill + kickoff · edge badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
          <span style={{
            ...TYPE.dataSm, fontFamily: D.mono, color: D.text2,
            background: D.surface3, border: `1px solid ${D.border}`,
            borderRadius: RADIUS.full, padding: '3px 8px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{fixture.competition}</span>
          <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text2 }}>{fixture.kickoff}</span>
        </div>
        {edgePositive && (
          <span style={{
            ...TYPE.dataSm, fontFamily: D.mono, fontWeight: 800,
            background: D.accent, color: D.surface0,
            borderRadius: RADIUS.full, padding: '3px 10px',
          }}>+{edge}%</span>
        )}
      </div>

      {/* MATCH TITLE — allow wrapping, never truncate */}
      <div style={{
        fontFamily: D.sans, fontSize: 20, lineHeight: 1.25, fontWeight: 800,
        color: D.text0, margin: '10px 0 6px',
      }}>
        {fixture.homeTeam} vs {fixture.awayTeam}
      </div>

      {/* REASONING EXCERPT — first sentence, 2-line clamp */}
      <div style={{
        ...TYPE.caption, color: D.text1, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{firstSentence}</div>

      {/* BOTTOM ROW — stacks on mobile via CSS grid */}
      <div style={{
        marginTop: 12, paddingTop: 12,
        borderTop: `1px solid ${D.border}`,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>RECOMMENDATION</div>
          <div style={{
            ...TYPE.body, color: D.text0, fontWeight: 700, marginTop: 4,
          }}>{pickLabel}</div>
        </div>

        <div style={{ height: 4, background: D.surface3, borderRadius: RADIUS.full, overflow: 'hidden' }}>
          <div className="miq-conf" style={{ width: `${confPct}%`, height: '100%', background: D.accent }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text2 }}>
            {units}u stake
          </span>
          <span style={{ fontFamily: D.mono, fontSize: 20, fontWeight: 800, color: D.text0, lineHeight: 1 }}>
            {confPct}%
          </span>
        </div>
      </div>

      {onToggleParlay && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleParlay(fixture.id) }}
            style={{
              ...TYPE.dataSm, fontFamily: D.mono, cursor: 'pointer',
              background: parlayActive ? D.accent : D.surface2,
              color: parlayActive ? D.surface0 : D.text1,
              border: `1px solid ${parlayActive ? D.accent : D.borderMd}`,
              borderRadius: RADIUS.sm, padding: '4px 10px', fontWeight: 700,
            }}>
            {parlayActive ? '✓ In Parlay' : '+ Add to Parlay'}
          </button>
        </div>
      )}
    </div>
  )
}

const LS_SWIPE_HINT = 'matchiq_swipe_hint_shown'

function useSwipeToAnalyze(onCommit, rowRef, enabled) {
  const [swipeX, setSwipeX] = useState(0)
  const [isCommitting, setIsCommitting] = useState(false)
  const [isPastThreshold, setIsPastThreshold] = useState(false)

  const stateRef = useRef({
    startX: 0, startY: 0, startAt: 0,
    dragging: false, scrollLocked: false, directionSet: false,
    animatingBack: false, hapticFired: false, swipeX: 0,
    committed: false,
  })
  const onCommitRef = useRef(onCommit)
  useEffect(() => { onCommitRef.current = onCommit }, [onCommit])

  useEffect(() => {
    if (!enabled) return
    const el = rowRef.current
    if (!el) return

    const getRowWidth = () => el.getBoundingClientRect().width || 375
    const setX = (v) => { stateRef.current.swipeX = v; setSwipeX(v) }

    const reset = () => {
      const s = stateRef.current
      s.dragging = false; s.scrollLocked = false; s.directionSet = false
      s.hapticFired = false
      setX(0); setIsPastThreshold(false); setIsCommitting(false)
    }

    const onStart = (e) => {
      const s = stateRef.current
      if (s.animatingBack) return
      if (e.touches.length > 1) { s.scrollLocked = true; return }
      const t = e.touches[0]
      s.startX = t.clientX; s.startY = t.clientY; s.startAt = Date.now()
      s.dragging = false; s.scrollLocked = false; s.directionSet = false
      s.hapticFired = false; s.committed = false
      setIsCommitting(false); setIsPastThreshold(false)
    }

    const onMove = (e) => {
      const s = stateRef.current
      if (s.animatingBack) return
      if (e.touches.length > 1) {
        setX(0); s.dragging = false; s.scrollLocked = true; return
      }
      if (!s.dragging && Date.now() - s.startAt > 800) {
        s.scrollLocked = true; return
      }
      const t = e.touches[0]
      const dx = t.clientX - s.startX
      const dy = t.clientY - s.startY

      if (!s.directionSet && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        s.directionSet = true
        if (Math.abs(dy) > Math.abs(dx)) { s.scrollLocked = true; return }
        if (dx < 0) { s.scrollLocked = true; return }
        s.dragging = true
      }
      if (s.scrollLocked || !s.dragging) return
      if (dx <= 0) return

      if (e.cancelable) e.preventDefault()

      const rw = getRowWidth()
      const threshold = rw * 0.6
      const actualX = dx < threshold
        ? dx * 0.85
        : threshold * 0.85 + (dx - threshold) * 0.15

      const past = actualX >= rw * 0.5
      if (past && !s.hapticFired) {
        try { navigator.vibrate?.(8) } catch {}
        s.hapticFired = true
      }
      if (!past) s.hapticFired = false
      setIsPastThreshold(past)
      setX(actualX)
    }

    const onEnd = () => {
      const s = stateRef.current
      if (s.scrollLocked || !s.dragging) { reset(); return }
      const rw = getRowWidth()
      const committed = s.swipeX >= rw * 0.5
      s.dragging = false

      if (committed) {
        s.committed = true
        setIsCommitting(true)
        setX(rw * 0.7)
        try { navigator.vibrate?.(25) } catch {}
        setTimeout(() => { try { onCommitRef.current() } catch {} }, 180)
        setTimeout(() => {
          s.animatingBack = true
          setX(0); setIsCommitting(false); setIsPastThreshold(false)
          setTimeout(() => { s.animatingBack = false }, 420)
        }, 420)
      } else {
        s.animatingBack = true
        setX(0); setIsPastThreshold(false)
        setTimeout(() => { s.animatingBack = false }, 420)
      }
    }

    const onCancel = () => reset()

    // NON-passive touchmove so preventDefault() actually blocks scroll
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onCancel, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onCancel)
    }
  }, [enabled, rowRef])

  // Also intercept a "click" that fires right after a committed swipe,
  // so the underlying row's onClick doesn't double-fire the tap behavior.
  const suppressNextClick = (e) => {
    if (stateRef.current.committed) {
      e.stopPropagation(); e.preventDefault()
      stateRef.current.committed = false
    }
  }

  return { swipeX, isCommitting, isPastThreshold, suppressNextClick }
}

function SwipeableRow({ fixture, children, onAnalyze, hasAnalysis, isMobile, showHint }) {
  const rowRef = useRef(null)
  const { swipeX, isCommitting, isPastThreshold, suppressNextClick } =
    useSwipeToAnalyze(() => onAnalyze(fixture), rowRef, !!isMobile)

  // One-time hint animation on first row
  const [hintX, setHintX] = useState(0)
  const [hintActive, setHintActive] = useState(false)
  useEffect(() => {
    if (!isMobile || !showHint) return
    try { if (localStorage.getItem(LS_SWIPE_HINT)) return } catch {}
    const rw = rowRef.current?.getBoundingClientRect().width || 320
    const t1 = setTimeout(() => { setHintActive(true); setHintX(rw * 0.38) }, 1500)
    const t2 = setTimeout(() => { setHintX(0) }, 2400)
    const t3 = setTimeout(() => {
      setHintActive(false)
      try { localStorage.setItem(LS_SWIPE_HINT, '1') } catch {}
    }, 2900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [isMobile, showHint])

  if (!isMobile) {
    return <div ref={rowRef}>{children}</div>
  }

  const effectiveX = swipeX || hintX
  const isActive = effectiveX > 2
  const showRelease = isPastThreshold

  const revealBg = isCommitting
    ? D.accentSoft
    : `linear-gradient(90deg, ${D.accentSoft} 0%, ${D.accent} 100%)`
  const analyzedBg = `linear-gradient(90deg, ${D.surface3} 0%, ${D.surface4} 100%)`

  return (
    <div
      ref={rowRef}
      onClickCapture={suppressNextClick}
      style={{
        position: 'relative', overflow: 'hidden', background: D.surface1,
        touchAction: 'pan-y', // let vertical scroll through, we handle horizontal
      }}
    >
      {/* Accessible fallback: hidden focusable button */}
      <button
        onClick={() => onAnalyze(fixture)}
        aria-label={`Analyze ${fixture.homeTeam} versus ${fixture.awayTeam}`}
        style={{
          position: 'absolute', width: 1, height: 1, padding: 0,
          overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
          border: 0, background: 'transparent',
        }}
      />

      {/* REVEAL PANEL */}
      <div style={{
        position: 'absolute', inset: 0,
        background: hasAnalysis ? analyzedBg : revealBg,
        transition: isCommitting ? 'background 80ms ease-out' : 'background 200ms ease-in',
        display: 'flex', alignItems: 'center', paddingLeft: 20,
        zIndex: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'opacity 150ms, transform 150ms',
        }}>
          {showRelease ? (
            <>
              <Check size={18} color={hasAnalysis ? D.text0 : '#0E0E0E'} />
              <span style={{
                fontSize: 12, fontFamily: D.mono,
                color: hasAnalysis ? D.text0 : '#0E0E0E',
                fontWeight: 700, letterSpacing: '0.06em',
              }}>RELEASE</span>
            </>
          ) : hasAnalysis ? (
            <>
              <ChevronRight size={18} color={D.text0} />
              <span style={{
                fontSize: 12, fontFamily: D.mono,
                color: D.text0, fontWeight: 700, letterSpacing: '0.06em',
              }}>VIEW ANALYSIS</span>
            </>
          ) : (
            <>
              <AnalyzeIcon size={20} color="#0E0E0E" />
              <span style={{
                fontSize: 12, fontFamily: D.mono,
                color: '#0E0E0E', fontWeight: 700, letterSpacing: '0.06em',
              }}>ANALYZE</span>
            </>
          )}
        </div>

        {/* Chevron cluster */}
        <div style={{
          position: 'absolute', right: 16,
          display: 'flex', alignItems: 'center', gap: 3,
          opacity: showRelease ? 0 : isActive ? 0.7 : 0,
          transition: 'opacity 200ms',
        }}>
          {[0.3, 0.6, 1.0].map((o, i) => (
            <svg key={i} width={7} height={10} viewBox="0 0 7 10" fill="none"
              stroke={hasAnalysis ? D.text0 : '#0E0E0E'} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" style={{ opacity: o }}>
              <path d="M1 1l4 4-4 4"/>
            </svg>
          ))}
        </div>
      </div>

      {/* ROW — translates */}
      <div style={{
        position: 'relative', zIndex: 1,
        transform: `translateX(${effectiveX}px)`,
        transition: (swipeX === 0 && !isCommitting && !hintActive)
          ? 'transform 380ms cubic-bezier(0.34,1.56,0.64,1)'
          : isCommitting
          ? 'transform 120ms cubic-bezier(0.4,0,0.2,1)'
          : hintActive && hintX === 0
          ? 'transform 400ms cubic-bezier(0.34,1.56,0.64,1)'
          : hintActive
          ? 'transform 400ms cubic-bezier(0.2,0,0,1)'
          : 'none',
        willChange: 'transform',
        background: D.surface1,
      }}>
        {children}
      </div>
    </div>
  )
}

function FixtureRow({ fixture, analyzed, tracked, onOpen, onToggleTrack }) {
  const isLive = fixture.status === 'LIVE' || fixture.status === 'IN_PLAY'
  const isFinished = fixture.status === 'FINISHED'
  const hasScore = fixture.goalsHome != null && fixture.goalsAway != null

  const StatusIndicator = () => {
    if (isLive) return <span style={{ ...TYPE.dataSm, color: D.accent, letterSpacing: '0.06em' }}>LIVE</span>
    if (isFinished) return <span style={{ ...TYPE.dataSm, color: D.text3 }}>FT</span>
    if (analyzed) return (
      <span style={{
        width: 20, height: 20, borderRadius: '50%', background: D.accent,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <ChevronRight size={12} color="#0E0E0E" />
      </span>
    )
    return <span style={{ color: D.text3, display: 'inline-flex' }}><ChevronRight size={16} /></span>
  }

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(fixture) }
  }
  return (
    <div className="miq-row-hover"
      role="button" tabIndex={0}
      aria-label={`${fixture.homeTeam} versus ${fixture.awayTeam}, ${fixture.competition}, kickoff ${fixture.kickoff}`}
      onClick={() => onOpen(fixture)} onKeyDown={onKey}
      style={{
        display: 'grid',
        gridTemplateColumns: '56px minmax(0, 1fr) 52px',
        alignItems: 'center', gap: 10,
        minHeight: 56, padding: '10px 16px',
        borderBottom: `1px solid ${D.border}`, cursor: 'pointer',
      }}>
      {/* LEFT — 56px fixed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        {fixture.matchDate && (
          <span style={{ fontFamily: D.mono, fontSize: 9, color: D.text3, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {fixture.matchDate}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isLive && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.live, flexShrink: 0 }} />
          )}
          <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 600, color: isLive ? D.live : D.text1 }}>
            {isFinished ? 'FT' : fixture.kickoff}
          </span>
        </div>
      </div>

      {/* CENTER — flex, teams stack on their own line for long names */}
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{
          fontFamily: D.sans, fontSize: 14, fontWeight: 600, color: D.text0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '0 1 auto' }}>
            {fixture.homeTeam}
          </span>
          {isLive && hasScore ? (
            <span style={{ fontFamily: D.mono, fontSize: 12, color: D.accent, fontWeight: 700, flexShrink: 0 }}>
              {fixture.goalsHome}–{fixture.goalsAway}
            </span>
          ) : isFinished && hasScore ? (
            <span style={{ fontFamily: D.mono, fontSize: 12, color: D.text2, fontWeight: 700, flexShrink: 0 }}>
              {fixture.goalsHome}–{fixture.goalsAway}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: D.text3, flexShrink: 0 }}>vs</span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '0 1 auto' }}>
            {fixture.awayTeam}
          </span>
        </div>
      </div>

      {/* RIGHT — 52px fixed, bookmark above status */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6,
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleTrack(fixture.id) }}
          aria-label={tracked ? 'Untrack fixture' : 'Track fixture'}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tracked ? D.accent : D.text3, padding: 0, display: 'inline-flex',
          }}>
          <Bookmark active={tracked} size={14} />
        </button>
        <StatusIndicator />
      </div>
    </div>
  )
}

function GroupedList({ fixtures, analysisCache, tracked, onOpen, onToggleTrack, isMobile, onAnalyze }) {
  const groups = useMemo(() => {
    const m = new Map()
    fixtures.forEach(f => {
      const arr = m.get(f.competition) || []
      arr.push(f)
      m.set(f.competition, arr)
    })
    return Array.from(m.entries())
  }, [fixtures])
  let rowIdx = 0
  return (
    <div>
      {groups.map(([name, list], gi) => (
        <div key={name} style={{ marginTop: gi === 0 ? 0 : 20 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
            padding: '12px 16px 8px', borderBottom: `1px solid ${D.border}`,
          }}>
            <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, letterSpacing: '0.08em' }}>{name}</span>
            <span style={{ ...TYPE.dataSm, color: D.text3 }}>{list.length}</span>
          </div>
          {list.map(f => {
            const isFirst = rowIdx === 0
            rowIdx += 1
            return (
              <SwipeableRow
                key={f.id}
                fixture={f}
                isMobile={!!isMobile}
                hasAnalysis={!!analysisCache[f.id]}
                onAnalyze={onAnalyze || onOpen}
                showHint={isFirst}
              >
                <FixtureRow
                  fixture={f}
                  analyzed={!!analysisCache[f.id]}
                  tracked={tracked.has(f.id)}
                  onOpen={onOpen}
                  onToggleTrack={onToggleTrack}
                />
              </SwipeableRow>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function DevDiagnosticStrip({ loading, fixtures, error, scanCount }) {
  if (!import.meta.env.DEV) return null
  return (
    <div style={{
      fontFamily: D.mono, fontSize: 11,
      color: D.text2, padding: '8px 16px',
      borderBottom: `1px solid ${D.border}`,
    }}>
      loading: {String(loading)} · fixtures: {fixtures} · error: {error || 'none'} · scanCount: {scanCount}
    </div>
  )
}

function TodayContent({
  fixtures, oddsUpdatedAt, analysisCache, tracked, onOpen, onToggleTrack,
  activeFilter, setActiveFilter, refreshTimer, isMobile, onAnalyze,
}) {
  const [activeComp, setActiveComp] = useState('all')
  const analyzedCount = Object.keys(analysisCache).length
  const liveCount = fixtures.filter(f => f.status === 'LIVE' || f.status === 'IN_PLAY').length

  const highConviction = useMemo(
    () => fixtures.filter(f => {
      const a = analysisCache[f.id]
      if (!a) return false
      return a.recommendation.confidence >= 0.65 && a.recommendation.value_edge >= 5
    }),
    [fixtures, analysisCache]
  )

  const competitionOptions = useMemo(() => {
    const m = new Map()
    fixtures.forEach(f => {
      if (!m.has(f.competitionCode || f.competition)) {
        m.set(f.competitionCode || f.competition, { code: f.competitionCode || f.competition, name: f.competition })
      }
    })
    return Array.from(m.values())
  }, [fixtures])

  const filtered = useMemo(() => {
    let list = fixtures
    if (activeComp !== 'all') list = list.filter(f => (f.competitionCode || f.competition) === activeComp)
    if (activeFilter === 'live')     return list.filter(f => f.status === 'LIVE' || f.status === 'IN_PLAY')
    if (activeFilter === 'upcoming') return list.filter(f => f.status === 'SCHEDULED' || f.status === 'TIMED')
    if (activeFilter === 'analysed') return list.filter(f => analysisCache[f.id])
    return list
  }, [activeFilter, activeComp, fixtures, analysisCache])

  return (
    <div style={{ padding: 16 }}>
      <IntelligenceSummary
        scanCount={fixtures.length}
        competitionsCount={competitionOptions.length}
        competitionOptions={competitionOptions}
        analyzedCount={analyzedCount}
        highConvictionCount={highConviction.length}
        liveCount={liveCount}
        refreshTimer={refreshTimer}
        activeComp={activeComp}
        setActiveComp={setActiveComp}
      />

      {highConviction.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>HIGH CONVICTION PICKS</span>
            <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3 }}>
              {highConviction.length} {highConviction.length === 1 ? 'pick' : 'picks'}
            </span>
          </div>
          {highConviction.map(f => (
            <PickCard key={f.id} fixture={f} analysis={analysisCache[f.id]} onOpen={onOpen} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, marginBottom: 12 }}>
        <SegmentedControl
          options={[
            { key: 'all',      label: 'All' },
            { key: 'live',     label: 'Live' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'analysed', label: 'Analysed' },
          ]}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="fixtures"
          title="No fixtures in this view"
          hint="Try a different filter, or check back closer to matchday."
        />
      ) : (
        <div style={{
          background: D.surface1, border: `1px solid ${D.border}`,
          borderRadius: RADIUS.lg, overflow: 'hidden',
        }}>
          <GroupedList
            fixtures={filtered}
            analysisCache={analysisCache}
            tracked={tracked}
            onOpen={onOpen}
            onToggleTrack={onToggleTrack}
            isMobile={isMobile}
            onAnalyze={onAnalyze}
          />
        </div>
      )}

      {filtered.length > 0 && filtered.length < fixtures.length && (
        <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3, textAlign: 'center', padding: '16px 0 8px' }}>
          Showing {filtered.length} of {fixtures.length}
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * Picks / Tracking / Accuracy content
 * ============================================================ */

function HowItWorksStep({ n, title, desc }) {
  return (
    <div style={{
      background: D.surface1, border: `1px solid ${D.borderMd}`,
      borderRadius: RADIUS.lg, padding: 16, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 24, height: 24, borderRadius: '50%',
        background: D.accent, color: D.surface0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontFamily: D.mono, fontSize: 12,
      }}>{n}</div>
      <div style={{ ...TYPE.body, color: D.text0, fontWeight: 700, paddingRight: 32 }}>{title}</div>
      <div style={{ ...TYPE.caption, color: D.text1, marginTop: 6 }}>{desc}</div>
    </div>
  )
}

function ParlayBuilder({ selections, entries, onRemove, onClear }) {
  if (!selections.length) return null

  const chosen = selections.map(id => entries.find(e => String(e.id) === String(id))).filter(Boolean)
  const allHaveOdds = chosen.every(e => {
    const pick = e.a.recommendation?.pick
    const o = e.fx?.odds
    return pick && o && (pick === 'home_win' ? o.home : pick === 'away_win' ? o.away : o.draw)
  })
  const combinedOdds = allHaveOdds
    ? chosen.reduce((acc, e) => {
        const pick = e.a.recommendation?.pick
        const o = e.fx.odds
        const dec = pick === 'home_win' ? o.home : pick === 'away_win' ? o.away : o.draw
        return acc * parseFloat(dec)
      }, 1)
    : null
  const combinedProb = chosen.reduce((acc, e) => acc * (e.a.recommendation?.model_probability || 0), 1)

  const teamMap = {}
  const matchIds = new Set()
  const warnings = []
  chosen.forEach(e => {
    if (!e.fx) return
    if (matchIds.has(e.fx.id)) warnings.push(`Multiple selections from the same match (${e.fx.homeTeam} vs ${e.fx.awayTeam})`)
    matchIds.add(e.fx.id)
    ;[e.fx.homeTeam, e.fx.awayTeam].forEach(t => {
      if (!t) return
      if (teamMap[t]) warnings.push(`${t} appears in multiple picks`)
      teamMap[t] = true
    })
  })

  let kellyPct = null
  if (combinedOdds && combinedProb > 0 && warnings.length === 0) {
    const b = combinedOdds - 1
    const p = combinedProb
    const q = 1 - p
    const k = b > 0 ? (b * p - q) / b : 0
    if (k > 0) kellyPct = (k * 50).toFixed(1)
  }

  return (
    <div style={{
      position: 'sticky', bottom: 76, marginTop: 20,
      background: D.surface1, border: `1px solid ${D.borderMd}`,
      borderLeft: `4px solid ${D.accent}`,
      borderRadius: RADIUS.lg, padding: 16,
      boxShadow: D.shadowLg,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...TYPE.body, color: D.text0, fontWeight: 700 }}>
          Parlay · {selections.length} {selections.length === 1 ? 'pick' : 'picks'} selected
        </div>
        <button onClick={onClear} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          ...TYPE.caption, color: D.text2,
        }}>Clear all</button>
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {chosen.map(e => {
          if (!e.fx) return null
          const pick = e.a.recommendation.pick
          const label = ({ home_win: e.fx.homeTeam, draw: 'Draw', away_win: e.fx.awayTeam })[pick] || pick
          return (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 10px', background: D.surface2, borderRadius: RADIUS.sm,
            }}>
              <span style={{ ...TYPE.caption, color: D.text1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.fx.homeTeam} vs {e.fx.awayTeam}
                <span style={{ color: D.text3 }}> → </span>
                <span style={{ color: D.text0, fontWeight: 700 }}>{label}</span>
              </span>
              <button onClick={() => onRemove(e.id)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: D.text2, padding: 4, display: 'inline-flex', flexShrink: 0,
              }} aria-label="Remove from parlay"><X size={14} /></button>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
      }}>
        <div>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>COMBINED ODDS</div>
          <div style={{ fontFamily: D.mono, fontSize: 20, fontWeight: 700, color: D.text0, marginTop: 4 }}>
            {combinedOdds ? combinedOdds.toFixed(2) : '—'}
          </div>
        </div>
        <div>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>MODEL PROB</div>
          <div style={{ fontFamily: D.mono, fontSize: 20, fontWeight: 700, color: D.text1, marginTop: 4 }}>
            {(combinedProb * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div style={{
          marginTop: 12, padding: 10,
          border: `1px solid ${D.danger}`, borderRadius: RADIUS.sm,
        }}>
          <div style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.danger, fontWeight: 700 }}>
            CORRELATED SELECTIONS
          </div>
          {[...new Set(warnings)].map((w, i) => (
            <div key={i} style={{ ...TYPE.caption, color: D.text1, marginTop: 4 }}>{w}</div>
          ))}
          <div style={{ ...TYPE.caption, color: D.text2, marginTop: 6 }}>
            Combined probability is overstated. These picks are not independent.
          </div>
        </div>
      ) : kellyPct != null ? (
        <div style={{
          marginTop: 12, padding: 10,
          background: D.accentBg, border: `1px solid ${D.accentBorder}`,
          borderRadius: RADIUS.sm,
        }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>PARLAY HALF KELLY</div>
          <div style={{ fontFamily: D.mono, fontSize: 18, fontWeight: 700, color: D.accent, marginTop: 4 }}>
            {kellyPct}% of bankroll
          </div>
        </div>
      ) : (
        <div style={{ ...TYPE.caption, color: D.text2, marginTop: 12 }}>
          Add more picks with odds to compute Kelly stake.
        </div>
      )}
    </div>
  )
}

function PicksContent({ fixtures, analysisCache, onOpen, parlaySelections, onToggleParlay, onClearParlay }) {
  const allAnalyzed = useMemo(
    () => Object.entries(analysisCache)
      .map(([id, a]) => {
        const fx = fixtures.find(f => String(f.id) === String(id))
        return { id: fx?.id ?? id, fx, a }
      })
      .filter(e => e.fx)
      .sort((x, y) => (y.a._ts || 0) - (x.a._ts || 0)),
    [fixtures, analysisCache]
  )

  const withConf = allAnalyzed.map(e => ({
    ...e,
    conf: e.a.recommendation?.confidence || 0,
    edge: e.a.recommendation?.value_edge || 0,
  }))
  const highTier = withConf.filter(e => e.conf >= 0.75)
  const medTier = withConf.filter(e => e.conf >= 0.65 && e.conf < 0.75)
  const belowTier = withConf.filter(e => e.conf < 0.65)
  const hasAny = allAnalyzed.length > 0
  const highConviction = highTier.length + medTier.length

  const avgConf = withConf.length ? Math.round(withConf.reduce((s, e) => s + e.conf, 0) / withConf.length * 100) : null
  const avgEdge = withConf.length ? (withConf.reduce((s, e) => s + e.edge, 0) / withConf.length) : null

  if (!hasAny) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>HOW IT WORKS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <HowItWorksStep n={1} title="Select a Fixture"
            desc="Open the Today tab and tap any match. MatchIQ pulls form, standings, head-to-head, and live market odds automatically." />
          <HowItWorksStep n={2} title="AI Agents Analyse"
            desc="Three specialised agents — form, tactical, and market — reason about the fixture in parallel. A synthesis pass reconciles their disagreements into a single recommendation." />
          <HowItWorksStep n={3} title="Pick Appears Here"
            desc="High-conviction analyses (confidence ≥ 65% with positive market edge) surface on this screen with Kelly stake sizing, ready to track." />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, paddingBottom: 96 }}>
      {highTier.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>HIGH CONFIDENCE</span>
            <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3 }}>≥ 75%</span>
          </div>
          {highTier.map(e => (
            <PickCard key={e.id} fixture={e.fx} analysis={e.a} onOpen={onOpen}
              parlayActive={parlaySelections.includes(e.id)} onToggleParlay={onToggleParlay} />
          ))}
        </>
      )}

      {medTier.length > 0 && (
        <div style={{ marginTop: highTier.length ? 20 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>MEDIUM-HIGH CONFIDENCE</span>
            <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3 }}>65 – 75%</span>
          </div>
          {medTier.map(e => (
            <PickCard key={e.id} fixture={e.fx} analysis={e.a} onOpen={onOpen}
              parlayActive={parlaySelections.includes(e.id)} onToggleParlay={onToggleParlay} />
          ))}
        </div>
      )}

      {highConviction === 0 && belowTier.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.warning }}>BELOW THRESHOLD</span>
            <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3 }}>&lt; 65%</span>
          </div>
          {belowTier.map(e => (
            <PickCard key={e.id} fixture={e.fx} analysis={e.a} onOpen={onOpen}
              parlayActive={parlaySelections.includes(e.id)} onToggleParlay={onToggleParlay} />
          ))}
        </div>
      )}

      <div style={{
        marginTop: 24, background: D.surface1, border: `1px solid ${D.border}`,
        borderRadius: RADIUS.md, padding: '14px 16px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12,
      }}>
        {[
          { l: 'TOTAL ANALYSED', v: allAnalyzed.length },
          { l: 'HIGH CONVICTION', v: highConviction },
          { l: 'AVG CONFIDENCE', v: avgConf == null ? '--' : `${avgConf}%` },
          { l: 'AVG VALUE EDGE', v: avgEdge == null ? '--' : `${avgEdge >= 0 ? '+' : ''}${avgEdge.toFixed(1)}%` },
        ].map(s => (
          <div key={s.l}>
            <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>{s.l}</div>
            <div style={{ fontFamily: D.mono, fontSize: 18, fontWeight: 700, color: D.text0, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <ParlayBuilder
        selections={parlaySelections}
        entries={allAnalyzed}
        onRemove={onToggleParlay}
        onClear={onClearParlay}
      />
    </div>
  )
}

function CountdownLine({ kickoffDate }) {
  const [_, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force(x => x + 1), 60000)
    return () => clearInterval(id)
  }, [])
  const diff = new Date(kickoffDate).getTime() - Date.now()
  if (diff <= 0) return null
  const totalMin = Math.floor(diff / 60000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin - days * 60 * 24) / 60)
  const mins = totalMin - days * 60 * 24 - hours * 60
  const parts = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return (
    <div style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text2 }}>
      Kicks off in {parts}
    </div>
  )
}

function TrackingFixtureCard({ fixture, analysis, onOpen, onToggleTrack, onResolve, section }) {
  const isLive = section === 'live'
  const isFinished = section === 'completed'
  const home = fixture.goalsHome
  const away = fixture.goalsAway
  const hasScore = home != null && away != null

  return (
    <div className="miq-row-hover" style={{
      background: D.surface1, border: `1px solid ${D.border}`,
      borderRadius: RADIUS.md, padding: 12, marginBottom: 10, cursor: 'pointer',
    }} onClick={() => onOpen(fixture)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 64, textAlign: 'left' }}>
          <div style={{ ...TYPE.dataSm, fontFamily: D.mono, color: isLive ? D.live : D.text2 }}>
            {isLive ? 'LIVE' : isFinished ? 'FT' : fixture.kickoff}
          </div>
          <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3 }}>
            {fixture.matchDate || 'Today'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...TYPE.body, color: D.text0, fontWeight: 600 }}>
            {fixture.homeTeam}
            {hasScore ? (
              <span style={{ margin: '0 8px', color: isFinished ? D.text0 : D.accent, fontWeight: 700 }}>
                {home} – {away}
              </span>
            ) : (
              <span style={{ color: D.text3, margin: '0 6px' }}>vs</span>
            )}
            {fixture.awayTeam}
          </div>
          <div style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3, marginTop: 4 }}>
            {fixture.competition}
          </div>
          {section === 'upcoming' && <div style={{ marginTop: 4 }}><CountdownLine kickoffDate={fixture.kickoffDate} /></div>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleTrack(fixture.id) }}
          aria-label="Untrack"
          style={{ background: 'transparent', border: 'none', color: D.accent, cursor: 'pointer', padding: 4 }}
        ><Bookmark active /></button>
      </div>

      {analysis && (
        <div style={{
          marginTop: 10,
          background: D.accentBg, borderLeft: `2px solid ${D.accent}`,
          borderRadius: RADIUS.sm, padding: '8px 12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span style={{ ...TYPE.caption, color: D.text0, fontWeight: 700 }}>
              Pick: {({ home_win: fixture.homeTeam, draw: 'Draw', away_win: fixture.awayTeam })[analysis.recommendation.pick]}
            </span>
            <span style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text2 }}>
              {Math.round((analysis.recommendation.confidence || 0) * 100)}%
            </span>
            {analysis.recommendation.value_edge > 0 && (
              <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.accent, fontWeight: 700 }}>
                +{analysis.recommendation.value_edge}%
              </span>
            )}
          </div>
        </div>
      )}

      {isFinished && analysis && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          {analysis.resolved ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              ...TYPE.dataSm, fontFamily: D.mono, fontWeight: 700,
              color: analysis.correct ? D.accent : D.danger,
            }}>
              {analysis.correct ? <Check size={12} /> : <XCircle size={12} />}
              {analysis.autoResolved ? 'Auto ' : ''}{analysis.correct ? 'Correct' : 'Incorrect'}
            </span>
          ) : onResolve ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onResolve(fixture.id, true) }} style={{
                background: D.accent, color: D.surface0, border: 'none',
                borderRadius: RADIUS.sm, padding: '4px 10px',
                ...TYPE.dataSm, fontWeight: 700, cursor: 'pointer',
              }}>Mark Correct</button>
              <button onClick={(e) => { e.stopPropagation(); onResolve(fixture.id, false) }} style={{
                background: 'transparent', color: D.danger, border: `1px solid ${D.danger}`,
                borderRadius: RADIUS.sm, padding: '4px 10px',
                ...TYPE.dataSm, fontWeight: 700, cursor: 'pointer',
              }}>Mark Incorrect</button>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

function TrackingContent({ fixtures, tracked, analysisCache, onOpen, onToggleTrack, onSwitchTab, onResolve }) {
  const list = useMemo(() => fixtures.filter(f => tracked.has(f.id)), [fixtures, tracked])

  const live = list.filter(f => f.status === 'IN_PLAY' || f.status === 'LIVE')
  const upcoming = list.filter(f => f.status === 'SCHEDULED' || f.status === 'TIMED')
  const completed = list.filter(f => f.status === 'FINISHED')

  if (list.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <EmptyState
          variant="tracking"
          title="Nothing tracked"
          hint="Bookmark any fixture from the list to follow it here."
          action={
            <button onClick={() => onSwitchTab('today')} style={{
              marginTop: 12, background: D.accent, color: D.surface0, border: 'none',
              borderRadius: RADIUS.sm, padding: '8px 16px',
              ...TYPE.body, fontWeight: 700, cursor: 'pointer',
            }}>Browse Today's Fixtures</button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>TRACKING</span>
        <span style={{ ...TYPE.caption, color: D.text2 }}>
          {list.length} {list.length === 1 ? 'fixture' : 'fixtures'} monitored
        </span>
      </div>

      {live.length > 0 && (
        <div style={{
          background: `color-mix(in oklab, ${D.live} 10%, transparent)`,
          border: `1px solid color-mix(in oklab, ${D.live} 32%, transparent)`,
          borderRadius: RADIUS.lg, padding: '12px 12px 2px', marginBottom: 16,
        }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.live, marginBottom: 10 }}>LIVE NOW</div>
          {live.map(f => (
            <TrackingFixtureCard key={f.id} fixture={f} analysis={analysisCache[f.id]}
              onOpen={onOpen} onToggleTrack={onToggleTrack} section="live" />
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, marginBottom: 10 }}>UPCOMING</div>
          {upcoming.map(f => (
            <TrackingFixtureCard key={f.id} fixture={f} analysis={analysisCache[f.id]}
              onOpen={onOpen} onToggleTrack={onToggleTrack} section="upcoming" />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, marginBottom: 10 }}>COMPLETED</div>
          {completed.map(f => (
            <TrackingFixtureCard key={f.id} fixture={f} analysis={analysisCache[f.id]}
              onOpen={onOpen} onToggleTrack={onToggleTrack} onResolve={onResolve} section="completed" />
          ))}
        </div>
      )}
    </div>
  )
}

function ResearchContent({ fixtures, analysisCache, standingsCache, scorersCache, compDetailsCache, agentPerf }) {
  const [expanded, setExpanded] = useState({})

  const compKeys = useMemo(() => {
    const keys = new Set()
    fixtures.forEach(f => { if (f.competitionCode) keys.add(f.competitionCode) })
    return Array.from(keys)
  }, [fixtures])

  const compData = compKeys.map(code => ({
    code,
    name: compDetailsCache[code]?.name || fixtures.find(f => f.competitionCode === code)?.competition || code,
    fixtureCount: fixtures.filter(f => f.competitionCode === code).length,
    standings: standingsCache[code]?.[0]?.table || [],
    scorers: scorersCache[code] || [],
  })).filter(c => c.standings.length > 0 || c.scorers.length > 0)

  // Value edge distribution
  const edges = Object.values(analysisCache).map(a => a.recommendation?.value_edge || 0).filter(e => e > 0)
  const buckets = [
    { key: '0-5%', min: 0, max: 5 },
    { key: '5-10%', min: 5, max: 10 },
    { key: '10-15%', min: 10, max: 15 },
    { key: '15%+', min: 15, max: 999 },
  ]
  const bucketCounts = buckets.map(b => ({ ...b, count: edges.filter(e => e >= b.min && e < b.max).length }))
  const maxCount = Math.max(1, ...bucketCounts.map(b => b.count))
  const avgEdge = edges.length ? (edges.reduce((s, e) => s + e, 0) / edges.length).toFixed(1) : null

  // Agent perf
  const agentRows = [
    { key: 'form', label: 'Form Agent', sub: 'Recent form, momentum, season stats' },
    { key: 'tactical', label: 'Tactical Agent', sub: 'Head-to-head, matchup dynamics' },
    { key: 'market', label: 'Market Agent', sub: 'Odds movement, value edge signal' },
  ]

  const totalAnalyses = Object.keys(analysisCache).length

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>RESEARCH</div>
      <div style={{ ...TYPE.caption, color: D.text2, marginTop: 4 }}>
        Deep intelligence across competitions
      </div>

      {/* Competition intelligence */}
      <div style={{ marginTop: 20 }}>
        <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, marginBottom: 10 }}>
          COMPETITION INTELLIGENCE
        </div>
        {compData.length === 0 && (
          <div style={{
            background: D.surface1, border: `1px solid ${D.border}`,
            borderRadius: RADIUS.md, padding: 16, ...TYPE.caption, color: D.text2,
          }}>
            Standings and top-scorer data loads in the background as fixtures come in.
            Free-tier football-data.org limits coverage to a subset of competitions.
          </div>
        )}
        {compData.map((c, i) => {
          const isOpen = expanded[c.code] ?? (i < 3)
          return (
            <div key={c.code} style={{
              background: D.surface1, border: `1px solid ${D.borderMd}`,
              borderRadius: RADIUS.lg, marginBottom: 12, overflow: 'hidden',
            }}>
              <div
                onClick={() => setExpanded(x => ({ ...x, [c.code]: !isOpen }))}
                style={{
                  padding: 16, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <div>
                  <div style={{ ...TYPE.body, color: D.text0, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ ...TYPE.caption, color: D.text2, marginTop: 2 }}>
                    {c.fixtureCount} {c.fixtureCount === 1 ? 'fixture' : 'fixtures'} tracked
                  </div>
                </div>
                <span style={{ color: D.text2 }}>{isOpen ? '▾' : '▸'}</span>
              </div>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${D.border}`, padding: 12 }}>
                  {c.standings.length > 0 && (
                    <>
                      <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, marginBottom: 8 }}>TOP 5</div>
                      {c.standings.slice(0, 5).map(row => (
                        <div key={row.team?.id} style={{
                          display: 'grid',
                          gridTemplateColumns: '24px 1fr 40px 40px',
                          gap: 8, alignItems: 'center',
                          padding: '6px 0', borderBottom: `1px solid ${D.border}`,
                        }}>
                          <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text2 }}>{row.position}</span>
                          <span style={{ ...TYPE.caption, color: D.text0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.team?.shortName || row.team?.name}
                          </span>
                          <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text1, textAlign: 'right' }}>{row.playedGames}</span>
                          <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text0, fontWeight: 700, textAlign: 'right' }}>{row.points}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {c.scorers.length > 0 && (
                    <>
                      <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, margin: '12px 0 6px' }}>TOP SCORERS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {c.scorers.slice(0, 3).map((s, si) => (
                          <div key={si} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10,
                            padding: '4px 0',
                          }}>
                            <span style={{
                              ...TYPE.caption, color: D.text0, minWidth: 0,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {s.player?.name}
                              <span style={{ color: D.text3, marginLeft: 6 }}>
                                {s.team?.shortName || s.team?.name}
                              </span>
                            </span>
                            <span style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 700, color: D.accent, flexShrink: 0 }}>
                              {s.goals || 0}g
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Agent performance */}
      <div style={{ marginTop: 24 }}>
        <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>AGENT PERFORMANCE</div>
        <div style={{ ...TYPE.caption, color: D.text2, marginTop: 4, marginBottom: 10 }}>
          How each agent has performed across all resolved matches
        </div>
        <div style={{
          background: D.surface1, border: `1px solid ${D.border}`,
          borderRadius: RADIUS.md, overflow: 'hidden',
        }}>
          {agentRows.map((row, i) => {
            const stats = agentPerf[row.key] || { correct: 0, total: 0 }
            const rate = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : null
            const color = rate == null ? D.text3 : rate >= 70 ? D.accent : rate >= 50 ? D.warning : D.danger
            return (
              <div key={row.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: i < agentRows.length - 1 ? `1px solid ${D.border}` : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...TYPE.body, color: D.text0, fontWeight: 600 }}>{row.label}</div>
                  <div style={{ ...TYPE.caption, color: D.text2 }}>{row.sub}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...TYPE.data, fontFamily: D.mono, color, fontWeight: 700 }}>
                    {rate == null ? '--' : `${rate}%`}
                  </div>
                  <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3 }}>
                    {stats.correct}/{stats.total} agreement
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {totalAnalyses < 5 && (
          <div style={{ ...TYPE.caption, color: D.text3, marginTop: 8 }}>
            Data improves with more analyses.
          </div>
        )}
      </div>

      {/* Value edge distribution */}
      <div style={{ marginTop: 24 }}>
        <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, marginBottom: 10 }}>
          VALUE EDGE DISTRIBUTION
        </div>
        <div style={{
          background: D.surface1, border: `1px solid ${D.border}`,
          borderRadius: RADIUS.md, padding: 14,
        }}>
          {bucketCounts.map(b => (
            <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
              <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text2, width: 56 }}>{b.key}</span>
              <div style={{ flex: 1, height: 8, background: D.surface2, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                <div style={{ width: `${(b.count / maxCount) * 100}%`, height: '100%', background: D.accent, transition: 'width 400ms ease' }} />
              </div>
              <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text0, fontWeight: 700, width: 30, textAlign: 'right' }}>{b.count}</span>
            </div>
          ))}
          <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text2, marginTop: 10 }}>
            Average value edge: {avgEdge == null ? '--' : `+${avgEdge}%`}
          </div>
        </div>
      </div>
    </div>
  )
}

function AccuracyStatCard({ label, value, sub, tone = 'default' }) {
  const valColor = tone === 'positive' ? D.accent : tone === 'negative' ? D.danger : D.text0
  return (
    <div style={{
      background: D.surface1, border: `1px solid ${D.border}`,
      borderRadius: RADIUS.md, padding: 14,
    }}>
      <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>{label}</div>
      <div style={{ fontFamily: D.mono, fontSize: 22, fontWeight: 800, color: valColor, lineHeight: 1, marginTop: 8 }}>
        {value}
      </div>
      {sub && <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text2, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ResultDot({ correct, size = 14 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: correct ? D.accent : D.danger,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: D.surface0, fontFamily: D.mono, fontSize: 8, fontWeight: 800,
      flexShrink: 0,
    }}>{correct ? 'W' : 'L'}</span>
  )
}

function PendingDot({ size = 14 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: 'transparent', border: `1.5px dashed ${D.text3}`,
      flexShrink: 0,
    }} />
  )
}

function CalibrationBar({ bucket }) {
  const midPred = Math.round(((bucket.min + Math.min(bucket.max, 1)) / 2) * 100)
  const actual = bucket.rate ?? 0
  const hasData = bucket.rate != null
  const diff = bucket.diff
  const diffColor = diff == null ? D.text3 : diff >= 0 ? D.accent : D.danger
  return (
    <div style={{ padding: '10px 12px', borderBottom: `1px solid ${D.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>{bucket.key}%</span>
          <span style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3 }}>{bucket.picks} picks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ ...TYPE.data, fontFamily: D.mono, color: D.text0, fontWeight: 700 }}>
            {hasData ? `${actual}%` : '--'}
          </span>
          {diff != null && (
            <span style={{
              ...TYPE.dataSm, fontFamily: D.mono, color: diffColor,
              padding: '2px 6px', borderRadius: RADIUS.sm,
              background: diff >= 0 ? D.accentBg : 'transparent',
              border: diff >= 0 ? `1px solid ${D.accentBorder}` : `1px solid ${D.danger}`,
            }}>{diff >= 0 ? '+' : ''}{diff}</span>
          )}
        </div>
      </div>
      <div style={{ position: 'relative', height: 8, background: D.surface2, borderRadius: RADIUS.full, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, actual))}%`, height: '100%',
          background: hasData ? D.accent : D.surface3,
          borderRadius: RADIUS.full, transition: 'width 400ms ease',
        }} />
        <div style={{
          position: 'absolute', left: `${midPred}%`, top: -2, width: 2, height: 12,
          background: D.text2, transform: 'translateX(-1px)',
        }} title={`Predicted midpoint ${midPred}%`} />
      </div>
    </div>
  )
}

function TeamCrest({ src, size = 20 }) {
  if (!src) return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: D.surface3, flexShrink: 0,
    }} />
  )
  return (
    <img src={src} alt="" style={{
      width: size, height: size, borderRadius: '50%',
      objectFit: 'contain', background: D.surface2, flexShrink: 0,
    }} />
  )
}

function AccuracyContent({ fixtures, analysisCache, onResolve }) {
  const [openResolve, setOpenResolve] = useState(null)

  const entries = useMemo(() => {
    return Object.entries(analysisCache)
      .map(([id, a]) => {
        const fx = fixtures.find(f => String(f.id) === String(id))
        return { id, a, fx }
      })
      .sort((x, y) => (y.a._ts || 0) - (x.a._ts || 0))
  }, [fixtures, analysisCache])

  const resolved = entries.filter(e => e.a.resolved)
  const correctCount = resolved.filter(e => e.a.correct).length
  const winRate = resolved.length >= 3 ? Math.round((correctCount / resolved.length) * 100) : null
  const avgConf = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + (e.a.recommendation?.confidence || 0), 0) / entries.length * 100)
    : null

  // Calibration buckets
  const buckets = [
    { key: '50-60', min: 0.50, max: 0.60 },
    { key: '60-70', min: 0.60, max: 0.70 },
    { key: '70-80', min: 0.70, max: 0.80 },
    { key: '80+',   min: 0.80, max: 1.01 },
  ]
  const bucketStats = buckets.map(b => {
    const picks = resolved.filter(e => {
      const c = e.a.recommendation?.confidence || 0
      return c >= b.min && c < b.max
    })
    const correct = picks.filter(e => e.a.correct).length
    const rate = picks.length > 0 ? Math.round((correct / picks.length) * 100) : null
    const midPred = Math.round(((b.min + Math.min(b.max, 1)) / 2) * 100)
    return { ...b, picks: picks.length, rate, diff: rate == null ? null : rate - midPred }
  })

  // Last 10 resolved chronologically (oldest → newest for form reading)
  const last10Resolved = [...resolved].reverse().slice(-10)
  const prior10Resolved = [...resolved].reverse().slice(-20, -10)
  const rate = (arr) => arr.length ? Math.round(arr.filter(e => e.a.correct).length / arr.length * 100) : null
  const currentRate = rate(last10Resolved)
  const priorRate = rate(prior10Resolved)
  const trend = currentRate != null && priorRate != null ? currentRate - priorRate : null

  // Streak (from most recent backward)
  const chronoDesc = [...resolved].sort((a, b) => (b.a.resolvedAt || 0) - (a.a.resolvedAt || 0))
  let streakCount = 0
  let streakCorrect = null
  for (const e of chronoDesc) {
    if (streakCorrect == null) { streakCorrect = e.a.correct; streakCount = 1; continue }
    if (e.a.correct === streakCorrect) streakCount++
    else break
  }

  // Confidence tier distribution
  const tiers = [
    { key: 'HIGH', min: 0.75, color: D.accent },
    { key: 'MED-HIGH', min: 0.65, max: 0.75, color: D.info },
    { key: 'MEDIUM', min: 0.50, max: 0.65, color: D.warning },
    { key: 'LOW', min: 0, max: 0.50, color: D.text3 },
  ]
  const tierCounts = tiers.map(t => ({
    ...t,
    count: entries.filter(e => {
      const c = e.a.recommendation?.confidence || 0
      const min = t.min, max = t.max ?? 1.01
      return c >= min && c < max
    }).length,
  }))
  const tierTotal = tierCounts.reduce((s, t) => s + t.count, 0) || 1

  // Outcome breakdown
  const outcomeCorrect = resolved.filter(e => e.a.correct).length
  const outcomeWrong = resolved.length - outcomeCorrect
  const outcomePending = entries.length - resolved.length
  const outcomeTotal = entries.length || 1

  // Edge stats
  const edges = entries.map(e => e.a.recommendation?.value_edge || 0)
  const avgEdge = edges.length ? (edges.reduce((s, x) => s + x, 0) / edges.length) : 0

  // Per-competition (top 3 / bottom 3 by rate, min 2 resolved)
  const compMap = {}
  for (const e of resolved) {
    const code = e.fx?.competitionCode || e.a.competitionCode || 'UNK'
    const name = e.fx?.competition || code
    if (!compMap[code]) compMap[code] = { code, name, correct: 0, total: 0 }
    compMap[code].total++
    if (e.a.correct) compMap[code].correct++
  }
  const compRows = Object.values(compMap)
    .filter(c => c.total >= 2)
    .map(c => ({ ...c, rate: Math.round(c.correct / c.total * 100) }))
  const compTop = [...compRows].sort((a, b) => b.rate - a.rate).slice(0, 3)
  const compBottom = [...compRows].sort((a, b) => a.rate - b.rate).slice(0, 3)

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      {/* HERO BAND */}
      <div style={{
        background: D.surface1, border: `1px solid ${D.border}`,
        borderTop: `2px solid ${D.accent}`,
        borderRadius: RADIUS.lg, padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>ACCURACY REPORT</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
              <div style={{
                fontFamily: D.mono, fontSize: 44, fontWeight: 800,
                color: winRate == null ? D.text3 : winRate >= 60 ? D.accent : winRate >= 50 ? D.warning : D.danger,
                lineHeight: 1,
              }}>
                {winRate == null ? '--' : `${winRate}%`}
              </div>
              <div style={{ ...TYPE.caption, color: D.text2 }}>
                win rate<br />
                <span style={{ fontFamily: D.mono, color: D.text3 }}>
                  {resolved.length} of {entries.length} resolved
                </span>
              </div>
            </div>
            {trend != null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
                padding: '4px 10px', borderRadius: RADIUS.full,
                background: trend >= 0 ? D.accentBg : 'transparent',
                border: `1px solid ${trend >= 0 ? D.accentBorder : D.danger}`,
                ...TYPE.dataSm, fontFamily: D.mono,
                color: trend >= 0 ? D.accent : D.danger,
              }}>
                <span>{trend >= 0 ? '▲' : '▼'}</span>
                {trend >= 0 ? '+' : ''}{trend} pts vs prior 10
              </div>
            )}
          </div>

          {streakCorrect != null && (
            <div style={{
              padding: '10px 14px', borderRadius: RADIUS.md,
              background: streakCorrect ? D.accentBg : D.surface2,
              border: `1px solid ${streakCorrect ? D.accentBorder : D.borderMd}`,
              textAlign: 'right', minWidth: 130,
            }}>
              <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>CURRENT STREAK</div>
              <div style={{
                fontFamily: D.mono, fontSize: 22, fontWeight: 800,
                color: streakCorrect ? D.accent : D.danger, marginTop: 6, lineHeight: 1,
              }}>
                {streakCount}{streakCorrect ? 'W' : 'L'}
              </div>
              <div style={{ ...TYPE.caption, color: D.text2, marginTop: 4 }}>
                {streakCorrect ? 'winning' : 'cold'} streak
              </div>
            </div>
          )}
        </div>

        {/* Form strip — last 10 resolved */}
        {last10Resolved.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${D.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>LAST 10 · OLDEST → NEWEST</span>
              <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text2 }}>
                {last10Resolved.filter(e => e.a.correct).length}W · {last10Resolved.filter(e => !e.a.correct).length}L
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {last10Resolved.map((e, i) => (
                <ResultDot key={i} correct={e.a.correct} />
              ))}
              {Array.from({ length: Math.max(0, 10 - last10Resolved.length) }).map((_, i) => (
                <PendingDot key={`p${i}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI ROW — 4 tight cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10,
      }}>
        <AccuracyStatCard label="ANALYSES" value={entries.length}
          sub={entries.length === 0 ? 'none yet' : `${resolved.length} resolved`} />
        <AccuracyStatCard label="AVG CONFIDENCE"
          value={avgConf == null ? '--' : `${avgConf}%`}
          sub={entries.length > 0 ? `across ${entries.length}` : '--'} />
        <AccuracyStatCard label="AVG VALUE EDGE"
          value={edges.length ? `${avgEdge >= 0 ? '+' : ''}${avgEdge.toFixed(1)}%` : '--'}
          sub="model vs market"
          tone={avgEdge > 0 ? 'positive' : avgEdge < 0 ? 'negative' : 'default'} />
        <AccuracyStatCard label="RESOLUTION RATE"
          value={entries.length ? `${Math.round(resolved.length / entries.length * 100)}%` : '--'}
          sub={`${outcomePending} pending`} />
      </div>

      {/* OUTCOME BREAKDOWN — split bar */}
      {entries.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>OUTCOMES</span>
            <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3 }}>{entries.length} total</span>
          </div>
          <div style={{
            display: 'flex', height: 32, borderRadius: RADIUS.md, overflow: 'hidden',
            border: `1px solid ${D.border}`, background: D.surface2,
          }}>
            {outcomeCorrect > 0 && (
              <div style={{
                width: `${outcomeCorrect / outcomeTotal * 100}%`,
                background: D.accent, color: D.surface0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...TYPE.dataSm, fontFamily: D.mono, fontWeight: 700,
              }}>{outcomeCorrect}</div>
            )}
            {outcomeWrong > 0 && (
              <div style={{
                width: `${outcomeWrong / outcomeTotal * 100}%`,
                background: D.danger, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...TYPE.dataSm, fontFamily: D.mono, fontWeight: 700,
              }}>{outcomeWrong}</div>
            )}
            {outcomePending > 0 && (
              <div style={{
                width: `${outcomePending / outcomeTotal * 100}%`,
                background: D.surface3, color: D.text2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...TYPE.dataSm, fontFamily: D.mono, fontWeight: 700,
              }}>{outcomePending}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ ...TYPE.caption, color: D.text2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: D.accent, borderRadius: 2 }} /> Correct {outcomeCorrect}
            </span>
            <span style={{ ...TYPE.caption, color: D.text2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: D.danger, borderRadius: 2 }} /> Incorrect {outcomeWrong}
            </span>
            <span style={{ ...TYPE.caption, color: D.text2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: D.surface3, borderRadius: 2 }} /> Pending {outcomePending}
            </span>
          </div>
        </div>
      )}

      {/* CONFIDENCE CALIBRATION — horizontal bars */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>CONFIDENCE CALIBRATION</span>
          <span style={{ ...TYPE.caption, color: D.text3 }}>actual vs predicted</span>
        </div>
        <div style={{ background: D.surface1, border: `1px solid ${D.border}`, borderRadius: RADIUS.md, overflow: 'hidden' }}>
          {bucketStats.map(b => <CalibrationBar key={b.key} bucket={b} />)}
        </div>
        {resolved.length < 3 && (
          <div style={{ ...TYPE.caption, color: D.text2, marginTop: 8 }}>
            Calibration is unreliable until 3+ picks have been resolved.
          </div>
        )}
      </div>

      {/* CONFIDENCE TIER DISTRIBUTION */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>CONFIDENCE DISTRIBUTION</span>
          <span style={{ ...TYPE.caption, color: D.text3 }}>where the model sits</span>
        </div>
        <div style={{
          display: 'flex', height: 10, borderRadius: RADIUS.full, overflow: 'hidden',
          background: D.surface2, border: `1px solid ${D.border}`,
        }}>
          {tierCounts.map(t => t.count > 0 && (
            <div key={t.key} style={{
              width: `${t.count / tierTotal * 100}%`,
              background: t.color,
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          {tierCounts.map(t => (
            <span key={t.key} style={{
              ...TYPE.caption, color: D.text2,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 8, height: 8, background: t.color, borderRadius: 2 }} />
              <span style={{ fontFamily: D.mono, color: D.text1 }}>{t.key}</span>
              <span style={{ fontFamily: D.mono, color: D.text3 }}>{t.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* COMPETITION PERFORMANCE */}
      {compRows.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, marginBottom: 8 }}>
            COMPETITION PERFORMANCE
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10,
          }}>
            <div style={{
              background: D.surface1, border: `1px solid ${D.border}`,
              borderRadius: RADIUS.md, padding: 14,
            }}>
              <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.accent, marginBottom: 10 }}>▲ TOP</div>
              {compTop.map(c => (
                <div key={c.code} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0',
                }}>
                  <span style={{ ...TYPE.caption, color: D.text1 }}>{c.name}</span>
                  <span style={{ ...TYPE.data, fontFamily: D.mono, color: D.accent, fontWeight: 700 }}>
                    {c.rate}% <span style={{ color: D.text3, fontWeight: 500 }}>· {c.correct}/{c.total}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{
              background: D.surface1, border: `1px solid ${D.border}`,
              borderRadius: RADIUS.md, padding: 14,
            }}>
              <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.danger, marginBottom: 10 }}>▼ BOTTOM</div>
              {compBottom.map(c => (
                <div key={c.code} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0',
                }}>
                  <span style={{ ...TYPE.caption, color: D.text1 }}>{c.name}</span>
                  <span style={{ ...TYPE.data, fontFamily: D.mono, color: D.danger, fontWeight: 700 }}>
                    {c.rate}% <span style={{ color: D.text3, fontWeight: 500 }}>· {c.correct}/{c.total}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TABLE */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>ANALYSIS HISTORY</span>
          <span style={{ ...TYPE.caption, color: D.text3 }}>newest first</span>
        </div>
        {entries.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState title="No analyses yet" hint="Analyse a fixture to see it appear here." />
          </div>
        ) : (
          <div className="miq-mobile-scroll-x" style={{
            background: D.surface1, border: `1px solid ${D.border}`, borderRadius: RADIUS.md,
            overflow: 'auto',
          }}>
          <div style={{ minWidth: 520 }}>
            {entries.map(({ id, a, fx }, idx) => {
              const r = a.recommendation || {}
              const conf = Math.round((r.confidence || 0) * 100)
              const edge = r.value_edge || 0
              const isOpen = openResolve === id
              const isLast = idx === entries.length - 1
              const homeSel = r.pick === 'home_win'
              const awaySel = r.pick === 'away_win'
              const drawSel = r.pick === 'draw'
              const finalScore = a.finalScore
              const pickLabel = fx
                ? (homeSel ? fx.homeTeam : awaySel ? fx.awayTeam : drawSel ? 'Draw' : r.pick)
                : r.pick
              const confColor = conf >= 75 ? D.accent : conf >= 65 ? D.info : conf >= 50 ? D.warning : D.text2

              const resolvedBadge = a.resolved ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 8px', borderRadius: RADIUS.sm,
                  background: a.correct ? D.accentBg : 'transparent',
                  border: `1px solid ${a.correct ? D.accentBorder : D.danger}`,
                  color: a.correct ? D.accent : D.danger,
                  ...TYPE.dataSm, fontFamily: D.mono, fontWeight: 700,
                }}>
                  {a.correct ? <Check size={12} /> : <XCircle size={12} />}
                  {a.autoResolved ? 'AUTO ' : ''}{a.correct ? 'HIT' : 'MISS'}
                </div>
              ) : (
                <button
                  onClick={() => setOpenResolve(isOpen ? null : id)}
                  style={{
                    background: D.surface2, border: `1px solid ${D.borderMd}`,
                    borderRadius: RADIUS.sm, padding: '4px 10px',
                    ...TYPE.dataSm, fontFamily: D.mono, color: D.text1, cursor: 'pointer',
                  }}
                >Resolve</button>
              )

              return (
                <div key={id} className="miq-row-hover" style={{
                  borderBottom: !isLast || isOpen ? `1px solid ${D.border}` : 'none',
                  borderLeft: a.resolved
                    ? `3px solid ${a.correct ? D.accent : D.danger}`
                    : '3px solid transparent',
                }}>
                  <div style={{
                    padding: '12px 14px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr) 70px 70px auto',
                    gap: 12, alignItems: 'center',
                  }}>
                    {/* Match */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <TeamCrest src={fx?.homeLogo} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          ...TYPE.caption, color: D.text0, fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {fx ? `${fx.homeTeam} vs ${fx.awayTeam}` : `Match #${id}`}
                        </div>
                        <div style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3, marginTop: 2 }}>
                          {fx?.competition || a.competitionCode || ''}
                          {finalScore ? ` · ${finalScore}` : ''}
                        </div>
                      </div>
                      <TeamCrest src={fx?.awayLogo} />
                    </div>

                    {/* Pick */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        ...TYPE.caption, color: D.text1, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{pickLabel}</div>
                    </div>

                    {/* Conf */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ ...TYPE.data, fontFamily: D.mono, color: confColor, fontWeight: 700 }}>{conf}%</div>
                      <div style={{
                        height: 3, background: D.surface2, borderRadius: RADIUS.full,
                        marginTop: 4, overflow: 'hidden',
                      }}>
                        <div style={{ width: `${conf}%`, height: '100%', background: confColor }} />
                      </div>
                    </div>

                    {/* Edge */}
                    <div style={{ textAlign: 'right', ...TYPE.dataSm, fontFamily: D.mono,
                      color: edge > 0 ? D.accent : edge < 0 ? D.danger : D.text2, fontWeight: 700 }}>
                      {edge > 0 ? `+${edge}%` : `${edge}%`}
                    </div>

                    {/* Result */}
                    <div style={{ textAlign: 'right' }}>{resolvedBadge}</div>
                  </div>

                  {isOpen && (
                    <div style={{
                      padding: '10px 14px 14px',
                      background: D.surface2,
                      borderTop: `1px solid ${D.border}`,
                    }}>
                      <div style={{ ...TYPE.caption, color: D.text1, marginBottom: 8 }}>
                        Was this pick correct?
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { onResolve(id, true); setOpenResolve(null) }}
                          style={{
                            background: D.accent, color: D.surface0, border: 'none',
                            borderRadius: RADIUS.sm, padding: '6px 14px',
                            ...TYPE.caption, fontWeight: 700, cursor: 'pointer',
                          }}>Correct</button>
                        <button onClick={() => { onResolve(id, false); setOpenResolve(null) }}
                          style={{
                            background: 'transparent', color: D.danger,
                            border: `1px solid ${D.danger}`,
                            borderRadius: RADIUS.sm, padding: '6px 14px',
                            ...TYPE.caption, fontWeight: 700, cursor: 'pointer',
                          }}>Incorrect</button>
                        <button onClick={() => setOpenResolve(null)}
                          style={{
                            background: 'transparent', color: D.text2,
                            border: `1px solid ${D.borderMd}`,
                            borderRadius: RADIUS.sm, padding: '6px 14px',
                            ...TYPE.caption, cursor: 'pointer',
                          }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * Analysis screen
 * ============================================================ */

function KellyCard({ kelly }) {
  if (!kelly) return null
  const hasEdge = kelly.full != null && kelly.full > 0
  return (
    <div style={{
      background: D.surface2, border: `1px solid ${D.borderMd}`,
      borderRadius: RADIUS.md, padding: 12, marginTop: 4,
    }}>
      <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>KELLY CRITERION</div>
      {hasEdge ? (
        <>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...TYPE.data, fontFamily: D.mono, fontSize: 18, color: D.text0, fontWeight: 700 }}>
                {kelly.fullPercent}% of bankroll
              </div>
              <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3, marginTop: 2 }}>Full Kelly</div>
            </div>
            <div>
              <div style={{ ...TYPE.data, fontFamily: D.mono, fontSize: 18, color: D.accent, fontWeight: 700 }}>
                {kelly.halfPercent}% of bankroll
              </div>
              <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3, marginTop: 2 }}>Half Kelly (recommended)</div>
            </div>
          </div>
          <div style={{ ...TYPE.caption, color: D.text2, fontStyle: 'italic', marginTop: 8 }}>
            Half Kelly reduces variance. Full Kelly maximises long-term growth.
          </div>
        </>
      ) : (
        <>
          <div style={{ ...TYPE.body, color: D.warning, marginTop: 8 }}>{kelly.label}</div>
          <div style={{ ...TYPE.caption, color: D.text2, marginTop: 4 }}>
            Model probability does not exceed implied probability from market odds.
          </div>
        </>
      )}
    </div>
  )
}

function MultiMarketCard({ market }) {
  const r = market.result || {}
  const conf = Math.round((r.confidence || 0) * 100)
  const pickLabels = {
    over: 'Over 2.5 Goals', under: 'Under 2.5 Goals',
    yes: 'Both Teams Score — Yes', no: 'Both Teams Score — No',
  }
  return (
    <div style={{
      background: D.surface1, border: `1px solid ${D.borderMd}`,
      borderRadius: RADIUS.md, padding: 14,
    }}>
      <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2 }}>{market.label.toUpperCase()}</div>
      <div style={{ ...TYPE.body, color: D.text0, fontWeight: 700, marginTop: 8 }}>
        {pickLabels[r.recommendation] || r.recommendation || '—'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1, height: 3, background: D.surface3, borderRadius: RADIUS.full, overflow: 'hidden' }}>
          <div style={{ width: `${conf}%`, height: '100%', background: D.accent }} />
        </div>
        <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text0, fontWeight: 700 }}>{conf}%</span>
      </div>
      {r.reasoning && (
        <div style={{ ...TYPE.caption, color: D.text1, marginTop: 8, lineHeight: 1.5 }}>{r.reasoning}</div>
      )}
    </div>
  )
}

function ConfColour(pct) {
  if (pct < 50) return D.danger
  if (pct < 65) return D.warning
  return D.accent
}

function AgentPanel({ label, edgeSide, homeTeam, awayTeam, verdicts, keyFactors, children, style }) {
  const edgeLabel = edgeSide === 'home' ? homeTeam : edgeSide === 'away' ? awayTeam : 'Neutral'
  const isNeutral = edgeSide === 'neutral' || !edgeSide
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 10, marginBottom: 12, minWidth: 0,
      }}>
        <span style={{
          ...TYPE.label, fontFamily: D.mono, color: D.text2, letterSpacing: '0.08em',
          flexShrink: 0,
        }}>{label}</span>
        {edgeSide && (
          <span style={{
            ...TYPE.dataSm,
            padding: '4px 8px',
            borderRadius: RADIUS.sm,
            background: isNeutral ? D.surface3 : D.accentBg,
            color: isNeutral ? D.text1 : D.accent,
            border: `1px solid ${isNeutral ? D.borderMd : D.accentBorder}`,
            maxWidth: 120,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            minWidth: 0,
          }} title={edgeLabel}>{edgeLabel}</span>
        )}
      </div>
      {verdicts && verdicts.map((v, i) => (
        <div key={i} style={{ ...TYPE.body, color: D.text1, marginBottom: 12 }}>{v}</div>
      ))}
      {keyFactors && keyFactors.length > 0 && (
        <div>
          {keyFactors.map((k, i) => (
            <div key={i} style={{
              borderLeft: `2px solid ${D.accent}`,
              paddingLeft: 8, marginBottom: 6,
              ...TYPE.caption, color: D.text1,
            }}>{k}</div>
          ))}
        </div>
      )}
      {children}
    </Card>
  )
}

function AnalysisSkeleton({ fixture }) {
  return (
    <div>
      <AnalysisHeader fixture={fixture} />
      <Skeleton w={120} h={11} style={{ marginBottom: 20 }} />

      <Card style={{ marginBottom: 16 }}>
        <Skeleton w={110} h={11} style={{ marginBottom: 12 }} />
        <Skeleton w="55%" h={22} style={{ marginBottom: 18 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton w={78} h={32} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton w={78} h={22} style={{ borderRadius: 6 }} />
            <Skeleton w={100} h={22} style={{ borderRadius: 6 }} />
          </div>
        </div>
        <Skeleton w="100%" h={4} style={{ marginBottom: 16 }} />
        <Skeleton w={64} h={22} style={{ borderRadius: 6, marginBottom: 16 }} />
        <Skeleton w="100%" h={14} style={{ marginBottom: 6 }} />
        <Skeleton w="94%" h={14} style={{ marginBottom: 6 }} />
        <Skeleton w="72%" h={14} />
      </Card>

      {[0, 1, 2].map(i => (
        <Card key={i} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Skeleton w={130} h={11} />
            <Skeleton w={70} h={22} style={{ borderRadius: 6 }} />
          </div>
          <Skeleton w="88%" h={14} style={{ marginBottom: 12 }} />
          <Skeleton w="70%" h={12} style={{ marginBottom: 6 }} />
          <Skeleton w="60%" h={12} />
        </Card>
      ))}
    </div>
  )
}

function AnalysisHeader({ fixture }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        ...TYPE.display, color: D.text0, marginBottom: 6,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {fixture.homeTeam} vs {fixture.awayTeam}
      </div>
      <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text2, letterSpacing: '0.04em' }}>
        {fixture.competition} · {fixture.kickoff}
      </div>
    </div>
  )
}

function DataQualityIndicator({ level }) {
  if (!level) return null
  const colour = level === 'high' ? D.accent : level === 'medium' ? D.warning : D.danger
  return (
    <div style={{
      ...TYPE.dataSm, color: colour, marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.04em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colour }} />
      Data quality: {level}
    </div>
  )
}

function FixturePreview({ fixture, onAnalyze }) {
  const hasOdds = fixture.odds?.home != null
  const hasHomeForm = Array.isArray(fixture.homeForm) && fixture.homeForm.length > 0
  const hasAwayForm = Array.isArray(fixture.awayForm) && fixture.awayForm.length > 0
  const hasH2h = fixture.h2h?.matches?.length > 0

  const readiness = [hasHomeForm || hasAwayForm, hasOdds, hasH2h].filter(Boolean).length
  const qualityLabel = readiness === 3 ? 'High' : readiness === 2 ? 'Medium' : readiness === 1 ? 'Low' : 'Sparse'
  const qualityColor = readiness === 3 ? D.accent : readiness === 2 ? D.info : readiness === 1 ? D.warning : D.text3

  const FormRow = ({ team, form, side }) => (
    <div style={{ textAlign: side === 'right' ? 'right' : 'left' }}>
      <div style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3, marginBottom: 6, letterSpacing: '0.04em' }}>
        {team.toUpperCase()}
      </div>
      <div style={{
        display: 'flex', gap: 4,
        justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
      }}>
        {(form && form.length ? form : ['-', '-', '-', '-', '-']).map((r, i) => {
          const color = r === 'W' ? D.accent : r === 'L' ? D.danger : r === 'D' ? D.text1 : D.text3
          const bg = r === 'W' ? D.accentBg : r === 'L' ? 'transparent' : 'transparent'
          const border = r === '-' ? `1px dashed ${D.text3}` : `1px solid ${color}`
          return (
            <span key={i} style={{
              width: 20, height: 20, borderRadius: RADIUS.sm,
              background: bg, border,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: D.mono, fontSize: 10, fontWeight: 800, color,
            }}>{r === '-' ? '' : r}</span>
          )
        })}
      </div>
    </div>
  )

  const OddCell = ({ label, value }) => {
    const num = value ? parseFloat(value) : null
    const implied = num ? (1 / num * 100).toFixed(1) : null
    return (
      <div style={{
        flex: 1, minWidth: 0,
        background: D.surface2, border: `1px solid ${D.border}`,
        borderRadius: RADIUS.md, padding: 12, textAlign: 'center',
      }}>
        <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, fontSize: 9 }}>{label}</div>
        <div style={{
          fontFamily: D.mono, fontSize: 20, fontWeight: 800, color: D.text0,
          marginTop: 6, lineHeight: 1,
        }}>
          {num ? num.toFixed(2) : '—'}
        </div>
        <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text2, marginTop: 4 }}>
          {implied ? `${implied}%` : '—'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 8 }}>
      <AnalysisHeader fixture={fixture} />

      {/* Readiness readout */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 12px', marginBottom: 16,
        background: D.surface1, border: `1px solid ${D.border}`,
        borderRadius: RADIUS.md,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: qualityColor, boxShadow: `0 0 10px ${qualityColor}` }} />
        <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3 }}>DATA READINESS</span>
        <span style={{ ...TYPE.data, fontFamily: D.mono, color: qualityColor, fontWeight: 700 }}>{qualityLabel}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { l: 'FORM', on: hasHomeForm || hasAwayForm },
            { l: 'ODDS', on: hasOdds },
            { l: 'H2H',  on: hasH2h },
          ].map(s => (
            <span key={s.l} style={{
              ...TYPE.dataSm, fontFamily: D.mono, letterSpacing: '0.08em',
              padding: '3px 8px', borderRadius: RADIUS.sm,
              background: s.on ? D.accentBg : 'transparent',
              color: s.on ? D.accent : D.text3,
              border: `1px solid ${s.on ? D.accentBorder : D.borderMd}`,
              fontWeight: 700,
            }}>{s.l}</span>
          ))}
        </div>
      </div>

      {/* Form comparison */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center',
        background: D.surface1, border: `1px solid ${D.border}`,
        borderRadius: RADIUS.md, padding: 14, marginBottom: 12,
      }}>
        <FormRow team={fixture.homeTeam} form={fixture.homeForm} side="left" />
        <span style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3 }}>vs</span>
        <FormRow team={fixture.awayTeam} form={fixture.awayForm} side="right" />
      </div>

      {/* Odds strip */}
      {hasOdds ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <OddCell label="HOME" value={fixture.odds.home} />
          <OddCell label="DRAW" value={fixture.odds.draw} />
          <OddCell label="AWAY" value={fixture.odds.away} />
        </div>
      ) : (
        <div style={{
          background: D.surface1, border: `1px dashed ${D.borderMd}`,
          borderRadius: RADIUS.md, padding: 12, marginBottom: 12,
          ...TYPE.caption, color: D.text2, textAlign: 'center',
        }}>
          Live odds unavailable — analysis will reason from form and tactical context only.
        </div>
      )}

      {/* H2H summary */}
      {hasH2h && (
        <div style={{
          background: D.surface1, border: `1px solid ${D.border}`,
          borderRadius: RADIUS.md, padding: 12, marginBottom: 16,
        }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text3, marginBottom: 6 }}>
            HEAD TO HEAD
          </div>
          <div style={{ ...TYPE.caption, color: D.text1 }}>
            {fixture.h2h.summary}
          </div>
          {fixture.h2h.lastMeeting && (
            <div style={{ ...TYPE.dataSm, fontFamily: D.mono, color: D.text3, marginTop: 4 }}>
              Last: {fixture.h2h.lastMeeting}
            </div>
          )}
        </div>
      )}

      {/* Run Analysis CTA */}
      <button onClick={onAnalyze} style={{
        width: '100%', minHeight: 52, cursor: 'pointer',
        background: D.accent, color: D.bg0, border: 'none',
        borderRadius: RADIUS.md, padding: '14px 20px',
        fontFamily: D.sans, fontSize: 15, fontWeight: 800, letterSpacing: '0.04em',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: D.accentGlow,
        textTransform: 'uppercase',
        transition: `transform ${D.durFast} ${D.ease}, box-shadow ${D.durBase} ${D.ease}`,
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Run Analysis
        <ChevronRight size={16} color={D.bg0} />
      </button>

      <div style={{ ...TYPE.caption, color: D.text3, textAlign: 'center', marginTop: 10 }}>
        Three specialised agents will reason about this fixture and produce a synthesis pick.
      </div>
    </div>
  )
}

function AnalysisScreen({ fixture, data, loading, error, isMobile, onBack, onRetry, onAnalyze }) {
  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      {isMobile && (
        <button onClick={onBack} aria-label="Back" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: D.text1, padding: 0, marginBottom: 16,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <ChevronLeft /><span style={{ ...TYPE.caption, color: D.text1 }}>{fixture.competition}</span>
        </button>
      )}

      {loading && <AnalysisSkeleton fixture={fixture} />}

      {error && !loading && (
        <>
          <AnalysisHeader fixture={fixture} />
          <div style={{
            borderLeft: `3px solid ${D.danger}`,
            padding: '12px 16px', background: D.surface1, borderRadius: RADIUS.md,
          }}>
            <div style={{ ...TYPE.body, color: D.text0 }}>Analysis failed</div>
            <div style={{ ...TYPE.caption, color: D.text1, margin: '4px 0 12px' }}>{error}</div>
            <SecondaryButton onClick={onRetry}>Retry</SecondaryButton>
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <FixturePreview fixture={fixture} onAnalyze={onAnalyze} />
      )}

      {data && !loading && !error && (
        <AnalysisBody fixture={fixture} data={data} onAnalyze={onAnalyze} />
      )}
    </div>
  )
}

function AnalysisBody({ fixture, data, onAnalyze }) {
  const width = useWindowWidth()
  const isThreeCol = width >= 1400
  const r = data.recommendation
  const confPct = Math.round((r.confidence || 0) * 100)
  const modelPct = Math.round((r.model_probability || 0) * 100)
  const edge = r.value_edge || 0
  const edgePositive = edge > 0
  const pickLabel = ({ home_win: `${fixture.homeTeam} Win`, draw: 'Draw', away_win: `${fixture.awayTeam} Win` })[r.pick] || r.pick
  const confColour = ConfColour(confPct)

  const homeFirst = fixture.homeTeam.split(' ')[0]
  const awayFirst = fixture.awayTeam.split(' ')[0]

  const marketCells = [
    { l: homeFirst, v: data.market_analysis.implied_home_prob },
    { l: 'Draw',    v: data.market_analysis.implied_draw_prob },
    { l: awayFirst, v: data.market_analysis.implied_away_prob },
  ]

  return (
    <div>
      <AnalysisHeader fixture={fixture} />

      {/* Re-run action bar */}
      {onAnalyze && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12, marginBottom: 14, flexWrap: 'wrap',
        }}>
          <div style={{ ...TYPE.caption, fontFamily: D.mono, color: D.text3 }}>
            {data._ts ? `Analysed ${new Date(data._ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Cached analysis'}
          </div>
          <button onClick={onAnalyze} style={{
            cursor: 'pointer',
            background: D.accent, color: D.bg0, border: 'none',
            borderRadius: RADIUS.md, padding: '8px 14px',
            fontFamily: D.sans, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: D.accentGlow,
            transition: `transform ${D.durFast} ${D.ease}`,
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Run Analysis
          </button>
        </div>
      )}

      <DataQualityIndicator level={data.data_quality} />

      {/* RECOMMENDATION */}
      <Card style={{ marginBottom: 16 }}>
        <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, letterSpacing: '0.08em' }}>
          Recommendation
        </span>
        <div style={{ ...TYPE.title, color: D.text0, marginTop: 10, marginBottom: 16 }}>{pickLabel}</div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: D.mono, fontSize: 32, lineHeight: 1, fontWeight: 800, color: confColour }}>
            {confPct}%
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{
              ...TYPE.dataSm, padding: '6px 10px', borderRadius: RADIUS.sm,
              background: D.surface2, color: D.text1, border: `1px solid ${D.borderMd}`,
            }}>Model {modelPct}%</span>
            <span style={{
              ...TYPE.dataSm, padding: '6px 10px', borderRadius: RADIUS.sm,
              background: edgePositive ? D.accentBg : D.surface2,
              color: edgePositive ? D.accent : D.text1,
              border: `1px solid ${edgePositive ? D.accentBorder : D.borderMd}`,
            }}>{edgePositive ? '+' : edge < 0 ? '' : '±'}{edge}% vs market</span>
          </div>
        </div>

        <div style={{ height: 4, background: D.surface3, borderRadius: RADIUS.sm, overflow: 'hidden', marginBottom: 14 }}>
          <div className="miq-conf" style={{ width: `${confPct}%`, height: '100%', background: confColour }} />
        </div>

        <div style={{ ...TYPE.body, color: D.text1, marginBottom: 12 }}>{r.reasoning}</div>

        <KellyCard kelly={data.kelly} />
      </Card>

      {/* ADDITIONAL MARKETS */}
      {data.multiMarket && data.multiMarket.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...TYPE.label, fontFamily: D.mono, color: D.text2, marginBottom: 10 }}>
            ADDITIONAL MARKETS
          </div>
          <div style={{
            display: 'grid', gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}>
            {data.multiMarket.map(m => <MultiMarketCard key={m.key} market={m} />)}
          </div>
        </div>
      )}

      {/* RED FLAGS */}
      {r.red_flags?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <span style={{ ...TYPE.label, fontFamily: D.mono, color: D.danger, letterSpacing: '0.08em' }}>
            Red Flags
          </span>
          <div style={{ marginTop: 12 }}>
            {r.red_flags.map((f, i) => (
              <div key={i} style={{
                borderLeft: `3px solid ${D.danger}`,
                paddingLeft: 10, marginBottom: 8,
                ...TYPE.caption, color: D.text1,
              }}>{f}</div>
            ))}
          </div>
        </Card>
      )}

      {/* AGENT PANELS — vertical mobile, 3-col on very wide */}
      <div style={{
        display: isThreeCol ? 'grid' : 'flex',
        gridTemplateColumns: isThreeCol ? '1fr 1fr 1fr' : undefined,
        flexDirection: isThreeCol ? undefined : 'column',
        gap: 12,
      }}>
        <AgentPanel
          label="Form Analysis"
          edgeSide={data.form_analysis.form_edge}
          homeTeam={fixture.homeTeam} awayTeam={fixture.awayTeam}
          verdicts={[
            `${fixture.homeTeam}: ${data.form_analysis.home_verdict}`,
            `${fixture.awayTeam}: ${data.form_analysis.away_verdict}`,
          ]}
          keyFactors={data.form_analysis.key_factors || []}
        />

        <AgentPanel
          label="Tactical Analysis"
          edgeSide={data.tactical_analysis.tactical_edge}
          homeTeam={fixture.homeTeam} awayTeam={fixture.awayTeam}
          verdicts={[data.tactical_analysis.matchup_insight]}
          keyFactors={data.tactical_analysis.key_factors || []}
        />

        <AgentPanel label="Market Analysis">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {marketCells.map((c, i) => (
              <div key={i} style={{
                background: D.surface2, borderRadius: RADIUS.md,
                padding: '10px 12px', textAlign: 'center',
                border: `1px solid ${D.border}`,
              }}>
                <div style={{ ...TYPE.dataSm, color: D.text2, marginBottom: 6 }}>{c.l}</div>
                <div style={{ ...TYPE.data, color: D.text0 }}>{Math.round((c.v || 0) * 100)}%</div>
              </div>
            ))}
          </div>
          <div style={{ ...TYPE.caption, color: D.text1 }}>{data.market_analysis.market_signal}</div>
        </AgentPanel>
      </div>
    </div>
  )
}

/* ============================================================
 * Odds lookup + form processing helpers
 * ============================================================ */

function lookupOddsForFixture(fixture, oddsCache) {
  const homeLc = fixture.homeTeam.toLowerCase()
  const awayLc = fixture.awayTeam.toLowerCase()
  const game = oddsCache.find(g => {
    if (!g.home_team || !g.away_team) return false
    const h = g.home_team.toLowerCase()
    const a = g.away_team.toLowerCase()
    return (h.includes(homeLc) || homeLc.includes(h)) &&
           (a.includes(awayLc) || awayLc.includes(a))
  })
  if (!game || !game.bookmakers?.length) return null
  const bk = game.bookmakers[0]
  const mkt = bk.markets?.find(m => m.key === 'h2h')
  if (!mkt) return null
  const find = (pred) => mkt.outcomes?.find(pred)
  const home = find(o => o.name.toLowerCase().includes(homeLc) || homeLc.includes(o.name.toLowerCase()))
  const away = find(o => o.name.toLowerCase().includes(awayLc) || awayLc.includes(o.name.toLowerCase()))
  const draw = find(o => o.name.toLowerCase() === 'draw')
  if (!home || !away || !draw) return null
  return {
    odds: { home: home.price, draw: draw.price, away: away.price },
    marketMovement: `Live odds from ${game.bookmakers.length} bookmakers via ${bk.title}`,
  }
}

function resultForTeam(match, teamId) {
  const home = match.score?.fullTime?.home
  const away = match.score?.fullTime?.away
  if (home == null || away == null) return null
  const isHome = match.homeTeam?.id === teamId
  if (home === away) return 'D'
  const homeWon = home > away
  return isHome === homeWon ? 'W' : 'L'
}

/* ============================================================
 * Root component
 * ============================================================ */

export default function MatchIQ() {
  const width = useWindowWidth()
  const isMobile   = width < 768
  const isWide     = width >= 1100

  const [theme, toggleTheme] = useTheme()

  const [fixtures, setFixtures] = useState([])
  const [fixturesLoading, setFixturesLoading] = useState(true)
  const [fixturesError, setFixturesError] = useState(null)

  const [oddsCache, setOddsCache] = useState([])
  const [oddsUpdatedAt, setOddsUpdatedAt] = useState(null)
  const [oddsQuotaRemaining, setOddsQuotaRemaining] = useState(null)

  const [h2hCache, setH2hCache] = useState({})
  const [standingsCache, setStandingsCache] = useState({})
  const [scorersCache, setScorersCache] = useState({})
  const [compDetailsCache, setCompDetailsCache] = useState({})

  const [refreshTimer, setRefreshTimer] = useState(0)

  const [activeTab, setActiveTab] = useState('today')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState({ football: 'unknown', odds: 'unknown', analysis: 'unknown' })
  const [apiHealth, setApiHealth] = useState({
    football: { code: null, msg: null, count: null, at: null },
    odds:     { code: null, msg: null, count: null, at: null, remaining: null },
    analysis: { code: null, msg: null, at: null },
  })
  const [diagOpen, setDiagOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    try { return localStorage.getItem('matchiq_diag_open') !== '0' } catch { return true }
  })
  useEffect(() => {
    try { localStorage.setItem('matchiq_diag_open', diagOpen ? '1' : '0') } catch {}
  }, [diagOpen])
  const [parlaySelections, setParlaySelections] = useState([])
  const [agentPerf, setAgentPerf] = useState(() => {
    if (typeof window === 'undefined') return { form: { correct: 0, total: 0 }, tactical: { correct: 0, total: 0 }, market: { correct: 0, total: 0 } }
    try {
      const raw = localStorage.getItem(LS_AGENT_PERF)
      if (raw) return JSON.parse(raw)
    } catch {}
    return { form: { correct: 0, total: 0 }, tactical: { correct: 0, total: 0 }, market: { correct: 0, total: 0 } }
  })

  function toggleParlay(id) {
    setParlaySelections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function clearParlay() { setParlaySelections([]) }
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  const [selected, setSelected] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [analysisCache, setAnalysisCache] = useState(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(LS_ANALYSIS) || '{}') } catch { return {} }
  })
  const [tracked, setTracked] = useState(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem(LS_TRACKED) || '[]')) } catch { return new Set() }
  })

  useEffect(() => {
    try { localStorage.setItem(LS_ANALYSIS, JSON.stringify(analysisCache)) } catch {}
  }, [analysisCache])

  useEffect(() => {
    try { localStorage.setItem(LS_AGENT_PERF, JSON.stringify(agentPerf)) } catch {}
  }, [agentPerf])

  // Auto-resolve finished fixtures against cached analyses
  useEffect(() => {
    if (!fixtures.length) return
    const byId = Object.fromEntries(fixtures.map(f => [f.id, f]))
    let changed = false
    const next = { ...analysisCache }
    let perf = agentPerf
    for (const [id, a] of Object.entries(analysisCache)) {
      if (a.resolved) continue
      const fx = byId[id]
      if (!fx) continue
      const resolved = autoResolve(a, fx)
      if (resolved) { next[id] = resolved; changed = true; perf = updateAgentPerformance(perf, resolved) }
    }
    if (changed) { setAnalysisCache(next); setAgentPerf(perf) }
  }, [fixtures])

  function resolveManual(id, correct) {
    setAnalysisCache(prev => {
      const a = prev[id]
      if (!a) return prev
      return {
        ...prev,
        [id]: { ...a, resolved: true, autoResolved: false, correct, resolvedAt: Date.now() },
      }
    })
  }

  useEffect(() => {
    try { localStorage.setItem(LS_TRACKED, JSON.stringify(Array.from(tracked))) } catch {}
  }, [tracked])

  useEffect(() => {
    const k = import.meta.env.VITE_GROQ_API_KEY || ''
    console.log('VITE_GROQ_API_KEY prefix:', k ? k.slice(0, 8) + '…' : '(missing)')
  }, [])

  useEffect(() => {
    const id = setInterval(() => setRefreshTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  /* -------- fixtures -------- */

  function mapMatch(item) {
    if (!item || !item.homeTeam || !item.awayTeam) return null

    const statusMap = {
      SCHEDULED: 'SCHEDULED', TIMED: 'SCHEDULED', POSTPONED: 'POSTPONED',
      IN_PLAY: 'IN_PLAY', PAUSED: 'IN_PLAY', LIVE: 'IN_PLAY',
      FINISHED: 'FINISHED', AWARDED: 'FINISHED',
      SUSPENDED: 'CANCELLED', CANCELLED: 'CANCELLED',
    }

    const kickoffDate = new Date(item.utcDate)
    const today = new Date()
    const isToday = kickoffDate.toDateString() === today.toDateString()
    const tomorrow = new Date(Date.now() + 86400000)
    const isTomorrow = kickoffDate.toDateString() === tomorrow.toDateString()

    const compCode = item.competition?.code || ''
    const compName = item.competition?.name || 'Unknown'
    const region = item.area?.name || ''

    const goalsHome = item.score?.fullTime?.home ?? item.score?.halfTime?.home ?? null
    const goalsAway = item.score?.fullTime?.away ?? item.score?.halfTime?.away ?? null

    return {
      id: item.id,
      homeTeamId: item.homeTeam.id,
      awayTeamId: item.awayTeam.id,
      homeTeam: item.homeTeam.name || item.homeTeam.shortName || 'TBC',
      awayTeam: item.awayTeam.name || item.awayTeam.shortName || 'TBC',
      homeLogo: item.homeTeam.crest,
      awayLogo: item.awayTeam.crest,
      kickoff: kickoffDate.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
      }),
      kickoffDate,
      dayLabel: isToday ? null : isTomorrow ? 'Tomorrow'
        : kickoffDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' }),
      matchDate: isToday ? null
        : kickoffDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      homeForm: [],
      awayForm: [],
      homeSeason: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
      awaySeason: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
      h2h: { summary: 'Head-to-head data unavailable', lastMeeting: 'Unavailable' },
      odds: { home: null, draw: null, away: null },
      marketMovement: 'Fetching live odds on selection',
      venue: item.venue || 'TBC',
      status: statusMap[item.status] || 'SCHEDULED',
      statusShort: item.status,
      goalsHome,
      goalsAway,
      competition: compName,
      competitionId: compCode,
      competitionCode: compCode,
      region,
    }
  }

  async function fetchRange(fromStr, toStr) {
    const url = `/api/football/v4/matches?dateFrom=${fromStr}&dateTo=${toStr}`
    let res
    try {
      res = await fetch(url)
    } catch (e) {
      setApiHealth(h => ({ ...h, football: { code: null, msg: `Network: ${e.message}`, count: null, at: Date.now() } }))
      throw new Error(`Network failure — proxy or dev server unreachable (${e.message})`)
    }
    if (res.status === 401 || res.status === 403) {
      setApiHealth(h => ({ ...h, football: { code: res.status, msg: 'API key rejected', count: null, at: Date.now() } }))
      throw new Error('API key rejected — verify FOOTBALL_API_KEY in Vercel env (or .env locally) is active.')
    }
    if (res.status === 429) {
      setApiHealth(h => ({ ...h, football: { code: 429, msg: 'Rate limited (10 req/min free tier)', count: null, at: Date.now() } }))
      return []
    }
    if (!res.ok) {
      setApiHealth(h => ({ ...h, football: { code: res.status, msg: `HTTP ${res.status}`, count: null, at: Date.now() } }))
      return []
    }
    const data = await res.json()
    const matches = (data.matches || []).map(mapMatch).filter(Boolean)
    setApiHealth(h => ({ ...h, football: { code: 200, msg: `OK · ${fromStr} → ${toStr}`, count: matches.length, at: Date.now() } }))
    return matches
  }

  async function fetchDay(dateStr) {
    return fetchRange(dateStr, dateStr)
  }

  async function loadFixturesWindow() {
    const from = new Date()
    const to = new Date(Date.now() + 10 * 86400000)
    return fetchRange(from.toISOString().split('T')[0], to.toISOString().split('T')[0])
  }

  async function loadFixtures(useWeekWindow = false) {
    setFixturesLoading(true); setFixturesError(null)

    const today = new Date().toISOString().split('T')[0]

    // API key is now server-side in /api/football/[...path].js
    // No client-side key check needed.

    try {
      let all = await fetchDay(today)
      if (all.length === 0 && !useWeekWindow) {
        all = await loadFixturesWindow()
      }
      setFixtures(all)
      setApiStatus(s => ({ ...s, football: 'operational' }))
      loadTeamForms(all.slice(0, 10))
      loadCompetitionData(all)
    } catch (err) {
      const msg = /disabled|forbidden|401|403/i.test(err.message || '')
        ? 'API key rejected — verify FOOTBALL_API_KEY in Vercel env (or .env locally) is active.'
        : err.message || 'Unknown error loading fixtures'
      setFixturesError(msg)
      setApiStatus(s => ({ ...s, football: 'degraded' }))
    } finally {
      setFixturesLoading(false)
    }
  }

  async function loadTeamForms(fixtures) {
    const teamIds = [...new Set(fixtures.flatMap(f => [f.homeTeamId, f.awayTeamId]))]
      .filter(Boolean)
      .slice(0, 20)

    const formMap = {}
    for (const teamId of teamIds) {
      await delay(300)
      try {
        const res = await fetch(`/api/football/v4/teams/${teamId}/matches/?status=FINISHED&limit=5`)
        if (!res.ok) continue
        const data = await res.json()
        const matches = data.matches || []
        formMap[teamId] = matches
          .slice(0, 5)
          .map(m => {
            const isHome = m.homeTeam?.id === teamId
            const hs = m.score?.fullTime?.home
            const as = m.score?.fullTime?.away
            if (hs == null || as == null) return null
            const teamGoals = isHome ? hs : as
            const oppGoals  = isHome ? as : hs
            if (teamGoals > oppGoals) return 'W'
            if (teamGoals < oppGoals) return 'L'
            return 'D'
          })
          .filter(Boolean)
      } catch {}
    }

    setFixtures(prev => prev.map(f => ({
      ...f,
      homeForm: formMap[f.homeTeamId] || f.homeForm,
      awayForm: formMap[f.awayTeamId] || f.awayForm,
    })))
  }

  /* -------- odds -------- */

  async function loadOdds() {
    try {
      let lastRemaining = null
      let lastCode = null
      let lastMsg = null
      const results = await Promise.allSettled(
        ODDS_SPORTS.map(async (sport) => {
          const res = await fetch(
            `/api/odds/v4/sports/${sport}/odds/?regions=uk&markets=h2h&oddsFormat=decimal`,
          )
          const rem = res.headers.get('x-requests-remaining')
          if (rem != null) { lastRemaining = rem; console.log(`[odds-api] ${sport} x-requests-remaining:`, rem) }
          lastCode = res.status
          if (!res.ok) {
            try {
              const errBody = await res.json()
              lastMsg = errBody?.message || `HTTP ${res.status}`
            } catch { lastMsg = `HTTP ${res.status}` }
            return []
          }
          const data = await res.json()
          return Array.isArray(data) ? data : []
        })
      )
      const flat = []
      results.forEach(r => { if (r.status === 'fulfilled') flat.push(...r.value) })
      console.log('odds cache size:', flat.length)
      if (lastRemaining != null) setOddsQuotaRemaining(lastRemaining)
      setOddsCache(flat)
      setOddsUpdatedAt(Date.now())
      setRefreshTimer(0)
      const healthy = flat.length > 0
      setApiStatus(s => ({ ...s, odds: healthy ? 'operational' : 'degraded' }))
      setApiHealth(h => ({ ...h, odds: {
        code: lastCode,
        msg: healthy ? `OK · ${flat.length} events` : (lastMsg || 'No events returned'),
        count: flat.length,
        at: Date.now(),
        remaining: lastRemaining,
      } }))
    } catch (err) {
      console.error('odds fetch failed:', err)
      setApiStatus(s => ({ ...s, odds: 'degraded' }))
      setApiHealth(h => ({ ...h, odds: { code: null, msg: `Network: ${err.message}`, count: null, at: Date.now(), remaining: null } }))
    }
  }

  /* -------- competition enrichment (standings, scorers, details) -------- */

  async function loadCompetitionData(fixturesList) {
    const codes = [...new Set(fixturesList.map(f => f.competitionCode).filter(Boolean))].slice(0, 6)
    for (const code of codes) {
      await delay(300)
      try {
        const [detRes, stRes, scRes] = await Promise.allSettled([
          fetch(`/api/football/v4/competitions/${code}`),
          fetch(`/api/football/v4/competitions/${code}/standings`),
          fetch(`/api/football/v4/competitions/${code}/scorers?limit=10`),
        ])
        if (detRes.status === 'fulfilled' && detRes.value.ok) {
          const d = await detRes.value.json()
          setCompDetailsCache(prev => ({ ...prev, [code]: d }))
        }
        if (stRes.status === 'fulfilled' && stRes.value.ok) {
          const d = await stRes.value.json()
          setStandingsCache(prev => ({ ...prev, [code]: d.standings || [] }))
        }
        if (scRes.status === 'fulfilled' && scRes.value.ok) {
          const d = await scRes.value.json()
          setScorersCache(prev => ({ ...prev, [code]: d.scorers || [] }))
        }
      } catch (e) {
        console.warn(`[comp ${code}] enrichment failed:`, e.message)
      }
    }
  }

  /* -------- head-to-head on selection -------- */

  async function loadH2H(fixture) {
    if (!fixture?.id) return null
    if (h2hCache[fixture.id]) return h2hCache[fixture.id]
    try {
      const res = await fetch(`/api/football/v4/matches/${fixture.id}/head2head?limit=10`)
      if (!res.ok) return null
      const data = await res.json()
      const matches = data.matches || []
      const agg = data.aggregates || {}
      const homeWins = agg.homeTeam?.wins ?? 0
      const awayWins = agg.awayTeam?.wins ?? 0
      const draws = agg.numberOfDraws ?? 0
      const total = agg.numberOfMatches ?? matches.length
      const last = matches[0]
      const lastMeeting = last
        ? `${new Date(last.utcDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — ${last.homeTeam?.shortName || last.homeTeam?.name} ${last.score?.fullTime?.home ?? '-'}:${last.score?.fullTime?.away ?? '-'} ${last.awayTeam?.shortName || last.awayTeam?.name}`
        : 'Unavailable'
      const enriched = {
        summary: total > 0
          ? `${total} meetings — ${fixture.homeTeam} ${homeWins}W, ${fixture.awayTeam} ${awayWins}W, ${draws}D`
          : 'No prior meetings on record',
        lastMeeting,
        matches: matches.slice(0, 10),
      }
      setH2hCache(prev => ({ ...prev, [fixture.id]: enriched }))
      return enriched
    } catch (e) {
      console.warn('H2H fetch failed:', e.message)
      return null
    }
  }

  useEffect(() => {
    loadFixtures()
    loadOdds()
  }, [])

  /* -------- selection + analysis -------- */

  async function openFixture(fixture) {
    let f = fixture
    const found = lookupOddsForFixture(fixture, oddsCache)
    if (found) f = { ...fixture, ...found }
    const cachedH2h = h2hCache[f.id]
    if (cachedH2h) f = { ...f, h2h: cachedH2h }
    setSelected(f)
    setError(null)
    if (analysisCache[f.id]) {
      setAnalysis(analysisCache[f.id])
      if (!cachedH2h) {
        const h2h = await loadH2H(f)
        if (h2h) setSelected(prev => (prev && prev.id === f.id ? { ...prev, h2h } : prev))
      }
      return
    }
    setAnalysis(null)
    if (!cachedH2h) {
      const h2h = await loadH2H(f)
      if (h2h) setSelected(prev => (prev && prev.id === f.id ? { ...prev, h2h } : prev))
    }
    // No auto-fire — user taps "Run Analysis" from the preview.
  }

  async function runAnalysis(fx) {
    setLoading(true); setError(null); setAnalysis(null)
    try {
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildPrompt(fx) },
            ],
            max_tokens: 1500,
            temperature: 0.75,
            top_p: 0.9,
          }),
        },
      )
      const data = await res.json()
      console.log('Groq response:', JSON.stringify(data, null, 2))
      const raw = data.choices?.[0]?.message?.content || ''
      const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      const noFences = noThink.replace(/```json|```/g, '').trim()
      const first = noFences.indexOf('{')
      const last = noFences.lastIndexOf('}')
      if (first === -1 || last === -1) throw new Error('No JSON object found in model output')
      const jsonSlice = noFences.slice(first, last + 1)
      const parsed = JSON.parse(jsonSlice)
      parsed._ts = Date.now()
      parsed.kelly = calculateKelly(parsed, fx)
      parsed.fixtureId = fx.id
      parsed.competitionCode = fx.competitionCode
      setAnalysis(parsed)
      setAnalysisCache(prev => ({ ...prev, [fx.id]: parsed }))
      setApiStatus(s => ({ ...s, analysis: 'operational' }))
      setApiHealth(h => ({ ...h, analysis: { code: 200, msg: `OK · ${fx.homeTeam} vs ${fx.awayTeam}`, at: Date.now() } }))

      // Fire multi-market in background (fire-and-forget)
      runMultiMarketAnalysis(fx, parsed).then(multi => {
        if (multi && multi.length) {
          const enriched = { ...parsed, multiMarket: multi }
          setAnalysis(a => a && a.fixtureId === fx.id ? enriched : a)
          setAnalysisCache(prev => ({ ...prev, [fx.id]: enriched }))
        }
      }).catch(e => console.warn('multi-market failed:', e.message))
    } catch (e) {
      console.error('groq call failed:', e)
      setError(e.message || 'Analysis failed.')
      setApiStatus(s => ({ ...s, analysis: 'degraded' }))
      setApiHealth(h => ({ ...h, analysis: { code: null, msg: e.message || 'Groq call failed', at: Date.now() } }))
    } finally {
      setLoading(false)
    }
  }

  function toggleTracked(id) {
    setTracked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function switchTab(t) {
    setActiveTab(t)
    if (isMobile) setSelected(null)
  }

  const unread = useMemo(
    () => Object.keys(analysisCache).length,
    [analysisCache]
  )

  /* -------- render helpers per screen -------- */

  const showAnalysisMobile = isMobile && !!selected

  function renderTabContent() {
    if (activeTab === 'today') {
      if (fixturesLoading) {
        return (
          <div style={{ padding: 16 }}>
            <Card style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <Skeleton w={72} h={20} style={{ marginBottom: 8 }} />
                  <Skeleton w={140} h={11} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Skeleton w={72} h={26} style={{ borderRadius: 6 }} />
                  <Skeleton w={78} h={26} style={{ borderRadius: 6 }} />
                </div>
              </div>
            </Card>
            <FixtureListSkeleton />
          </div>
        )
      }
      if (fixturesError) {
        return (
          <div style={{ padding: 16 }}>
            <div style={{
              borderLeft: `3px solid ${D.danger}`, padding: '12px 16px',
              background: D.surface1, borderRadius: RADIUS.md,
            }}>
              <div style={{ ...TYPE.body, color: D.text0 }}>Could not load fixtures</div>
              <div style={{ ...TYPE.caption, color: D.text1, margin: '4px 0 12px' }}>{fixturesError}</div>
              <SecondaryButton onClick={loadFixtures}>Retry</SecondaryButton>
            </div>
          </div>
        )
      }
      if (fixtures.length === 0) {
        return (
          <div style={{ padding: 40 }}>
            <EmptyState
              variant="fixtures"
              title="No fixtures in this view"
              hint="Try a different filter, or check back closer to matchday."
              action={<SecondaryButton onClick={loadFixtures} style={{ marginTop: 8 }}>Retry</SecondaryButton>}
            />
          </div>
        )
      }
      return (
        <TodayContent
          fixtures={fixtures}
          oddsUpdatedAt={oddsUpdatedAt}
          analysisCache={analysisCache}
          tracked={tracked}
          onOpen={openFixture}
          onToggleTrack={toggleTracked}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          refreshTimer={refreshTimer}
          isMobile={isMobile}
          onAnalyze={async (f) => {
            await openFixture(f)
            if (!analysisCache[f.id]) runAnalysis(f)
            setTimeout(() => {
              try {
                document.getElementById('miq-analysis-anchor')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              } catch {}
            }, 250)
          }}
        />
      )
    }
    if (activeTab === 'picks')    return <PicksContent    fixtures={fixtures} analysisCache={analysisCache} onOpen={openFixture}
      parlaySelections={parlaySelections} onToggleParlay={toggleParlay} onClearParlay={clearParlay} />
    if (activeTab === 'tracking') return <TrackingContent fixtures={fixtures} analysisCache={analysisCache} tracked={tracked} onOpen={openFixture} onToggleTrack={toggleTracked} onSwitchTab={setActiveTab} onResolve={resolveManual} />
    if (activeTab === 'accuracy') return <AccuracyContent fixtures={fixtures} analysisCache={analysisCache} onResolve={resolveManual} />
    if (activeTab === 'research') return (
      <ResearchContent
        fixtures={fixtures} analysisCache={analysisCache}
        standingsCache={standingsCache} scorersCache={scorersCache}
        compDetailsCache={compDetailsCache} agentPerf={agentPerf}
      />
    )
    return null
  }

  /* -------- layouts -------- */

  const shell = {
    background: D.surface0, minHeight: '100vh', color: D.text0, fontFamily: D.sans,
  }

  const commonOverlays = (
    <>
      <SearchPalette
        open={searchOpen} initialTab="search" onClose={() => setSearchOpen(false)}
        fixtures={fixtures} analysisCache={analysisCache}
        onOpenFixture={openFixture} unread={unread}
      />
      <SearchPalette
        open={notificationsOpen} initialTab="notifications" onClose={() => setNotificationsOpen(false)}
        fixtures={fixtures} analysisCache={analysisCache}
        onOpenFixture={openFixture} unread={unread}
      />
      <MorePanel
        open={moreOpen} onClose={() => setMoreOpen(false)}
        isMobile={isMobile} apiStatus={apiStatus}
      />
      <BottomTabBar
        activeTab={activeTab} onTab={switchTab}
        onMore={() => setMoreOpen(o => !o)} moreOpen={moreOpen}
        isMobile={isMobile}
      />
      <DiagnosticPanel
        apiHealth={apiHealth}
        open={diagOpen}
        onToggle={() => setDiagOpen(o => !o)}
        onRetryFootball={() => loadFixtures()}
        onRetryOdds={() => loadOdds()}
      />
    </>
  )

  const liveCount = fixtures.filter(f => f.status === 'LIVE' || f.status === 'IN_PLAY').length
  const analysedCount = Object.keys(analysisCache).length
  const headerProps = {
    onSearch: () => setSearchOpen(true),
    onBell: () => setNotificationsOpen(true),
    unread, theme, onToggleTheme: toggleTheme,
    apiStatus, liveCount, analysedCount, refreshTimer,
  }

  if (isMobile) {
    return (
      <div data-theme={theme} style={shell}>
        <GlobalStyles />
        <Header {...headerProps} />
        <IntelligenceFeed fixtures={fixtures} analysisCache={analysisCache} refreshTimer={refreshTimer} />
        <div style={{ paddingBottom: 76 }}>
          {showAnalysisMobile
            ? <AnalysisScreen
                fixture={selected} data={analysis} loading={loading} error={error}
                isMobile onBack={() => { setSelected(null); setAnalysis(null); setError(null) }}
                onRetry={() => runAnalysis(selected)}
                onAnalyze={() => runAnalysis(selected)}
              />
            : renderTabContent()}
        </div>
        {commonOverlays}
      </div>
    )
  }

  // Desktop — bottom bar everywhere, no sidebar
  return (
    <div data-theme={theme} style={shell}>
      <GlobalStyles />
      <Header {...headerProps} />
      <IntelligenceFeed fixtures={fixtures} analysisCache={analysisCache} refreshTimer={refreshTimer} />
      {isWide && activeTab === 'today' && !selected ? (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 112px - 76px)', paddingBottom: 76 }}>
          <div style={{ width: 400, borderRight: `1px solid ${D.border}`, overflowY: 'auto', maxHeight: 'calc(100vh - 112px - 76px)' }}>
            {renderTabContent()}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 112px - 76px)' }}>
            <div style={{ padding: 40 }}>
              <EmptyState
                title="Select a fixture"
                hint="Pick a match from the list to see the synthesis output."
              />
            </div>
          </div>
        </div>
      ) : isWide && activeTab === 'today' && selected ? (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 112px - 76px)', paddingBottom: 76 }}>
          <div style={{ width: 400, borderRight: `1px solid ${D.border}`, overflowY: 'auto', maxHeight: 'calc(100vh - 112px - 76px)' }}>
            {renderTabContent()}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 112px - 76px)' }}>
            <AnalysisScreen
              fixture={selected} data={analysis} loading={loading} error={error}
              isMobile={false}
              onBack={() => { setSelected(null); setAnalysis(null); setError(null) }}
              onRetry={() => runAnalysis(selected)}
              onAnalyze={() => runAnalysis(selected)}
            />
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px 76px', maxWidth: 820, margin: '0 auto', width: '100%' }}>
          {selected
            ? <AnalysisScreen
                fixture={selected} data={analysis} loading={loading} error={error}
                isMobile={false}
                onBack={() => { setSelected(null); setAnalysis(null); setError(null) }}
                onRetry={() => runAnalysis(selected)}
                onAnalyze={() => runAnalysis(selected)}
              />
            : renderTabContent()}
        </div>
      )}
      {commonOverlays}
    </div>
  )
}
