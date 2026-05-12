import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AmmMarketCard,
  AmmPortfolioPanel,
  AmmTradePanel,
  PriceFormatToggle,
} from '../components/soccer/AmmMarketComponents'
import {
  marketsBySeries,
  type AmmMarket,
  type AmmOutcome,
  type PriceFormat,
} from '../data/soccer/ammMarkets'

const SERIES_META: Record<string, { name: string; shortName: string; region: string; phase: string; headline: string }> = {
  'world-cup-2026': {
    name: 'FIFA World Cup 2026',
    shortName: '世界杯 2026',
    region: '国际',
    phase: '小组赛至决赛',
    headline: '交易小组出线、淘汰赛晋级和最终冠军 outcome 预测份额。',
  },
  'ucl-2026': {
    name: 'UEFA Champions League 2026',
    shortName: '欧冠 2026',
    region: '欧洲',
    phase: '淘汰赛',
    headline: '交易冠军、晋级和两回合系列赛 outcome 预测份额。',
  },
  'premier-league-2026': {
    name: 'Premier League 2025/26',
    shortName: '英超 2025/26',
    region: '英格兰',
    phase: '赛季进行中',
    headline: '交易冠军、欧冠资格和赛季结果 outcome 预测份额。',
  },
}

export default function SoccerFuturesPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const navigate = useNavigate()
  const seriesId = competitionId ?? 'world-cup-2026'
  const markets = marketsBySeries(seriesId)
  const meta = SERIES_META[seriesId] ?? SERIES_META['world-cup-2026']
  const [activeGroup, setActiveGroup] = useState<string>('全部')
  const [priceFormat, setPriceFormat] = useState<PriceFormat>('probability')
  const [selected, setSelected] = useState(() => {
    const market = markets[0]
    return market ? { market, outcome: market.outcomes[0] } : undefined
  })

  const groups = useMemo(() => ['全部', ...Array.from(new Set(markets.map((market) => market.group)))], [markets])
  const effectiveActiveGroup = groups.includes(activeGroup) ? activeGroup : '全部'
  const visibleMarkets = effectiveActiveGroup === '全部' ? markets : markets.filter((market) => market.group === effectiveActiveGroup)
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
        <button onClick={() => navigate('/soccer?view=futures')} className="text-[var(--text-secondary)] transition-colors hover:text-[#2DD4BF]">
          冠军与晋级
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="truncate font-medium text-[var(--text-primary)]">{meta.shortName}</span>
      </nav>

      <div className="flex flex-col gap-6 xl:flex-row">
        <main className="min-w-0 flex-1">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#2DD4BF]">冠军与晋级 · AMM 即时交易</p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{meta.name}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{meta.headline}</p>
              </div>
              <PriceFormatToggle value={priceFormat} onChange={setPriceFormat} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoPill label="区域" value={meta.region} />
              <InfoPill label="阶段" value={meta.phase} />
              <InfoPill label="交易模型" value="持仓 + 卖出 + 结算" />
            </div>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  effectiveActiveGroup === group
                    ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {visibleMarkets.map((market) => (
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
          <AmmTradePanel market={effectiveSelected?.market} outcome={effectiveSelected?.outcome} priceFormat={priceFormat} />
          <AmmPortfolioPanel compact />
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">结算说明</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              长期市场按官方来源结算。官方延迟、资格递补、纪律处罚或赛制变化时，市场进入等待官方结果或作废退款流程。
            </p>
          </section>
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
