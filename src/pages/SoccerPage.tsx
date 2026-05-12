import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AmmMarketCard,
  AmmPortfolioPanel,
  AmmTradePanel,
  PriceFormatToggle,
} from '../components/soccer/AmmMarketComponents'
import { SoccerListSkeleton } from '../components/soccer/SoccerSkeletons'
import { leagues, matches } from '../data/soccer/mockData'
import {
  ammMarkets,
  marketsByCategory,
  type AmmMarket,
  type AmmOutcome,
  type PriceFormat,
} from '../data/soccer/ammMarkets'

type SoccerView = 'matches' | 'futures'

function parseView(value: string | null): SoccerView {
  if (value === 'futures') return 'futures'
  return 'matches'
}

function categoryLabel(view: SoccerView): string {
  return view === 'matches' ? '单场预测' : '冠军与晋级'
}

export default function SoccerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedLeague, setSelectedLeague] = useState<string>(() => searchParams.get('league') ?? 'all')
  const [view, setView] = useState<SoccerView>(() => parseView(searchParams.get('view')))
  const [bootstrapped, setBootstrapped] = useState(false)
  const [priceFormat, setPriceFormat] = useState<PriceFormat>('probability')
  const visibleMarkets = useMemo(
    () => marketsByCategory(view === 'matches' ? 'single' : 'futures')
      .filter((market) => {
        if (view !== 'matches' || selectedLeague === 'all') return true
        const match = matches.find((item) => item.id === market.matchId)
        return match?.leagueId === selectedLeague
      }),
    [selectedLeague, view],
  )
  const [selected, setSelected] = useState(() => {
    const market = ammMarkets[0]
    return { market, outcome: market.outcomes[0] }
  })

  useEffect(() => {
    const id = window.setTimeout(() => setBootstrapped(true), 120)
    return () => window.clearTimeout(id)
  }, [])

  if (!bootstrapped) return <SoccerListSkeleton />

  const handleLeagueChange = (id: string) => {
    setSelectedLeague(id)
    const params: Record<string, string> = {}
    if (view !== 'matches') params.view = view
    if (id !== 'all') params.league = id
    setSearchParams(params)
  }

  const handleViewChange = (nextView: SoccerView) => {
    setView(nextView)
    const params: Record<string, string> = {}
    if (nextView !== 'matches') params.view = nextView
    if (selectedLeague !== 'all') params.league = selectedLeague
    setSearchParams(params)
  }

  const handleSelect = (market: AmmMarket, outcome: AmmOutcome) => {
    setSelected({ market, outcome })
  }

  const effectiveSelected = visibleMarkets.some((market) => market.id === selected.market.id)
    ? selected
    : {
        market: visibleMarkets[0] ?? selected.market,
        outcome: (visibleMarkets[0] ?? selected.market).outcomes[0],
      }
  const liveCount = matches.filter((match) => match.status === 'live').length
  const openMarketCount = visibleMarkets.filter((market) => market.status === 'open').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="shrink-0 lg:w-60">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            足球 AMM
          </h2>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
            <button
              onClick={() => handleLeagueChange('all')}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedLeague === 'all'
                  ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-control)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>全部单场赛事</span>
              <span className="font-mono text-[10px]">{marketsByCategory('single').length}</span>
            </button>
            {leagues.map((league) => {
              const count = matches.filter((match) => match.leagueId === league.id).length
              return (
                <button
                  key={league.id}
                  onClick={() => handleLeagueChange(league.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedLeague === league.id
                      ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-control)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="truncate">{league.name}</span>
                  <span className="font-mono text-[10px]">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">实时概览</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="进行中" value={`${liveCount}`} />
              <Metric label="可交易" value={`${openMarketCount}`} />
              <Metric label="24h 成交" value={`${(visibleMarkets.reduce((sum, item) => sum + item.volume24h, 0) / 1000).toFixed(1)}k`} />
              <Metric label="流动性" value={`${(visibleMarkets.reduce((sum, item) => sum + item.liquidity, 0) / 1000).toFixed(0)}k`} />
            </div>
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
              {[
                { id: 'matches' as const, label: '单场预测' },
                { id: 'futures' as const, label: '冠军与晋级' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                    view === item.id
                      ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <PriceFormatToggle value={priceFormat} onChange={setPriceFormat} />
          </div>

          <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="text-xs font-semibold text-[#2DD4BF]">v6.0 AMM 预测市场</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{categoryLabel(view)}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              用户买卖 outcome 的预测份额，形成持仓后可部分卖出、全部卖出或等待结算。概率价格是底层价格，欧洲赔率仅为展示换算；平台不作为交易对手方。
            </p>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            {visibleMarkets.map((market) => (
              <AmmMarketCard
                key={market.id}
                market={market}
                priceFormat={priceFormat}
                selectedOutcomeId={effectiveSelected.market.id === market.id ? effectiveSelected.outcome.id : undefined}
                onSelect={handleSelect}
                onOpen={(item) => {
                  if (item.category === 'single' && item.matchId) navigate(`/soccer/match/${item.matchId}`)
                  if (item.category === 'futures' && item.seriesId) navigate(`/soccer/futures/${item.seriesId}`)
                }}
              />
            ))}
          </div>
        </main>

        <aside className="space-y-4 lg:w-[360px] lg:shrink-0">
          <AmmTradePanel market={effectiveSelected.market} outcome={effectiveSelected.outcome} priceFormat={priceFormat} />
          <AmmPortfolioPanel compact />
        </aside>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
