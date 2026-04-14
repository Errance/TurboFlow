import { matches as oldMatches, leagues } from '../soccer/mockData'
import type { ClobMatchSummary } from './types'
import { buildClobTabs, countMarkets, extractMoneyline, extractTotalLine, extractAsianLine } from './converter'

export { leagues }

export const clobMatches: ClobMatchSummary[] = oldMatches.map(old => {
  const tabs = buildClobTabs(old.tabs)
  const moneyline = extractMoneyline(tabs)
  const totalLine = extractTotalLine(tabs)
  const asianLine = extractAsianLine(tabs)

  return {
    id: old.id,
    league: old.league,
    leagueId: old.leagueId,
    homeTeam: old.homeTeam,
    awayTeam: old.awayTeam,
    date: old.date,
    time: old.time,
    status: old.status,
    score: old.score,
    currentMinute: old.currentMinute,
    moneyline,
    totalLine,
    asianLine,
    marketCount: countMarkets(tabs),
    tabs,
    referee: old.referee,
    venue: old.venue,
    homeLineup: old.homeLineup,
    awayLineup: old.awayLineup,
    events: old.events,
    headToHead: old.headToHead,
    stats: old.stats,
  }
})

export function getClobMatchById(id: string): ClobMatchSummary | undefined {
  return clobMatches.find(m => m.id === id)
}
