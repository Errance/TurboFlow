import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ammPositions,
  ammTradeHistory,
  decimalOdds,
  getAmmMarketById,
  getOutcome,
  type AmmCategory,
} from '../data/soccer/ammMarkets'

type ScopeFilter = 'all' | AmmCategory
type StateFilter = 'all' | 'tradable' | 'paused' | 'settled'
type SortMode = 'value' | 'pnl' | 'updated'

const SCOPE_TABS: { id: ScopeFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'single', label: '单场预测' },
  { id: 'futures', label: '冠军与晋级' },
]

const STATE_TABS: { id: StateFilter; label: string }[] = [
  { id: 'all', label: '全部状态' },
  { id: 'tradable', label: '可交易' },
  { id: 'paused', label: '暂停 / 待确认' },
  { id: 'settled', label: '已结算' },
]

export default function SoccerMyBetsPage() {
  const navigate = useNavigate()
  const [scope, setScope] = useState<ScopeFilter>('all')
  const [state, setState] = useState<StateFilter>('all')
  const [sort, setSort] = useState<SortMode>('value')

  const rows = useMemo(() => {
    return ammPositions
      .map((position) => {
        const market = getAmmMarketById(position.marketId)
        const outcome = market ? getOutcome(market, position.outcomeId) : undefined
        const currentPrice = outcome?.price ?? position.avgPrice
        const value = position.shares * currentPrice
        const cost = position.shares * position.avgPrice
        const unrealizedPnl = value - cost
        return { position, market, outcome, currentPrice, value, unrealizedPnl, totalPnl: unrealizedPnl + position.realizedPnl }
      })
      .filter((row) => {
        if (!row.market) return false
        if (scope !== 'all' && row.market.category !== scope) return false
        if (state === 'tradable') return row.market.status === 'open'
        if (state === 'paused') return row.market.status === 'paused' || row.market.status === 'official_pending'
        if (state === 'settled') return row.market.status === 'settled'
        return true
      })
      .sort((a, b) => {
        if (sort === 'pnl') return b.totalPnl - a.totalPnl
        if (sort === 'updated') return b.position.updatedAt.localeCompare(a.position.updatedAt)
        return b.value - a.value
      })
  }, [scope, sort, state])

  const totalValue = rows.reduce((sum, row) => sum + row.value, 0)
  const totalPnl = rows.reduce((sum, row) => sum + row.totalPnl, 0)

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <nav className="mb-4 flex min-h-[44px] items-center gap-1 text-sm">
        <button onClick={() => navigate('/soccer')} className="text-[var(--text-secondary)] transition-colors hover:text-[#2DD4BF]">
          足球 AMM
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="font-medium text-[var(--text-primary)]">Portfolio</span>
      </nav>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold text-[#2DD4BF]">我的持仓</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Portfolio</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">管理可卖 shares、平均成本、当前价格、未实现盈亏和历史成交。</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="持仓市值" value={`${totalValue.toFixed(2)} USDT`} />
            <Metric label="总盈亏" value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} USDT`} accent={totalPnl >= 0 ? 'green' : 'red'} />
          </div>
        </div>
      </section>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex flex-wrap gap-2">
          {SCOPE_TABS.map((tab) => (
            <FilterButton key={tab.id} active={scope === tab.id} onClick={() => setScope(tab.id)}>{tab.label}</FilterButton>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STATE_TABS.map((tab) => (
              <FilterButton key={tab.id} active={state === tab.id} onClick={() => setState(tab.id)}>{tab.label}</FilterButton>
            ))}
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
          >
            <option value="value">按市值排序</option>
            <option value="pnl">按盈亏排序</option>
            <option value="updated">按最近更新排序</option>
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map(({ position, market, outcome, currentPrice, value, unrealizedPnl, totalPnl }) => (
          <section key={position.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--bg-control)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                    {market?.category === 'single' ? '单场预测' : '冠军与晋级'}
                  </span>
                  <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[10px] text-[#2DD4BF]">
                    {market?.status === 'open' ? '可卖出' : '需等待恢复或结算'}
                  </span>
                </div>
                <h2 className="mt-2 text-base font-semibold text-[var(--text-primary)]">{market?.questionTitle}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{outcome?.label}</p>
              </div>
              <button
                onClick={() => {
                  if (market?.category === 'single' && market.matchId) navigate(`/soccer/match/${market.matchId}`)
                  if (market?.category === 'futures' && market.seriesId) navigate(`/soccer/futures/${market.seriesId}`)
                }}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF]"
              >
                去交易
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Metric label="可卖 shares" value={position.shares.toFixed(2)} />
              <Metric label="平均成本" value={`${Math.round(position.avgPrice * 100)}%`} />
              <Metric label="当前价格" value={`${Math.round(currentPrice * 100)}% / ${decimalOdds(currentPrice).toFixed(2)}`} />
              <Metric label="持仓市值" value={`${value.toFixed(2)} USDT`} />
              <Metric label="未实现盈亏" value={`${unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}`} accent={unrealizedPnl >= 0 ? 'green' : 'red'} />
              <Metric label="已实现盈亏" value={`${position.realizedPnl >= 0 ? '+' : ''}${position.realizedPnl.toFixed(2)}`} accent={position.realizedPnl >= 0 ? 'green' : 'red'} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px]">
              <span className="text-[var(--text-secondary)]">总盈亏</span>
              <span className={`font-mono ${totalPnl >= 0 ? 'text-[#10B981]' : 'text-[#E85A7E]'}`}>{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDT</span>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">历史成交</h2>
        <div className="mt-3 space-y-2">
          {ammTradeHistory.map((trade) => {
            const market = getAmmMarketById(trade.marketId)
            const outcome = market ? getOutcome(market, trade.outcomeId) : undefined
            return (
              <div key={trade.id} className="grid gap-2 rounded-xl bg-[var(--bg-control)]/40 p-3 text-xs text-[var(--text-secondary)] sm:grid-cols-[1fr_80px_100px_100px]">
                <span className="truncate text-[var(--text-primary)]">{market?.questionTitle} · {outcome?.label}</span>
                <span className={trade.side === 'buy' ? 'text-[#2DD4BF]' : 'text-[#F59E0B]'}>{trade.side === 'buy' ? '买入' : '卖出'}</span>
                <span className="font-mono">{trade.shares.toFixed(2)} shares</span>
                <span className="font-mono">{trade.collateral.toFixed(2)} USDT</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
        active
          ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
          : 'bg-[var(--bg-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const color = accent === 'green' ? 'text-[#10B981]' : accent === 'red' ? 'text-[#E85A7E]' : 'text-[var(--text-primary)]'
  return (
    <div className="rounded-xl bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className={`mt-1 font-mono text-xs ${color}`}>{value}</p>
    </div>
  )
}
