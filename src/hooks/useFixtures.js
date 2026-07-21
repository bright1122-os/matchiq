import { useState } from 'react'
import { delay } from '../lib/storage.js'
import { mapMatch } from '../lib/football.js'

/* Fixture loading + team form enrichment + head-to-head on selection.
 *
 * loadTeamForms stays here because it mutates the fixture list directly via
 * setFixtures. The competition-data trigger does NOT live here — App.jsx runs
 * it as an effect watching `fixtures`, so this hook only fetches the matches
 * and their recent form.
 *
 * apiStatus/apiHealth are owned by useApiHealth and injected as setStatus /
 * setHealth so the DiagnosticPanel keeps reading a single shared surface. */
export function useFixtures({ setStatus, setHealth }) {
  const [fixtures, setFixtures] = useState([])
  const [fixturesLoading, setFixturesLoading] = useState(true)
  const [fixturesError, setFixturesError] = useState(null)
  const [h2hCache, setH2hCache] = useState({})

  async function fetchRange(fromStr, toStr) {
    const url = `/api/football/v4/matches?dateFrom=${fromStr}&dateTo=${toStr}`
    let res
    try {
      res = await fetch(url)
    } catch (e) {
      setHealth('football', { code: null, msg: `Network: ${e.message}`, count: null, at: Date.now() })
      throw new Error(`Network failure — proxy or dev server unreachable (${e.message})`)
    }
    if (res.status === 401 || res.status === 403) {
      setHealth('football', { code: res.status, msg: 'API key rejected', count: null, at: Date.now() })
      throw new Error('API key rejected — verify FOOTBALL_API_KEY in Vercel env (or .env locally) is active.')
    }
    if (res.status === 429) {
      setHealth('football', { code: 429, msg: 'Rate limited (10 req/min free tier)', count: null, at: Date.now() })
      return []
    }
    if (!res.ok) {
      setHealth('football', { code: res.status, msg: `HTTP ${res.status}`, count: null, at: Date.now() })
      return []
    }
    const data = await res.json()
    const matches = (data.matches || []).map(mapMatch).filter(Boolean)
    setHealth('football', { code: 200, msg: `OK · ${fromStr} → ${toStr}`, count: matches.length, at: Date.now() })
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
      setStatus('football', 'operational')
      loadTeamForms(all.slice(0, 10))
    } catch (err) {
      const msg = /disabled|forbidden|401|403/i.test(err.message || '')
        ? 'API key rejected — verify FOOTBALL_API_KEY in Vercel env (or .env locally) is active.'
        : err.message || 'Unknown error loading fixtures'
      setFixturesError(msg)
      setStatus('football', 'degraded')
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

  return { fixtures, fixturesLoading, fixturesError, loadFixtures, h2hCache, loadH2H }
}
