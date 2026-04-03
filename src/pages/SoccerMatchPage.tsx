import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatchById } from '../data/soccer/mockData'
import { getTurboFlowLabel } from '../data/soccer/turboflowLabels'
import type { BetSlipItem } from '../data/soccer/types'
import Tabs from '../components/ui/Tabs'
import SegmentedControl from '../components/ui/SegmentedControl'
import MatchHeader from '../components/soccer/MatchHeader'
import MarketRenderer from '../components/soccer/MarketRenderer'
import SoccerBetSlip from '../components/soccer/SoccerBetSlip'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import Button from '../components/ui/Button'

export default function SoccerMatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const match = getMatchById(matchId ?? '')

  const [activeTab, setActiveTab] = useState('home')
  const [viewMode, setViewMode] = useState<string>('stake')
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([])

  const handleSelect = useCallback((marketTitle: string, selection: string, odds: number) => {
    if (!match) return
    const id = `${match.id}|${marketTitle}|${selection}`
    setBetSlip((prev) => {
      const exists = prev.find((item) => item.id === id)
      if (exists) return prev.filter((item) => item.id !== id)
      return [...prev, {
        id,
        matchId: match.id,
        matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        marketTitle,
        selection,
        odds,
      }]
    })
  }, [match])

  const selectedKeys = new Set(betSlip.map((item) => `${item.marketTitle}|${item.selection}`))

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
  const isTurboFlow = viewMode === 'turboflow'
  const hasInfoPanel = !!(match.homeLineup || match.headToHead || match.stats)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <nav className="flex items-center gap-1 text-sm min-h-[44px]">
          <button onClick={() => navigate('/soccer')} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
            足球
          </button>
          <span className="text-[var(--text-secondary)]/40">›</span>
          <span className="text-[var(--text-secondary)]">{match.league}</span>
          <span className="text-[var(--text-secondary)]/40">›</span>
          <span className="text-[var(--text-primary)] font-medium truncate">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </span>
        </nav>

        <SegmentedControl
          options={[
            { id: 'stake', label: 'Stake 原始' },
            { id: 'turboflow', label: 'TurboFlow' },
          ]}
          value={viewMode}
          onChange={setViewMode}
          className="w-60"
        />
      </div>

      {/* Desktop layout: left markets + right info panel */}
      <div className="flex flex-row gap-6">
        {/* Left: Markets */}
        <div className="flex-1 min-w-0">
          <MatchHeader match={match} />

          <div className="mt-4">
            <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="mt-4 space-y-3">
            {currentTab?.markets.map((market, i) => {
              const displayTitle = isTurboFlow
                ? getTurboFlowLabel(market.title, match.homeTeam.name, match.awayTeam.name)
                : market.title

              return (
                <MarketRenderer
                  key={`${currentTab.id}-${i}`}
                  market={market}
                  displayTitle={displayTitle}
                  onSelect={handleSelect}
                  selectedKey={[...selectedKeys].find((k) => k.startsWith(market.title + '|'))}
                />
              )
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[380px] shrink-0 sticky top-20 self-start space-y-4">
          {hasInfoPanel && <MatchInfoPanel match={match} />}

          {betSlip.length > 0 && (
            <SoccerBetSlip
              items={betSlip}
              onRemove={(id) => setBetSlip((prev) => prev.filter((item) => item.id !== id))}
              onClear={() => setBetSlip([])}
            />
          )}
        </div>
      </div>
    </div>
  )
}
