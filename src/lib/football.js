/* football-data.org response shaping. */

/* Maps a raw /v4/matches item to the internal fixture shape the UI consumes.
 * Returns null for malformed items so callers can .filter(Boolean). */
export function mapMatch(item) {
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

/* W/D/L for a given team in a finished match. Null if the score is incomplete. */
export function resultForTeam(match, teamId) {
  const home = match.score?.fullTime?.home
  const away = match.score?.fullTime?.away
  if (home == null || away == null) return null
  const isHome = match.homeTeam?.id === teamId
  if (home === away) return 'D'
  const homeWon = home > away
  return isHome === homeWon ? 'W' : 'L'
}
