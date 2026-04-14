import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClobMatchById } from '../data/clob/mockData'
import type { TradingSelection } from '../data/clob/types'
import { useClobStore } from '../stores/clobStore'
import Tabs from '../components/ui/Tabs'
import MatchHeader from '../components/soccer/MatchHeader'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import ClobMarketRenderer from '../components/clob/ClobMarketRenderer'
import TradingPanel from '../components/clob/TradingPanel'
import PositionsPanel from '../components/clob/PositionsPanel'
import WalletBar from '../components/clob/WalletBar'
import Button from '../components/ui/Button'
import type { SoccerMatch } from '../data/soccer/types'

export default function ClobMatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const clobMatch = getClobMatchById(matchId ?? '')
  const { selection, setSelection, startSimulation, stopSimulation } = useClobStore()

  const [activeTab, setActiveTab] = useState(() => clobMatch?.tabs[0]?.id ?? 'home')

  useEffect(() => {
    startSimulation()
    return () => stopSimulation()
  }, [])

  if (!clobMatch) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[var(--text-secondary)]">比赛未找到</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/clob')}>
          返回赛事列表
        </Button>
      </div>
    )
  }

  const currentTab = clobMatch.tabs.find((t) => t.id === activeTab) ?? clobMatch.tabs[0]
  const tabItems = clobMatch.tabs.map((t) => ({ id: t.id, label: t.label }))

  const fakeOldMatch = {
    id: clobMatch.id,
    league: clobMatch.league,
    leagueId: clobMatch.leagueId,
    homeTeam: clobMatch.homeTeam,
    awayTeam: clobMatch.awayTeam,
    date: clobMatch.date,
    time: clobMatch.time,
    status: clobMatch.status,
    score: clobMatch.score,
    currentMinute: clobMatch.currentMinute,
    tabs: [],
    referee: clobMatch.referee,
    venue: clobMatch.venue,
    homeLineup: clobMatch.homeLineup,
    awayLineup: clobMatch.awayLineup,
    events: clobMatch.events,
    headToHead: clobMatch.headToHead,
    stats: clobMatch.stats,
  } as unknown as SoccerMatch

  const hasInfoPanel = !!(clobMatch.homeLineup || clobMatch.headToHead || clobMatch.stats)

  const handleSelect = (sel: TradingSelection) => {
    if (selection?.marketId === sel.marketId && selection?.outcomeId === sel.outcomeId && selection?.side === sel.side) {
      setSelection(null)
    } else {
      setSelection(sel)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button onClick={() => navigate('/clob')} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          足球 CLOB
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button onClick={() => navigate(`/clob?league=${clobMatch.leagueId}`)} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          {clobMatch.league}
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium truncate">
          {clobMatch.homeTeam.name} vs {clobMatch.awayTeam.name}
        </span>
      </nav>

      {/* Wallet */}
      <div className="mb-4">
        <WalletBar />
      </div>

      {/* Main layout */}
      <div className="flex flex-row gap-6">
        {/* Left: Markets */}
        <div className="flex-1 min-w-0">
          <MatchHeader match={fakeOldMatch} />

          <div className="mt-4">
            <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="mt-4 space-y-3">
            {currentTab?.markets.map((market, i) => (
              <ClobMarketRenderer
                key={`${currentTab.id}-${i}`}
                market={market}
                selection={selection}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[380px] shrink-0 sticky top-20 self-start space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {hasInfoPanel && <MatchInfoPanel match={fakeOldMatch} />}
          <TradingPanel selection={selection} />
          <PositionsPanel />
        </div>
      </div>
    </div>
  )
}
