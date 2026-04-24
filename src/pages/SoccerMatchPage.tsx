import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatchById, myBets } from '../data/soccer/mockData'
import Tabs from '../components/ui/Tabs'
import MatchHeader from '../components/soccer/MatchHeader'
import MarketRenderer from '../components/soccer/MarketRenderer'
import SoccerBetSlip from '../components/soccer/SoccerBetSlip'
import MyBetsPanel from '../components/soccer/MyBetsPanel'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import Button from '../components/ui/Button'
import { useSoccerBetSlipStore } from '../stores/soccerBetSlipStore'

const ENDED_STATUSES = new Set(['finished', 'abandoned', 'cancelled', 'corrected'])

export default function SoccerMatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const match = getMatchById(matchId ?? '')

  const [activeTab, setActiveTab] = useState('home')

  const toggleItem = useSoccerBetSlipStore((s) => s.toggleItem)
  const purgeVoid = useSoccerBetSlipStore((s) => s.purgeVoid)
  const allItems = useSoccerBetSlipStore((s) => s.items)

  const handleSelect = useCallback(
    (marketTitle: string, selection: string, odds: number) => {
      if (!match || ENDED_STATUSES.has(match.status)) return
      toggleItem({
        matchId: match.id,
        matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        marketTitle,
        selection,
        odds,
      })
    },
    [match, toggleItem]
  )

  const selectedKeys = useMemo(() => {
    if (!match) return new Set<string>()
    const keys = new Set<string>()
    for (const it of allItems) {
      if (it.matchId === match.id) keys.add(`${it.marketTitle}|${it.selection}`)
    }
    return keys
  }, [allItems, match])

  const { suspendedMarkets, voidMarkets } = useMemo(() => {
    const suspended = new Set<string>()
    const voided = new Set<string>()
    if (match) {
      for (const tab of match.tabs) {
        for (const m of tab.markets) {
          if (m.status === 'suspended') suspended.add(m.title)
          if (m.status === 'void') voided.add(m.title)
        }
      }
    }
    return { suspendedMarkets: suspended, voidMarkets: voided }
  }, [match])

  useEffect(() => {
    if (!match) return
    purgeVoid(match.id, voidMarkets)
  }, [match, voidMarkets, purgeVoid])

  if (!match) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[var(--text-secondary)]">比赛未找到</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/soccer')}>
          返回赛事列表
        </Button>
      </div>
    )
  }

  const currentTab = match.tabs.find((t) => t.id === activeTab) ?? match.tabs[0]
  const tabItems = match.tabs.map((t) => ({ id: t.id, label: t.label }))
  const hasInfoPanel = !!(match.homeLineup || match.headToHead || match.stats)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Top bar */}
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button onClick={() => navigate('/soccer')} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          足球
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button onClick={() => navigate(`/soccer?league=${match.leagueId}`)} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          {match.league}
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium truncate">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </span>
      </nav>

      {/* Desktop layout: left markets + right info panel */}
      <div className="flex flex-row gap-6">
        {/* Left: Markets */}
        <div className="flex-1 min-w-0">
          <MatchHeader match={match} />

          <div className="mt-4">
            <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="mt-4 space-y-3">
            {currentTab?.markets.map((market, i) => (
              <MarketRenderer
                key={`${currentTab.id}-${i}`}
                market={market}
                displayTitle={market.title}
                onSelect={handleSelect}
                selectedKey={[...selectedKeys].find((k) => k.startsWith(market.title + '|'))}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[380px] shrink-0 sticky top-20 self-start space-y-4">
          {hasInfoPanel && <MatchInfoPanel match={match} />}

          <SoccerBetSlip
            currentMatchId={match.id}
            suspendedMarkets={suspendedMarkets}
            matchStatus={match.status}
          />

          <MyBetsPanel bets={myBets} />
        </div>
      </div>
    </div>
  )
}
