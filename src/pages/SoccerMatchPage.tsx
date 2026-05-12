import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatchById } from '../data/soccer/mockData'
import Tabs from '../components/ui/Tabs'
import MatchHeader from '../components/soccer/MatchHeader'
import AmmMarketRenderer from '../components/soccer/AmmMarketRenderer'
import AmmTradePanel from '../components/soccer/AmmTradePanel'
import AmmPortfolioPanel from '../components/soccer/AmmPortfolioPanel'
import SoccerPriceFormatToggle from '../components/soccer/SoccerPriceFormatToggle'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import Button from '../components/ui/Button'
import { SoccerMatchSkeleton } from '../components/soccer/SoccerSkeletons'
import type { Market } from '../data/soccer/types'
import { subjectFromMatch } from '../data/soccer/ammData'

const MARKET_COLLAPSE_THRESHOLD = 6

function MarketList({
  tabId,
  markets,
  subject,
}: {
  tabId: string
  markets: Market[]
  subject: ReturnType<typeof subjectFromMatch>
}) {
  const [expandedState, setExpandedState] = useState({ tabId, expanded: false })
  const expanded = expandedState.tabId === tabId ? expandedState.expanded : false

  const over = markets.length > MARKET_COLLAPSE_THRESHOLD
  const visible = !over || expanded ? markets : markets.slice(0, MARKET_COLLAPSE_THRESHOLD)

  return (
    <div className="mt-4 space-y-3">
      {visible.map((market, i) => {
        return (
          <AmmMarketRenderer
            key={`${tabId}-${i}`}
            market={market}
            displayTitle={market.title}
            subject={subject}
          />
        )
      })}
      {over && (
        <button
          onClick={() => setExpandedState({ tabId, expanded: !expanded })}
          className="w-full py-2 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {expanded ? '收起市场' : `展开其余 ${markets.length - MARKET_COLLAPSE_THRESHOLD} 个市场`}
        </button>
      )}
    </div>
  )
}

export default function SoccerMatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const match = getMatchById(matchId ?? '')

  const [activeTab, setActiveTab] = useState('home')
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setBootstrapped(true), 120)
    return () => window.clearTimeout(id)
  }, [matchId])

  if (!bootstrapped) return <SoccerMatchSkeleton />

  if (!match) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[var(--text-secondary)]">未找到该场比赛</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/soccer')}>
          返回赛事列表
        </Button>
      </div>
    )
  }

  const currentTab = match.tabs.find((t) => t.id === activeTab) ?? match.tabs[0]
  const tabItems = match.tabs.map((t) => ({ id: t.id, label: t.label }))
  const hasInfoPanel = !!(match.homeLineup || match.headToHead || match.stats)
  const subject = subjectFromMatch(match)

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

          <MarketList
            tabId={currentTab?.id ?? ''}
            markets={currentTab?.markets ?? []}
            subject={subject}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-[380px] shrink-0 sticky top-20 self-start space-y-4">
          <SoccerPriceFormatToggle />
          {hasInfoPanel && <MatchInfoPanel match={match} />}
          <AmmTradePanel />
          <AmmPortfolioPanel compact />
        </div>
      </div>
    </div>
  )
}
