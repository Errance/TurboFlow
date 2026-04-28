import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatchById } from '../data/soccer/mockData'
import Tabs from '../components/ui/Tabs'
import MatchHeader from '../components/soccer/MatchHeader'
import MarketRenderer from '../components/soccer/MarketRenderer'
import SoccerBetSlip from '../components/soccer/SoccerBetSlip'
import MyBetsPanel from '../components/soccer/MyBetsPanel'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import Button from '../components/ui/Button'
import { SoccerMatchSkeleton } from '../components/soccer/SoccerSkeletons'
import { useSoccerBetSlipStore } from '../stores/soccerBetSlipStore'
import { makeSelectionKey, seedOdds } from '../services/oddsRegistry'
import { markKeysLive } from '../services/oddsTicker'
import type { Market } from '../data/soccer/types'
import { canCombine, getMarketFamily } from '../data/soccer/marketFamily'

const MARKET_COLLAPSE_THRESHOLD = 6

function MarketList({
  tabId,
  markets,
  matchId,
  selectedKeys,
  selectedMarkets,
  bettingClosed,
  onSelect,
  onClearMarket,
}: {
  tabId: string
  markets: Market[]
  matchId: string
  selectedKeys: Set<string>
  selectedMarkets: Array<{ title: string; family: ReturnType<typeof getMarketFamily> }>
  bettingClosed: boolean
  onSelect: (market: string, selection: string, odds: number) => void
  onClearMarket: (marketTitle: string) => void
}) {
  const [expandedState, setExpandedState] = useState({ tabId, expanded: false })
  const expanded = expandedState.tabId === tabId ? expandedState.expanded : false

  const over = markets.length > MARKET_COLLAPSE_THRESHOLD
  const visible = !over || expanded ? markets : markets.slice(0, MARKET_COLLAPSE_THRESHOLD)

  return (
    <div className="mt-4 space-y-3">
      {visible.map((market, i) => {
        const selectedKey = [...selectedKeys].find((k) => k.startsWith(market.title + '|'))
        const family = getMarketFamily(market.title)
        const conflict = selectedKey
          ? null
          : selectedMarkets.find((existing) => {
              if (existing.title === market.title) return false
              return !canCombine(family, existing.family).ok
            })
        const verdict = conflict ? canCombine(family, conflict.family) : null
        return (
          <MarketRenderer
            key={`${tabId}-${i}`}
            market={market}
            displayTitle={market.title}
            matchId={matchId}
            onSelect={onSelect}
            selectedKey={selectedKey}
            conflictWith={bettingClosed ? undefined : conflict?.title}
            conflictReason={!bettingClosed && verdict && !verdict.ok ? verdict.reason : undefined}
            onReplaceConflict={!bettingClosed && conflict ? () => onClearMarket(conflict.title) : undefined}
            bettingClosed={bettingClosed}
          />
        )
      })}
      {over && (
        <button
          onClick={() => setExpandedState({ tabId, expanded: !expanded })}
          className="w-full py-2 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {expanded ? '收起盘口' : `展开其余 ${markets.length - MARKET_COLLAPSE_THRESHOLD} 个盘口`}
        </button>
      )}
    </div>
  )
}

const ENDED_STATUSES = new Set([
  'live',
  'finished',
  'interrupted',
  'abandoned',
  'postponed',
  'cancelled',
])

/**
 * 枚举单个盘口里全部可选项（selection, odds），供 oddsRegistry seed 使用。
 * 只处理能参与抖动的类型；playerList / comboGrid 暂不接入 ticker（demo 足够）。
 */
function enumerateSelections(market: Market): Array<[string, number]> {
  const out: Array<[string, number]> = []
  switch (market.type) {
    case 'buttonGroup':
    case 'rangeButtons':
      for (const opt of market.options) out.push([opt.label, opt.odds])
      break
    case 'oddsTable':
      for (const row of market.rows) {
        row.odds.forEach((odd, i) => {
          const sel = `${market.columns[i]} ${row.line}`
          out.push([sel, odd])
        })
      }
      break
    case 'scoreGrid':
      for (const h of market.homeRange) {
        for (const a of market.awayRange) {
          const scoreKey = `${h}:${a}`
          const odd = market.odds[scoreKey]
          if (odd) out.push([scoreKey, odd])
        }
      }
      break
  }
  return out
}

export default function SoccerMatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const match = getMatchById(matchId ?? '')

  const [activeTab, setActiveTab] = useState('home')
  const [bootstrapped, setBootstrapped] = useState(false)

  const toggleItem = useSoccerBetSlipStore((s) => s.toggleItem)
  const purgeVoid = useSoccerBetSlipStore((s) => s.purgeVoid)
  const removeByMatchTitle = useSoccerBetSlipStore((s) => s.removeByMatchTitle)
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

  const selectedMarkets = useMemo(() => {
    if (!match) return []
    return allItems
      .filter((it) => it.matchId === match.id)
      .map((it) => ({ title: it.marketTitle, family: it.marketFamily }))
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

  useEffect(() => {
    const id = window.setTimeout(() => setBootstrapped(true), 120)
    return () => window.clearTimeout(id)
  }, [matchId])

  // Seed oddsRegistry + 根据比赛 live 状态切换 ticker 抖动白名单
  useEffect(() => {
    if (!match) return
    const pairs: Array<[string, number]> = []
    for (const tab of match.tabs) {
      for (const m of tab.markets) {
        if (m.status && m.status !== 'open') continue
        for (const [sel, odds] of enumerateSelections(m)) {
          pairs.push([makeSelectionKey(match.id, m.title, sel), odds])
        }
      }
    }
    seedOdds(pairs)
    const keys = pairs.map(([k]) => k)
    markKeysLive(keys, false)
    return () => {
      markKeysLive(keys, false)
    }
  }, [match])

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
  const bettingClosed = match.status !== 'scheduled'

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
            matchId={match.id}
            selectedKeys={selectedKeys}
            selectedMarkets={selectedMarkets}
            bettingClosed={bettingClosed}
            onSelect={handleSelect}
            onClearMarket={(title) => match && removeByMatchTitle(match.id, title)}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-[380px] shrink-0 sticky top-20 self-start space-y-4">
          {hasInfoPanel && <MatchInfoPanel match={match} />}

          <SoccerBetSlip
            currentMatchId={match.id}
            suspendedMarkets={suspendedMarkets}
            matchStatus={match.status}
          />

          <MyBetsPanel />
        </div>
      </div>
    </div>
  )
}
