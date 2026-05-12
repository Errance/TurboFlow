import { useMemo, useState } from 'react'
import { formatAmmPrice, formatProbability } from '../../data/soccer/ammData'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'

type Filter = 'all' | 'single' | 'futures'

export default function AmmPortfolioPanel({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all')
  const positions = useSoccerAmmStore((state) => state.positions)
  const trades = useSoccerAmmStore((state) => state.trades)
  const priceFormat = useSoccerAmmStore((state) => state.priceFormat)
  const selectOutcome = useSoccerAmmStore((state) => state.selectOutcome)
  const portfolioValue = useSoccerAmmStore((state) => state.getPortfolioValue())
  const unrealizedPnl = useSoccerAmmStore((state) => state.getUnrealizedPnl())

  const visiblePositions = useMemo(() => {
    if (filter === 'single') return positions.filter((item) => !item.outcomeId.startsWith('future-'))
    if (filter === 'futures') return positions.filter((item) => item.outcomeId.startsWith('future-'))
    return positions
  }, [positions, filter])

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Portfolio / 我的持仓</h3>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">持仓可部分卖出、全部卖出或等待结算</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-secondary)]">持仓市值</p>
          <p className="text-sm font-mono text-[var(--text-primary)]">{portfolioValue.toFixed(2)} USDT</p>
          <p className={`text-[10px] font-mono ${unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            未实现 {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['all', '全部'],
            ['single', '单场预测'],
            ['futures', '冠军与晋级'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id as Filter)}
              className={`rounded-lg px-2.5 py-1 text-[10px] transition-colors ${
                filter === id
                  ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                  : 'bg-[var(--bg-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {visiblePositions.length === 0 && (
          <p className="rounded-lg bg-[var(--bg-control)] px-3 py-4 text-center text-xs text-[var(--text-secondary)]">
            暂无持仓，买入 outcome 后会显示在这里。
          </p>
        )}
        {visiblePositions.slice(0, compact ? 3 : undefined).map((position) => {
          const marketValue = position.shares * position.currentProbability
          const unrealized = position.shares * (position.currentProbability - position.avgPrice)
          return (
            <article key={position.id} className="rounded-lg bg-[var(--bg-control)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] text-[var(--text-secondary)]">{position.subjectLabel}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[var(--text-primary)]">{position.marketTitle} · {position.outcomeLabel}</p>
                </div>
                <span className={`shrink-0 text-xs font-mono ${unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {unrealized >= 0 ? '+' : ''}{unrealized.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                <Metric label="份额" value={position.shares.toFixed(2)} />
                <Metric label="均价" value={formatAmmPrice(position.avgPrice, priceFormat)} />
                <Metric label="现价" value={formatAmmPrice(position.currentProbability, priceFormat)} />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[var(--border)]/50 pt-2">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  市值 {marketValue.toFixed(2)} USDT · 概率 {formatProbability(position.currentProbability)}
                </span>
                <button
                  onClick={() => selectOutcome({
                    id: position.outcomeId,
                    subject: { scope: position.outcomeId.startsWith('future-') ? 'competition' : 'match', id: position.outcomeId.split('::')[0], label: position.subjectLabel, resolutionTimeLabel: '官方结果确认后', resolutionSource: '官方结果' },
                    marketTitle: position.marketTitle,
                    marketKind: 'binary',
                    label: position.outcomeLabel,
                    questionTitle: `${position.marketTitle} · ${position.outcomeLabel}`,
                    resolutionRule: '按市场官方规则结算。',
                    probability: position.currentProbability,
                    liquidity: 10_000,
                    volume24h: 0,
                    priceChange24h: 0,
                    status: 'open',
                    voidRule: '按 void 规则退款。',
                    delayOrDisputePolicy: '等待官方确认。',
                  }, 'sell')}
                  className="text-[10px] text-[#2DD4BF] hover:underline"
                >
                  卖出
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {!compact && trades.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <p className="mb-2 text-xs font-semibold text-[var(--text-primary)]">最近成交</p>
          <div className="space-y-1.5">
            {trades.slice(0, 5).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px]">
                <span className="truncate text-[var(--text-secondary)]">{trade.side === 'buy' ? '买入' : '卖出'} {trade.marketTitle} · {trade.outcomeLabel}</span>
                <span className="font-mono text-[var(--text-primary)]">{trade.collateral.toFixed(2)} USDT</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--text-secondary)]">{label}</p>
      <p className="mt-0.5 font-mono text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
