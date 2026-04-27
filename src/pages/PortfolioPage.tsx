import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useOrderStore } from '../stores/orderStore'
import { useToastStore } from '../stores/toastStore'
import { useParlayStore, type Parlay } from '../stores/parlayStore'
import { useEventContractStore } from '../stores/eventContractStore'
import PnlChart from '../components/PnlChart'
import Tabs from '../components/ui/Tabs'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SideDrawer from '../components/ui/SideDrawer'
import type { MarketStatus, OrderSide, Position } from '../types'

function statusBadge(status: MarketStatus) {
  const m: Record<MarketStatus, { v: 'success' | 'warning' | 'neutral'; l: string }> = {
    OPEN: { v: 'success', l: '开放' },
    CLOSED: { v: 'warning', l: '已关闭' },
    RESOLVING: { v: 'warning', l: '结算中' },
    SETTLED: { v: 'neutral', l: '已结算' },
  }
  return <Badge variant={m[status].v}>{m[status].l}</Badge>
}

function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Pending: '待处理',
    Open: '开放',
    PartialFill: '部分成交',
    Filled: '已成交',
    Cancelled: '已取消',
    Rejected: '已拒绝',
  }
  return labels[status] ?? status
}

function fmtUsdc(v: number): string {
  return v.toFixed(2)
}

function PnlText({ value, percent }: { value: number; percent?: number }) {
  const color = value >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
  const sign = value >= 0 ? '+' : ''
  return (
    <span className={`${color} font-mono tabular-nums`}>
      {sign}{fmtUsdc(value)} USDC
      {percent != null && <span className="text-xs ml-1">({sign}{percent.toFixed(2)}%)</span>}
    </span>
  )
}

const MOCK_CASH = 10000

interface HistoryItem {
  id: string
  kind: 'trade' | 'order_filled' | 'order_cancelled' | 'order_rejected'
  side: OrderSide
  action: 'BUY' | 'SELL'
  price: number
  quantity: number
  fee: number
  marketTitle: string
  timestamp: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function HistoryTab() {
  const allTrades = usePortfolioStore((s) => s.trades)
  const allOrders = useOrderStore((s) => s.orders)
  const [sideFilter, setSideFilter] = useState<'ALL' | OrderSide>('ALL')
  const [kindFilter, setKindFilter] = useState<'all' | 'trades' | 'orders'>('all')

  const items: HistoryItem[] = useMemo(() => {
    const result: HistoryItem[] = []

    allTrades.forEach((t) => {
      result.push({
        id: `h-trade-${t.id}`,
        kind: 'trade',
        side: t.side,
        action: t.action,
        price: t.price,
        quantity: t.quantity,
        fee: t.fee,
        marketTitle: t.marketTitle,
        timestamp: t.timestamp,
      })
    })

    allOrders.forEach((o) => {
      if (o.status === 'Filled') {
        result.push({
          id: `h-ord-fill-${o.id}`,
          kind: 'order_filled',
          side: o.side,
          action: o.action,
          price: o.price,
          quantity: o.filledQuantity,
          fee: o.fee,
          marketTitle: o.marketTitle,
          timestamp: o.updatedAt,
        })
      } else if (o.status === 'Cancelled') {
        result.push({
          id: `h-ord-cancel-${o.id}`,
          kind: 'order_cancelled',
          side: o.side,
          action: o.action,
          price: o.price,
          quantity: o.quantity,
          fee: o.fee,
          marketTitle: o.marketTitle,
          timestamp: o.updatedAt,
        })
      } else if (o.status === 'Rejected') {
        result.push({
          id: `h-ord-reject-${o.id}`,
          kind: 'order_rejected',
          side: o.side,
          action: o.action,
          price: o.price,
          quantity: o.quantity,
          fee: o.fee,
          marketTitle: o.marketTitle,
          timestamp: o.updatedAt,
        })
      }
    })

    const seen = new Set<string>()
    const deduped = result.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })

    deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return deduped
  }, [allTrades, allOrders])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (sideFilter !== 'ALL' && item.side !== sideFilter) return false
      if (kindFilter === 'trades' && item.kind !== 'trade') return false
      if (kindFilter === 'orders' && item.kind === 'trade') return false
      return true
    })
  }, [items, sideFilter, kindFilter])

  const grouped = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {}
    for (const item of filtered) {
      const dateKey = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(item)
    }
    return Object.entries(groups)
  }, [filtered])

  const kindBadge: Record<HistoryItem['kind'], { variant: 'success' | 'warning' | 'neutral' | 'danger'; label: string }> = {
    trade: { variant: 'success', label: '成交' },
    order_filled: { variant: 'success', label: '已成交' },
    order_cancelled: { variant: 'neutral', label: '已取消' },
    order_rejected: { variant: 'danger', label: '已拒绝' },
  }

  const sideOptions: { id: 'ALL' | OrderSide; label: string }[] = [
    { id: 'ALL', label: '全部' }, { id: 'YES', label: '是' }, { id: 'NO', label: '否' },
  ]
  const kindOptions: { id: 'all' | 'trades' | 'orders'; label: string }[] = [
    { id: 'all', label: '全部' }, { id: 'trades', label: '成交' }, { id: 'orders', label: '委托' },
  ]

  function FilterPills({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (v: any) => void }) {
    return (
      <div className="flex gap-1 bg-[var(--bg-control)] rounded-lg p-0.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
              value === opt.id
                ? 'bg-[var(--border)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterPills options={sideOptions} value={sideFilter} onChange={setSideFilter} />
        <FilterPills options={kindOptions} value={kindFilter} onChange={setKindFilter} />
        <span className="text-xs text-[var(--text-secondary)] ml-auto">{filtered.length} 条记录</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm text-center py-12">暂无历史记录</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, histItems]) => (
            <div key={date}>
              <div className="text-xs text-[var(--text-secondary)] font-medium mb-2 px-1">{date}</div>
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="hidden md:grid grid-cols-8 gap-2 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] border-b border-[var(--border)]">
                  <span>时间</span>
                  <span>类型</span>
                  <span>动作</span>
                  <span className="col-span-2">市场</span>
                  <span>方向</span>
                  <span className="text-right">价格</span>
                  <span className="text-right">数量</span>
                </div>
                {histItems.map((item) => {
                  const kb = kindBadge[item.kind]
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-2 md:grid-cols-8 gap-2 px-4 py-3 text-sm border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--border)]/30 transition-colors"
                    >
                      <span className="text-xs text-[var(--text-secondary)] font-mono tabular-nums">
                        {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span><Badge variant={kb.variant}>{kb.label}</Badge></span>
                      <span>
                        <Badge variant={item.action === 'BUY' ? 'success' : 'warning'}>
                          {item.action === 'BUY' ? '买入' : '卖出'}
                        </Badge>
                      </span>
                      <span className="text-[var(--text-primary)] truncate col-span-1 md:col-span-2 text-xs">{item.marketTitle}</span>
                      <span className={`font-medium text-xs ${item.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                        {item.side === 'YES' ? '是' : '否'}
                      </span>
                      <span className="text-right font-mono tabular-nums text-[var(--text-secondary)] text-xs">${fmtUsdc(item.price)}</span>
                      <span className="text-right font-mono tabular-nums text-[var(--text-primary)] text-xs">{item.quantity}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventsTab() {
  const activeBets = useEventContractStore((s) => s.activeBets)
  const settledBets = useEventContractStore((s) => s.settledBets)
  const balance = useEventContractStore((s) => s.balance)
  const streak = useEventContractStore((s) => s.streak)

  const totalPnl = settledBets.reduce((sum, b) => sum + (b.pnl ?? 0), 0)
  const wins = settledBets.filter((b) => b.status === 'won').length
  const losses = settledBets.filter((b) => b.status === 'lost').length
  const winRate = settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(0) : '—'
  const totalBets = settledBets.length + activeBets.length

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] mb-0.5">可用余额</div>
            <div className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] mb-0.5">总盈亏</div>
            <div className={`text-sm font-bold tabular-nums ${totalPnl >= 0 ? 'text-[#2DD4BF]' : 'text-[#F87171]'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] mb-0.5">胜率</div>
            <div className="text-sm font-bold text-[var(--text-primary)]">{winRate}%</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] mb-0.5">连续结果</div>
            <div className={`text-sm font-bold ${
              streak.type === 'win' ? 'text-[#2DD4BF]' : streak.type === 'lose' ? 'text-[#F87171]' : 'text-[var(--text-primary)]'
            }`}>
              {streak.count > 0 ? `${streak.count} 次${streak.type === 'win' ? '连胜' : '连输'}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Active bets */}
      {activeBets.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-2">
            进行中（{activeBets.length}）
          </h3>
          <div className="space-y-2">
            {activeBets.map((bet) => (
              <div key={bet.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bet.direction === 'higher' ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]' : 'bg-[#F87171]/15 text-[#F87171]'
                    }`}>
                      {bet.direction === 'higher' ? '看涨' : '看跌'}
                    </span>
                    <span className="text-xs text-[var(--text-primary)]">{bet.asset}/USDT</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{bet.duration / 60} 分钟</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-[var(--text-primary)]">${bet.amount}</span>
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  开仓价：${bet.entryPrice.toFixed(2)} · 回报率：{(bet.payout * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settled bets */}
      <div>
        <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-2">
          历史记录（{settledBets.length}）
        </h3>
        {settledBets.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">暂无已结算投注</p>
        ) : (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            {settledBets.map((bet) => {
              const won = bet.status === 'won'
              return (
                <div key={bet.id} className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bet.direction === 'higher' ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]' : 'bg-[#F87171]/15 text-[#F87171]'
                    }`}>
                      {bet.direction === 'higher' ? '涨' : '跌'}
                    </span>
                    <div>
                      <div className="text-xs text-[var(--text-primary)]">{bet.asset}/USDT · {bet.duration / 60} 分钟</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">
                        {new Date(bet.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold tabular-nums ${won ? 'text-[#2DD4BF]' : 'text-[#F87171]'}`}>
                      {won ? '+' : ''}{bet.pnl?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">投注 ${bet.amount}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-center text-[10px] text-[var(--text-tertiary)]">
        共 {totalBets} 笔投注 · <span className="text-[#2DD4BF]">{wins} 赢</span> / <span className="text-[#F87171]">{losses} 输</span>
      </div>
    </div>
  )
}

type SortKey = 'value' | 'pnl' | 'pnlPercent' | 'shares' | 'alpha' | 'price'

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'value', label: '当前价值' },
  { id: 'pnl', label: '盈亏金额' },
  { id: 'pnlPercent', label: '盈亏比例' },
  { id: 'shares', label: '份额数量' },
  { id: 'alpha', label: '名称排序' },
  { id: 'price', label: '最新价格' },
]

type PositionListItem =
  | { kind: 'single'; position: Position }
  | { kind: 'parlay'; parlayId: string; positions: Position[]; parlay?: Parlay }

function getItemValue(item: PositionListItem): number {
  if (item.kind === 'single') return item.position.quantity * item.position.currentPrice
  return item.positions.reduce((s, p) => s + p.quantity * p.currentPrice, 0)
}

function getItemPnl(item: PositionListItem): number {
  if (item.kind === 'single') {
    return item.position.marketStatus === 'SETTLED' ? (item.position.finalPnl ?? 0) : item.position.unrealizedPnl
  }
  return item.positions.reduce((s, p) => s + (p.marketStatus === 'SETTLED' ? (p.finalPnl ?? 0) : p.unrealizedPnl), 0)
}

function getItemPnlPercent(item: PositionListItem): number {
  if (item.kind === 'single') return item.position.unrealizedPnlPercent
  const totalCost = item.positions.reduce((s, p) => s + p.avgPrice * p.quantity, 0)
  if (totalCost === 0) return 0
  return (getItemPnl(item) / totalCost) * 100
}

function getItemShares(item: PositionListItem): number {
  if (item.kind === 'single') return item.position.quantity
  return item.positions.reduce((s, p) => s + p.quantity, 0)
}

function getItemTitle(item: PositionListItem): string {
  if (item.kind === 'single') return item.position.marketTitle
  return item.positions[0]?.marketTitle ?? ''
}

function getItemPrice(item: PositionListItem): number {
  if (item.kind === 'single') return item.position.currentPrice
  return item.positions[0]?.currentPrice ?? 0
}

function sortItems(items: PositionListItem[], sortKey: SortKey): PositionListItem[] {
  const sorted = [...items]
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'value': return getItemValue(b) - getItemValue(a)
      case 'pnl': return getItemPnl(b) - getItemPnl(a)
      case 'pnlPercent': return getItemPnlPercent(b) - getItemPnlPercent(a)
      case 'shares': return getItemShares(b) - getItemShares(a)
      case 'alpha': return getItemTitle(a).localeCompare(getItemTitle(b))
      case 'price': return getItemPrice(b) - getItemPrice(a)
      default: return 0
    }
  })
  return sorted
}

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const currentLabel = SORT_OPTIONS.find((o) => o.id === value)?.label ?? '排序'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[var(--bg-control)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:border-[#2DD4BF]/40 transition-colors min-h-[36px]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-secondary)]">
          <path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">{currentLabel}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[var(--text-secondary)]">
          <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-[var(--bg-control)] transition-colors ${
                  value === opt.id ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
                {value === opt.id && (
                  <span className="w-2 h-2 rounded-full bg-[#2DD4BF]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ParlayGroupCard({
  positions,
  parlay,
  onPositionClick,
}: {
  positions: Position[]
  parlay?: Parlay
  onPositionClick: (pos: Position) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const totalValue = positions.reduce((s, p) => s + p.quantity * p.currentPrice, 0)
  const totalPnl = positions.reduce((s, p) => s + (p.marketStatus === 'SETTLED' ? (p.finalPnl ?? 0) : p.unrealizedPnl), 0)
  const totalCost = positions.reduce((s, p) => s + p.avgPrice * p.quantity, 0)
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    pending: { variant: 'warning', label: '待确认' },
    placed: { variant: 'success', label: '进行中' },
    settled: { variant: 'neutral', label: '已结算' },
  }
  const sc = parlay ? statusConfig[parlay.status] : { variant: 'success' as const, label: '进行中' }

  return (
    <Card className="hover:border-[#2DD4BF]/30 transition-colors">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge variant="info">{parlay?.mode === 'bundle' ? '单项组合' : '串关'}</Badge>
          <Badge variant={sc.variant}>{sc.label}</Badge>
          <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">
            {positions.length} 项
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-mono tabular-nums text-[var(--text-primary)]">${fmtUsdc(totalValue)}</p>
            <PnlText value={totalPnl} percent={totalPnlPercent} />
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={`text-[var(--text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="bg-[var(--bg-base)]/50 rounded-lg p-3 cursor-pointer hover:bg-[var(--bg-base)] transition-colors"
              onClick={(e) => { e.stopPropagation(); onPositionClick(pos) }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs text-[var(--text-primary)] min-w-0 truncate">{pos.marketTitle}</span>
                <Badge variant={pos.side === 'YES' ? 'success' : 'danger'} className="shrink-0">{pos.side === 'YES' ? '是' : '否'}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                <span>数量：{pos.quantity}</span>
                <span>均价：${fmtUsdc(pos.avgPrice)}</span>
                <span>当前价：${fmtUsdc(pos.currentPrice)}</span>
              </div>
              <div className="mt-1 text-xs">
                {pos.marketStatus === 'SETTLED' ? (
                  <span>
                    <Badge variant={pos.settlementResult === 'YES' ? 'success' : 'danger'}>{pos.settlementResult === 'YES' ? '是' : '否'}</Badge>
                    {pos.finalPnl != null && <span className="ml-2"><PnlText value={pos.finalPnl} /></span>}
                  </span>
                ) : (
                  <PnlText value={pos.unrealizedPnl} percent={pos.unrealizedPnlPercent} />
                )}
              </div>
            </div>
          ))}

          {parlay && (
            <div className="pt-2 border-t border-[var(--border)] space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">投注金额</span>
                <span className="text-[var(--text-primary)] font-mono">${parlay.stake.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">总赔率</span>
                <span className="text-[var(--text-primary)] font-mono font-medium">{parlay.combinedOdds.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">可能返还</span>
                <span className="text-[#2DD4BF] font-mono">${parlay.potentialPayout.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]/70 font-mono mt-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
                1 ÷ ({parlay.legs.map((l) => l.price.toFixed(2)).join(' × ')}) = {parlay.combinedOdds.toFixed(2)}x
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                提交时间 {new Date(parlay.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                {new Date(parlay.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function PositionDetailContent({ position, onClose }: { position: Position; onClose?: () => void }) {
  const navigate = useNavigate()
  const allTrades = usePortfolioStore((s) => s.trades)
  const allOrders = useOrderStore((s) => s.orders)

  const posKey = position.contractId ?? position.marketId
  const relatedTrades = useMemo(
    () => allTrades.filter((t) => (t.contractId ?? t.marketId) === posKey || t.marketId === posKey),
    [allTrades, posKey],
  )
  const relatedOrders = useMemo(
    () => allOrders.filter((o) => (o.contractId ?? o.marketId) === posKey || o.marketId === posKey),
    [allOrders, posKey],
  )

  return (
    <div className="space-y-6">
      {/* Position summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={position.side === 'YES' ? 'success' : 'danger'}>{position.side === 'YES' ? '是' : '否'}</Badge>
          {statusBadge(position.marketStatus)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">数量</span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">{position.quantity}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">均价</span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">${fmtUsdc(position.avgPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">当前价</span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">${fmtUsdc(position.currentPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">
              {position.marketStatus === 'SETTLED' ? '最终盈亏' : '未实现盈亏'}
            </span>
            <PnlText
              value={position.marketStatus === 'SETTLED' ? (position.finalPnl ?? 0) : position.unrealizedPnl}
              percent={position.marketStatus !== 'SETTLED' ? position.unrealizedPnlPercent : undefined}
            />
          </div>
        </div>
        {position.marketStatus === 'SETTLED' && position.settlementResult && (
          <div className="bg-[var(--bg-base)]/50 rounded-lg p-3">
            <span className="text-xs text-[var(--text-secondary)]">结算结果：</span>
            <Badge variant={position.settlementResult === 'YES' ? 'success' : 'danger'}>
              {position.settlementResult === 'YES' ? '是' : '否'}
            </Badge>
          </div>
        )}
      </div>

      {/* Related trades */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">本持仓成交记录</h4>
        {relatedTrades.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] py-4 text-center">暂无本持仓成交记录</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {relatedTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-xs ${t.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                    {t.side === 'YES' ? '是' : '否'}
                  </span>
                  <span className="font-mono tabular-nums text-[var(--text-primary)] text-xs">
                    {t.quantity} @ ${fmtUsdc(t.price)}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  {new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related orders */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">委托记录</h4>
        {relatedOrders.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] py-4 text-center">暂无委托记录</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {relatedOrders.map((o) => {
              const statusVariant: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
                Pending: 'warning',
                Open: 'success',
                PartialFill: 'warning',
                Filled: 'success',
                Cancelled: 'neutral',
                Rejected: 'danger',
              }
              return (
                <div key={o.id} className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusVariant[o.status] ?? 'neutral'}>{orderStatusLabel(o.status)}</Badge>
                      <Badge variant={o.side === 'YES' ? 'success' : 'danger'}>{o.side === 'YES' ? '是' : '否'}</Badge>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{formatTime(o.createdAt)}</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
                    {o.type === 'limit' ? '限价' : '市价'} &middot; {o.quantity} @ ${fmtUsdc(o.price)}
                    {o.filledQuantity > 0 && `（已成交 ${o.filledQuantity}）`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Close Position — submit SELL market order, which triggers reducePosition on fill */}
      {position.marketStatus === 'OPEN' && (
        <Button
          variant="danger"
          fullWidth
          onClick={() => {
            useOrderStore.getState().placeMarketOrder({
              contractId: position.contractId ?? position.marketId,
              marketTitle: position.marketTitle,
              side: position.side,
              action: 'SELL',
              price: position.currentPrice,
              quantity: position.quantity,
            })
            useToastStore.getState().addToast({
              type: 'success',
              message: `持仓已平仓，卖出 ${position.quantity} 份，价格 ${fmtUsdc(position.currentPrice)} USDC`,
            })
            onClose?.()
          }}
        >
          平仓（{position.quantity} 份）
        </Button>
      )}

      <Button
        variant="secondary"
        fullWidth
        onClick={() => navigate(`/contract/${position.contractId ?? position.marketId}`)}
      >
        查看合约
      </Button>
    </div>
  )
}

export default function PortfolioPage() {
  const positions = usePortfolioStore((s) => s.positions)
  const activeTab = usePortfolioStore((s) => s.activeTab)
  const setActiveTab = usePortfolioStore((s) => s.setActiveTab)

  const allOrders = useOrderStore((s) => s.orders)
  const openOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'Open' || o.status === 'PartialFill'),
    [allOrders],
  )

  const allTrades = usePortfolioStore((s) => s.trades)
  const [confirmCancelAll, setConfirmCancelAll] = useState(false)
  const [positionDrawerOpen, setPositionDrawerOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('value')

  const handlePositionClick = (pos: Position) => {
    setSelectedPosition(pos)
    setPositionDrawerOpen(true)
  }

  const placedParlays = useParlayStore((s) => s.placedParlays)

  const portfolioValue = useMemo(
    () => positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0) + MOCK_CASH,
    [positions],
  )
  const historyCount = useMemo(() => {
    const completedOrders = allOrders.filter((o) => o.status === 'Filled' || o.status === 'Cancelled' || o.status === 'Rejected')
    return allTrades.length + completedOrders.length
  }, [allOrders, allTrades])

  const listItems: PositionListItem[] = useMemo(() => {
    const singles: PositionListItem[] = []
    const parlayMap = new Map<string, Position[]>()
    for (const pos of positions) {
      if (pos.parlayId) {
        const arr = parlayMap.get(pos.parlayId) || []
        arr.push(pos)
        parlayMap.set(pos.parlayId, arr)
      } else {
        singles.push({ kind: 'single', position: pos })
      }
    }
    const parlayItems: PositionListItem[] = Array.from(parlayMap.entries()).map(([pid, poss]) => ({
      kind: 'parlay' as const,
      parlayId: pid,
      positions: poss,
      parlay: placedParlays.find((p) => p.id === pid),
    }))
    return [...singles, ...parlayItems]
  }, [positions, placedParlays])

  const filteredAndSorted = useMemo(() => {
    let items = listItems
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter((item) => {
        if (item.kind === 'single') return item.position.marketTitle.toLowerCase().includes(q)
        return item.positions.some((p) => p.marketTitle.toLowerCase().includes(q))
      })
    }
    return sortItems(items, sortKey)
  }, [listItems, searchQuery, sortKey])

  const ecActiveBets = useEventContractStore((s) => s.activeBets)
  const ecSettledBets = useEventContractStore((s) => s.settledBets)
  const ecTotalCount = ecActiveBets.length + ecSettledBets.length

  const tabs = [
    { id: 'positions' as const, label: '持仓', count: positions.length },
    { id: 'orders' as const, label: '开放委托', count: openOrders.length },
    { id: 'events' as const, label: '事件合约', count: ecTotalCount },
    { id: 'history' as const, label: '历史记录', count: historyCount },
  ]

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">资产</h1>

      <PnlChart portfolioValue={portfolioValue} className="mb-5" />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        className="mb-5"
      />

      {/* Positions with search + sort */}
      {activeTab === 'positions' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="搜索持仓..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-control)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors min-h-[36px]"
              />
            </div>
            <SortDropdown value={sortKey} onChange={setSortKey} />
          </div>

          {filteredAndSorted.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm text-center py-12">
              {searchQuery ? '未找到符合条件的持仓' : '暂无持仓'}
            </p>
          ) : (
            filteredAndSorted.map((item) => {
              if (item.kind === 'parlay') {
                return (
                  <ParlayGroupCard
                    key={item.parlayId}
                    positions={item.positions}
                    parlay={item.parlay}
                    onPositionClick={handlePositionClick}
                  />
                )
              }
              const pos = item.position
              return (
                <Card
                  key={pos.id}
                  className="cursor-pointer hover:border-[#2DD4BF]/30 transition-colors"
                  onClick={() => handlePositionClick(pos)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)] text-left min-w-0 truncate">
                      {pos.marketTitle}
                    </span>
                    <Badge variant={pos.side === 'YES' ? 'success' : 'danger'} className="shrink-0">{pos.side === 'YES' ? '是' : '否'}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[var(--text-secondary)] mb-2">
                    <span>数量：{pos.quantity}</span>
                    <span>均价：${fmtUsdc(pos.avgPrice)}</span>
                    <span>当前价：${fmtUsdc(pos.currentPrice)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      {pos.marketStatus === 'SETTLED' ? (
                        <span>
                          已结算：<Badge variant={pos.settlementResult === 'YES' ? 'success' : 'danger'}>{pos.settlementResult === 'YES' ? '是' : '否'}</Badge>
                          {pos.finalPnl != null && (
                            <span className="ml-2">
                              最终盈亏：<PnlText value={pos.finalPnl} />
                            </span>
                          )}
                        </span>
                      ) : (
                        <PnlText value={pos.unrealizedPnl} percent={pos.unrealizedPnlPercent} />
                      )}
                    </div>
                    {statusBadge(pos.marketStatus)}
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Open Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {openOrders.length > 0 && (
            <div className="flex justify-end">
              <Button size="sm" variant="danger" onClick={() => setConfirmCancelAll(true)}>
                全部取消
              </Button>
            </div>
          )}

          {openOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)] text-sm">暂无开放委托</p>
            </div>
          ) : (
            openOrders.map((order) => (
              <Card key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] min-w-0 flex-1">{order.marketTitle}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant={order.action === 'BUY' ? 'success' : 'warning'}>{order.action === 'BUY' ? '买入' : '卖出'}</Badge>
                    <Badge variant="info">{order.type === 'market' ? '市价' : '限价'}</Badge>
                    <Badge variant={order.side === 'YES' ? 'success' : 'danger'}>{order.side === 'YES' ? '是' : '否'}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[var(--text-secondary)] mb-2">
                  <span>价格：${fmtUsdc(order.price)}</span>
                  <span>数量：{order.quantity}</span>
                  <span>已成交：{order.filledQuantity}/{order.quantity}</span>
                  <span>{order.timeInForce}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={order.status === 'Open' ? 'success' : 'warning'}>
                    {orderStatusLabel(order.status)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        useOrderStore.getState().simulateFillOrder(order.id)
                        useToastStore.getState().addToast({
                          type: 'success',
                          message: `委托已成交，${order.quantity} 份，价格 ${fmtUsdc(order.price)} USDC`,
                        })
                      }}
                    >
                      标记成交
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        useOrderStore.getState().cancelOrder(order.id)
                        useToastStore.getState().addToast({
                          type: 'success',
                          message: '委托已取消',
                          cta: { label: '重新下单', route: `/contract/${order.contractId ?? order.marketId}` },
                        })
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
          {openOrders.length > 0 && (
            <p className="text-xs text-[var(--text-secondary)] text-center mt-3">
              如需修改委托，请先取消当前委托后重新下单。
            </p>
          )}
        </div>
      )}

      {/* Events */}
      {activeTab === 'events' && <EventsTab />}

      {/* History */}
      {activeTab === 'history' && <HistoryTab />}

      {/* Cancel All Confirmation */}
      <Modal isOpen={confirmCancelAll} onClose={() => setConfirmCancelAll(false)} title="取消全部委托">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          确认取消当前 {openOrders.length} 个开放委托吗？
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setConfirmCancelAll(false)}>
            保留委托
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              useOrderStore.getState().cancelAllOrders()
              setConfirmCancelAll(false)
            }}
          >
            全部取消
          </Button>
        </div>
      </Modal>

      {/* Position Detail SideDrawer */}
      <SideDrawer
        isOpen={positionDrawerOpen}
        onClose={() => setPositionDrawerOpen(false)}
        title={selectedPosition?.marketTitle}
      >
        {selectedPosition && <PositionDetailContent position={selectedPosition} onClose={() => setPositionDrawerOpen(false)} />}
      </SideDrawer>
    </div>
  )
}
