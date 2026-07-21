/* Odds API — sport keys and fixture↔event matching. */

export const ODDS_SPORTS = [
  'soccer_fifa_world_cup',
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_1',
  'soccer_uefa_champs_league',
]

/* football-data.org and the-odds-api name teams differently ("Brighton and Hove
 * Albion" vs "Brighton"), so match on bidirectional substring rather than equality. */
export function lookupOddsForFixture(fixture, oddsCache) {
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
