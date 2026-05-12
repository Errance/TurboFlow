import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AmmMarketCard,
  AmmPortfolioPanel,
  AmmTradePanel,
  PriceFormatToggle,
} from '../components/soccer/AmmMarketComponents'
import Button from '../components/ui/Button'
import MatchHeader from '../components/soccer/MatchHeader'
import MatchInfoPanel from '../components/soccer/MatchInfoPanel'
import { SoccerMatchSkeleton } from '../components/soccer/SoccerSkeletons'
import { getMatchById } from '../data/soccer/mockData'
import {
  marketsByMatch,
  type AmmMarket,
  type AmmOutcome,
  type PriceFormat,
} from '../data/soccer/ammMarkets'

export default function SoccerMatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const match = getMatchById(matchId ?? '')
  const markets = marketsByMatch(matchId ?? '')
  const [bootstrapped, setBootstrapped] = useState(false)
  const [priceFormat, setPriceFormat] = useState<PriceFormat>('probability')
  const [selected, setSelected] = useState(() => {
    const market = markets[0]
    return market ? { market, outcome: market.outcomes[0] } : undefined
  })

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
          返回足球 AMM
        </Button>
      </div>
    )
  }

  const groups = Array.from(new Set(markets.map((market) => market.group)))
  const hasInfoPanel = !!(match.homeLineup || match.headToHead || match.stats)
  const effectiveSelected = selected && markets.some((market) => market.id === selected.market.id)
    ? selected
    : markets[0]
      ? { market: markets[0], outcome: markets[0].outcomes[0] }
      : undefined

  const handleSelect = (market: AmmMarket, outcome: AmmOutcome) => {
    setSelected({ market, outcome })
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <nav className="mb-4 flex min-h-[44px] items-center gap-1 text-sm">
        <button onClick={() => navigate('/soccer')} className="text-[var(--text-secondary)] transition-colors hover:text-[#2DD4BF]">
          足球 AMM
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button onClick={() => navigate(`/soccer?league=${match.leagueId}`)} className="text-[var(--text-secondary)] transition-colors hover:text-[#2DD4BF]">
          {match.league}
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="truncate font-medium text-[var(--text-primary)]">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </span>
      </nav>

      <div className="flex flex-col gap-6 xl:flex-row">
        <main className="min-w-0 flex-1">
          <MatchHeader match={match} />

          <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#2DD4BF]">单场预测 · AMM 即时交易</p>
                <h1 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">交易本场 outcome 预测份额</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  选择赛果、大小球、晋级或球队表现 outcome 后，通过右侧交易面板买入或卖出 shares。关键事件、VAR、进球和外部报价异常会触发暂停并要求重新询价。
                </p>
              </div>
              <PriceFormatToggle value={priceFormat} onChange={setPriceFormat} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.map((group) => (
                <span key={group} className="rounded-full bg-[var(--bg-control)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                  {group}
                </span>
              ))}
            </div>
          </section>

          {markets.length === 0 && (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">该比赛暂无 AMM 市场。</p>
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {markets.map((market) => (
              <AmmMarketCard
                key={market.id}
                market={market}
                priceFormat={priceFormat}
                selectedOutcomeId={effectiveSelected?.market.id === market.id ? effectiveSelected.outcome.id : undefined}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </main>

        <aside className="space-y-4 xl:w-[380px] xl:shrink-0">
          {hasInfoPanel && <MatchInfoPanel match={match} />}
          <AmmTradePanel market={effectiveSelected?.market} outcome={effectiveSelected?.outcome} priceFormat={priceFormat} />
          <AmmPortfolioPanel compact />
        </aside>
      </div>
    </div>
  )
}
