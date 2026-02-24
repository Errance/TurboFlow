import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useOrderStore } from '../stores/orderStore'
import { useToastStore } from '../stores/toastStore'
import { useParlayStore, type Parlay } from '../stores/parlayStore'
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
    OPEN: { v: 'success', l: 'Open' },
    CLOSED: { v: 'warning', l: 'Closed' },
    RESOLVING: { v: 'warning', l: 'Resolving' },
    SETTLED: { v: 'neutral', l: 'Settled' },
  }
  return <Badge variant={m[status].v}>{m[status].l}</Badge>
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
  price: number
  quantity: number
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
        price: t.price,
        quantity: t.quantity,
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
          price: o.price,
          quantity: o.filledQuantity,
          marketTitle: o.marketTitle,
          timestamp: o.updatedAt,
        })
      } else if (o.status === 'Cancelled') {
        result.push({
          id: `h-ord-cancel-${o.id}`,
          kind: 'order_cancelled',
          side: o.side,
          price: o.price,
          quantity: o.quantity,
          marketTitle: o.marketTitle,
          timestamp: o.updatedAt,
        })
      } else if (o.status === 'Rejected') {
        result.push({
          id: `h-ord-reject-${o.id}`,
          kind: 'order_rejected',
          side: o.side,
          price: o.price,
          quantity: o.quantity,
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
    trade: { variant: 'success', label: 'Trade' },
    order_filled: { variant: 'success', label: 'Filled' },
    order_cancelled: { variant: 'neutral', label: 'Cancelled' },
    order_rejected: { variant: 'danger', label: 'Rejected' },
  }

  const sideOptions: { id: 'ALL' | OrderSide; label: string }[] = [
    { id: 'ALL', label: 'All' }, { id: 'YES', label: 'YES' }, { id: 'NO', label: 'NO' },
  ]
  const kindOptions: { id: 'all' | 'trades' | 'orders'; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'trades', label: 'Trades' }, { id: 'orders', label: 'Orders' },
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
        <span className="text-xs text-[var(--text-secondary)] ml-auto">{filtered.length} records</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm text-center py-12">No history found</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, histItems]) => (
            <div key={date}>
              <div className="text-xs text-[var(--text-secondary)] font-medium mb-2 px-1">{date}</div>
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] border-b border-[var(--border)]">
                  <span>Time</span>
                  <span>Type</span>
                  <span className="col-span-2">Market</span>
                  <span>Side</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Qty</span>
                </div>
                {histItems.map((item) => {
                  const kb = kindBadge[item.kind]
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-2 md:grid-cols-7 gap-2 px-4 py-3 text-sm border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--border)]/30 transition-colors"
                    >
                      <span className="text-xs text-[var(--text-secondary)] font-mono tabular-nums">
                        {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span><Badge variant={kb.variant}>{kb.label}</Badge></span>
                      <span className="text-[var(--text-primary)] truncate col-span-1 md:col-span-2 text-xs">{item.marketTitle}</span>
                      <span className={`font-medium text-xs ${item.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                        {item.side}
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

type SortKey = 'value' | 'pnl' | 'pnlPercent' | 'shares' | 'alpha' | 'price'

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'value', label: 'Current Value' },
  { id: 'pnl', label: 'P&L $' },
  { id: 'pnlPercent', label: 'P&L %' },
  { id: 'shares', label: 'Shares' },
  { id: 'alpha', label: 'Alphabetically' },
  { id: 'price', label: 'Latest Price' },
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
  const currentLabel = SORT_OPTIONS.find((o) => o.id === value)?.label ?? 'Sort'

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
    pending: { variant: 'warning', label: 'Pending' },
    placed: { variant: 'success', label: 'Active' },
    settled: { variant: 'neutral', label: 'Settled' },
  }
  const sc = parlay ? statusConfig[parlay.status] : { variant: 'success' as const, label: 'Active' }

  return (
    <Card className="hover:border-[#2DD4BF]/30 transition-colors">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge variant="info">Parlay</Badge>
          <Badge variant={sc.variant}>{sc.label}</Badge>
          <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">
            {positions.length}-Leg
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
                <Badge variant={pos.side === 'YES' ? 'success' : 'danger'} className="shrink-0">{pos.side}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                <span>Qty: {pos.quantity}</span>
                <span>Avg: ${fmtUsdc(pos.avgPrice)}</span>
                <span>Now: ${fmtUsdc(pos.currentPrice)}</span>
              </div>
              <div className="mt-1 text-xs">
                {pos.marketStatus === 'SETTLED' ? (
                  <span>
                    <Badge variant={pos.settlementResult === 'YES' ? 'success' : 'danger'}>{pos.settlementResult}</Badge>
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
                <span className="text-[var(--text-secondary)]">Stake</span>
                <span className="text-[var(--text-primary)] font-mono">${parlay.stake.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Combined odds</span>
                <span className="text-[var(--text-primary)] font-mono font-medium">{parlay.combinedOdds.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Potential payout</span>
                <span className="text-[#2DD4BF] font-mono">${parlay.potentialPayout.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]/70 font-mono mt-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
                1 ÷ ({parlay.legs.map((l) => l.price.toFixed(2)).join(' × ')}) = {parlay.combinedOdds.toFixed(2)}x
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Placed {new Date(parlay.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
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
          <Badge variant={position.side === 'YES' ? 'success' : 'danger'}>{position.side}</Badge>
          {statusBadge(position.marketStatus)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">Quantity</span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">{position.quantity}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">Avg Price</span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">${fmtUsdc(position.avgPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">Current Price</span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">${fmtUsdc(position.currentPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)] block">
              {position.marketStatus === 'SETTLED' ? 'Final P&L' : 'Unrealized P&L'}
            </span>
            <PnlText
              value={position.marketStatus === 'SETTLED' ? (position.finalPnl ?? 0) : position.unrealizedPnl}
              percent={position.marketStatus !== 'SETTLED' ? position.unrealizedPnlPercent : undefined}
            />
          </div>
        </div>
        {position.marketStatus === 'SETTLED' && position.settlementResult && (
          <div className="bg-[var(--bg-base)]/50 rounded-lg p-3">
            <span className="text-xs text-[var(--text-secondary)]">Settlement Result: </span>
            <Badge variant={position.settlementResult === 'YES' ? 'success' : 'danger'}>
              {position.settlementResult}
            </Badge>
          </div>
        )}
      </div>

      {/* Related trades */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Trades for this position</h4>
        {relatedTrades.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] py-4 text-center">No trades found for this position</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {relatedTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-xs ${t.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                    {t.side}
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
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Order History</h4>
        {relatedOrders.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] py-4 text-center">No orders found</p>
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
                      <Badge variant={statusVariant[o.status] ?? 'neutral'}>{o.status}</Badge>
                      <Badge variant={o.side === 'YES' ? 'success' : 'danger'}>{o.side}</Badge>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{formatTime(o.createdAt)}</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
                    {o.type === 'limit' ? 'Limit' : 'Market'} &middot; {o.quantity} @ ${fmtUsdc(o.price)}
                    {o.filledQuantity > 0 && ` (filled ${o.filledQuantity})`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Close Position */}
      {position.marketStatus === 'OPEN' && (
        <Button
          variant="danger"
          fullWidth
          onClick={() => {
            const closeSide: OrderSide = position.side === 'YES' ? 'NO' : 'YES'
            useOrderStore.getState().placeMarketOrder({
              contractId: position.contractId ?? position.marketId,
              marketTitle: position.marketTitle,
              side: closeSide,
              price: position.currentPrice,
              quantity: position.quantity,
            })
            usePortfolioStore.getState().closePosition(position.id)
            useToastStore.getState().addToast({
              type: 'success',
              message: `Position closed — ${position.quantity} shares sold at $${fmtUsdc(position.currentPrice)}`,
            })
            onClose?.()
          }}
        >
          Close Position ({position.quantity} shares)
        </Button>
      )}

      <Button
        variant="secondary"
        fullWidth
        onClick={() => navigate(`/contract/${position.contractId ?? position.marketId}`)}
      >
        View Contract
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

  const tabs = [
    { id: 'positions' as const, label: 'Positions', count: positions.length },
    { id: 'orders' as const, label: 'Open Orders', count: openOrders.length },
    { id: 'history' as const, label: 'History', count: historyCount },
  ]

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Portfolio</h1>

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
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-control)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors min-h-[36px]"
              />
            </div>
            <SortDropdown value={sortKey} onChange={setSortKey} />
          </div>

          {filteredAndSorted.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm text-center py-12">
              {searchQuery ? 'No positions found' : 'No positions'}
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
                    <Badge variant={pos.side === 'YES' ? 'success' : 'danger'} className="shrink-0">{pos.side}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[var(--text-secondary)] mb-2">
                    <span>Qty: {pos.quantity}</span>
                    <span>Avg: ${fmtUsdc(pos.avgPrice)}</span>
                    <span>Current: ${fmtUsdc(pos.currentPrice)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      {pos.marketStatus === 'SETTLED' ? (
                        <span>
                          Settled: <Badge variant={pos.settlementResult === 'YES' ? 'success' : 'danger'}>{pos.settlementResult}</Badge>
                          {pos.finalPnl != null && (
                            <span className="ml-2">
                              Final: <PnlText value={pos.finalPnl} />
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
                Cancel All
              </Button>
            </div>
          )}

          {openOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)] text-sm">No open orders</p>
            </div>
          ) : (
            openOrders.map((order) => (
              <Card key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] min-w-0 flex-1">{order.marketTitle}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="info">{order.type === 'market' ? 'Market' : 'Limit'}</Badge>
                    <Badge variant={order.side === 'YES' ? 'success' : 'danger'}>{order.side}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[var(--text-secondary)] mb-2">
                  <span>Price: ${fmtUsdc(order.price)}</span>
                  <span>Qty: {order.quantity}</span>
                  <span>Filled: {order.filledQuantity}/{order.quantity}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={order.status === 'Open' ? 'success' : 'warning'}>
                    {order.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        useOrderStore.getState().simulateFillOrder(order.id)
                        useToastStore.getState().addToast({
                          type: 'success',
                          message: `Order filled — ${order.quantity} shares at $${fmtUsdc(order.price)}`,
                        })
                      }}
                    >
                      Simulate Fill
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        useOrderStore.getState().cancelOrder(order.id)
                        useToastStore.getState().addToast({
                          type: 'success',
                          message: 'Order cancelled',
                          cta: { label: 'Place New Order', route: `/contract/${order.contractId ?? order.marketId}` },
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
          {openOrders.length > 0 && (
            <p className="text-xs text-[var(--text-secondary)] text-center mt-3">
              To modify an order, cancel it and place a new one.
            </p>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && <HistoryTab />}

      {/* Cancel All Confirmation */}
      <Modal isOpen={confirmCancelAll} onClose={() => setConfirmCancelAll(false)} title="Cancel All Orders">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Are you sure you want to cancel all {openOrders.length} open orders?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setConfirmCancelAll(false)}>
            Keep Orders
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              useOrderStore.getState().cancelAllOrders()
              setConfirmCancelAll(false)
            }}
          >
            Cancel All
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
