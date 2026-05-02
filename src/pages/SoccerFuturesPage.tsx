import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarketRenderer from '../components/soccer/MarketRenderer'
import SoccerBetSlip from '../components/soccer/SoccerBetSlip'
import MyBetsPanel from '../components/soccer/MyBetsPanel'
import { futuresCompetitions, getFutureCompetitionById, enumerateFutureMarketSelections } from '../data/soccer/futuresData'
import { useSoccerBetSlipStore } from '../stores/soccerBetSlipStore'
import { makeSelectionKey, seedOdds } from '../services/oddsRegistry'

export default function SoccerFuturesPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const navigate = useNavigate()
  const competition = getFutureCompetitionById(competitionId ?? '') ?? futuresCompetitions[0]
  const [activeGroup, setActiveGroup] = useState<string>('全部')

  const toggleItem = useSoccerBetSlipStore((s) => s.toggleItem)
  const allItems = useSoccerBetSlipStore((s) => s.items)
  const betType = useSoccerBetSlipStore((s) => s.betType)

  const groups = useMemo(
    () => ['全部', ...Array.from(new Set(competition.markets.map((item) => item.group)))],
    [competition.markets],
  )
  const visibleMarkets = activeGroup === '全部'
    ? competition.markets
    : competition.markets.filter((item) => item.group === activeGroup)

  useEffect(() => {
    const pairs: Array<[string, number]> = []
    for (const item of competition.markets) {
      if (item.market.status && item.market.status !== 'open') continue
      for (const [selection, odds] of enumerateFutureMarketSelections(item.market)) {
        pairs.push([makeSelectionKey(item.subject.subjectId, item.market.title, selection), odds])
      }
    }
    seedOdds(pairs)
  }, [competition])

  const handleSelect = useCallback(
    (marketTitle: string, selection: string, odds: number) => {
      const item = competition.markets.find((entry) => entry.market.title === marketTitle)
      if (!item || item.status !== 'open') return
      toggleItem({
        matchId: item.subject.subjectId,
        matchLabel: item.subject.subjectLabel,
        subject: item.subject,
        marketTitle,
        selection,
        odds,
      })
    },
    [competition.markets, toggleItem],
  )

  const selectedKeys = useMemo(() => {
    const keys = new Set<string>()
    const subjectIds = new Set(competition.markets.map((item) => item.subject.subjectId))
    for (const item of allItems) {
      if (subjectIds.has(item.matchId)) keys.add(`${item.marketTitle}|${item.selection}`)
    }
    return keys
  }, [allItems, competition.markets])

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button onClick={() => navigate('/soccer')} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          足球
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button onClick={() => navigate('/soccer?view=futures')} className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors">
          冠军与晋级
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium truncate">{competition.shortName}</span>
      </nav>

      <div className="flex flex-row gap-6">
        <div className="flex-1 min-w-0">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#2DD4BF] font-semibold">冠军与晋级</p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{competition.name}</h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{competition.headline}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-control)] px-4 py-3 text-right">
                <p className="text-[10px] text-[var(--text-secondary)]">阶段</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{competition.phase}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoPill label="市场粒度" value="赛事 / 赛季 / 淘汰赛" />
              <InfoPill label="报价方式" value="平台欧洲盘报价" />
              <InfoPill label="投注方式" value="多笔单注，暂不串关" />
            </div>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  activeGroup === group
                    ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            {visibleMarkets.map((item) => {
              const selectedKey = [...selectedKeys].find((key) => key.startsWith(item.market.title + '|'))
              return (
                <section key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[10px] text-[#2DD4BF]">{item.group}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{item.subject.resolutionTimeLabel}</span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-secondary)] leading-5">{item.description}</p>
                    </div>
                    <div className="text-right text-[10px] text-[var(--text-secondary)]">
                      <p>关闭时间</p>
                      <p className="mt-0.5 font-mono text-[var(--text-primary)]">{formatCloseTime(item.subject.closesAt)}</p>
                    </div>
                  </div>
                  <MarketRenderer
                    market={item.market}
                    displayTitle={item.market.title}
                    matchId={item.subject.subjectId}
                    onSelect={handleSelect}
                    selectedKey={selectedKey}
                    conflictWith={betType === 'accumulator' ? '串关模式' : undefined}
                    conflictReason={betType === 'accumulator' ? '冠军、晋级和系列赛类盘口暂不支持串关，可作为多笔单注提交。' : undefined}
                  />
                  <p className="mt-2 text-[10px] text-[var(--text-secondary)]">结算来源：{item.subject.resolutionSource}</p>
                </section>
              )
            })}
          </div>
        </div>

        <aside className="w-[380px] shrink-0 sticky top-20 self-start space-y-4">
          <SoccerBetSlip currentMatchId={competition.markets[0]?.subject.subjectId ?? competition.id} />
          <MyBetsPanel />
        </aside>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function formatCloseTime(iso?: string): string {
  if (!iso) return '按市场规则'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '按市场规则'
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
