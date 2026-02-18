import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useOrderStore } from '../stores/orderStore'
import { useToastStore } from '../stores/toastStore'
import Tabs from '../components/ui/Tabs'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SideDrawer from '../components/ui/SideDrawer'
import type { MarketStatus, Order, OrderSide, Position, Trade } from '../types'

function statusBadge(status: MarketStatus) {
  const m: Record<MarketStatus, { v: 'success' | 'warning' | 'neutral'; l: string }> = {
    OPEN: { v: 'success', l: 'Open' },
    CLOSED: { v: 'warning', l: 'Closed' },
    RESOLVING: { v: 'warning', l: 'Resolving' },
    SETTLED: { v: 'neutral', l: 'Settled' },
  }
  return <Badge variant={m[status].v}>{m[status].l}</Badge>
}

function PnlText({ value, percent }: { value: number; percent?: number }) {
  const color = value >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
  const sign = value >= 0 ? '+' : ''
  return (
    <span className={`${color} font-mono tabular-nums`}>
      {sign}{value.toFixed(2)}¢
      {percent != null && <span className="text-xs ml-1">({sign}{percent.toFixed(2)}%)</span>}
    </span>
  )
}

interface ActivityEvent {
  id: string
  type: 'order_placed' | 'order_cancelled' | 'trade_filled' | 'market_settled'
  description: string
  timestamp: string
}

function eventBadge(type: ActivityEvent['type']) {
  const map: Record<ActivityEvent['type'], { variant: 'success' | 'warning' | 'neutral' | 'danger'; label: string }> = {
    order_placed: { variant: 'success', label: 'Order Placed' },
    order_cancelled: { variant: 'warning', label: 'Cancelled' },
    trade_filled: { variant: 'success', label: 'Filled' },
    market_settled: { variant: 'neutral', label: 'Settled' },
  }
  const { variant, label } = map[type]
  return <Badge variant={variant}>{label}</Badge>
}

function buildActivityEvents(orders: Order[], trades: Trade[]): ActivityEvent[] {
  const events: ActivityEvent[] = []

  orders.forEach((o) => {
    events.push({
      id: `evt-${o.id}-place`,
      type: 'order_placed',
      description: `${o.side} ${o.quantity} @ ${o.price}¢ — ${o.marketTitle}`,
      timestamp: o.createdAt,
    })
    if (o.status === 'Cancelled') {
      events.push({
        id: `evt-${o.id}-cancel`,
        type: 'order_cancelled',
        description: `${o.side} ${o.quantity} @ ${o.price}¢ — ${o.marketTitle}`,
        timestamp: o.updatedAt,
      })
    }
    if (o.status === 'Filled') {
      events.push({
        id: `evt-${o.id}-fill`,
        type: 'trade_filled',
        description: `${o.side} ${o.filledQuantity}/${o.quantity} @ ${o.price}¢ — ${o.marketTitle}`,
        timestamp: o.updatedAt,
      })
    }
  })

  trades.forEach((t) => {
    events.push({
      id: `evt-${t.id}`,
      type: 'trade_filled',
      description: `${t.side} ${t.quantity} @ ${t.price}¢ — ${t.marketTitle}`,
      timestamp: t.timestamp,
    })
  })

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const seen = new Set<string>()
  return events.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function ActivityTab() {
  const allOrders = useOrderStore((s) => s.orders)
  const allTrades = usePortfolioStore((s) => s.trades)
  const events = useMemo(() => buildActivityEvents(allOrders, allTrades), [allOrders, allTrades])

  if (events.length === 0) {
    return <p className="text-[#8A8A9A] text-sm text-center py-12">No activity yet</p>
  }

  return (
    <div className="space-y-0 divide-y divide-[#252536]">
      {events.map((evt) => (
        <div key={evt.id} className="flex items-start justify-between gap-3 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {eventBadge(evt.type)}
              <span className="text-xs text-[#8A8A9A]">{formatTime(evt.timestamp)}</span>
            </div>
            <p className="text-sm text-white truncate">{evt.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function TradeHistoryTab() {
  const allTrades = usePortfolioStore((s) => s.trades)
  const [sideFilter, setSideFilter] = useState<'ALL' | OrderSide>('ALL')

  const filtered = useMemo(
    () => sideFilter === 'ALL' ? allTrades : allTrades.filter((t) => t.side === sideFilter),
    [allTrades, sideFilter],
  )

  const grouped = useMemo(() => {
    const groups: Record<string, Trade[]> = {}
    for (const t of filtered) {
      const dateKey = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    }
    return Object.entries(groups)
  }, [filtered])

  const totalVolume = useMemo(
    () => filtered.reduce((sum, t) => sum + t.quantity, 0),
    [filtered],
  )

  const filterOptions: { id: 'ALL' | OrderSide; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'YES', label: 'YES' },
    { id: 'NO', label: 'NO' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-[#1C1C28] rounded-lg p-0.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSideFilter(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
                sideFilter === opt.id
                  ? 'bg-[#252536] text-white'
                  : 'text-[#8A8A9A] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#8A8A9A]">
          {filtered.length} trades &middot; {totalVolume} shares
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#8A8A9A] text-sm text-center py-12">No trades found</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, trades]) => (
            <div key={date}>
              <div className="text-xs text-[#8A8A9A] font-medium mb-2 px-1">{date}</div>
              <div className="bg-[#161622] rounded-xl border border-[#252536] overflow-hidden">
                <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium text-[#8A8A9A] border-b border-[#252536]">
                  <span>Time</span>
                  <span className="col-span-2">Market</span>
                  <span>Side</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Qty</span>
                </div>
                {trades.map((t) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-2 md:grid-cols-6 gap-2 px-4 py-3 text-sm border-b border-[#252536] last:border-b-0 hover:bg-[#252536]/30 transition-colors"
                  >
                    <span className="text-xs text-[#8A8A9A] font-mono tabular-nums">
                      {new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-white truncate col-span-1 md:col-span-2 text-xs">{t.marketTitle}</span>
                    <span className={`font-medium text-xs ${t.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                      {t.side}
                    </span>
                    <span className="text-right font-mono tabular-nums text-[#8A8A9A] text-xs">{t.price}¢</span>
                    <span className="text-right font-mono tabular-nums text-white text-xs">{t.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PositionDetailContent({ position }: { position: Position }) {
  const navigate = useNavigate()
  const allTrades = usePortfolioStore((s) => s.trades)
  const allOrders = useOrderStore((s) => s.orders)

  const relatedTrades = useMemo(
    () => allTrades.filter((t) => t.marketId === position.marketId),
    [allTrades, position.marketId],
  )
  const relatedOrders = useMemo(
    () => allOrders.filter((o) => o.marketId === position.marketId),
    [allOrders, position.marketId],
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
            <span className="text-xs text-[#8A8A9A] block">Quantity</span>
            <span className="text-sm font-mono tabular-nums text-white">{position.quantity}</span>
          </div>
          <div>
            <span className="text-xs text-[#8A8A9A] block">Avg Price</span>
            <span className="text-sm font-mono tabular-nums text-white">{position.avgPrice}¢</span>
          </div>
          <div>
            <span className="text-xs text-[#8A8A9A] block">Current Price</span>
            <span className="text-sm font-mono tabular-nums text-white">{position.currentPrice}¢</span>
          </div>
          <div>
            <span className="text-xs text-[#8A8A9A] block">
              {position.marketStatus === 'SETTLED' ? 'Final P&L' : 'Unrealized P&L'}
            </span>
            <PnlText
              value={position.marketStatus === 'SETTLED' ? (position.finalPnl ?? 0) : position.unrealizedPnl}
              percent={position.marketStatus !== 'SETTLED' ? position.unrealizedPnlPercent : undefined}
            />
          </div>
        </div>
        {position.marketStatus === 'SETTLED' && position.settlementResult && (
          <div className="bg-[#0B0B0F]/50 rounded-lg p-3">
            <span className="text-xs text-[#8A8A9A]">Settlement Result: </span>
            <Badge variant={position.settlementResult === 'YES' ? 'success' : 'danger'}>
              {position.settlementResult}
            </Badge>
          </div>
        )}
      </div>

      {/* Related trades */}
      <div>
        <h4 className="text-sm font-medium text-white mb-2">Trades for this position</h4>
        {relatedTrades.length === 0 ? (
          <p className="text-xs text-[#8A8A9A] py-4 text-center">No trades found for this position</p>
        ) : (
          <div className="divide-y divide-[#252536]">
            {relatedTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-xs ${t.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                    {t.side}
                  </span>
                  <span className="font-mono tabular-nums text-white text-xs">
                    {t.quantity} @ {t.price}¢
                  </span>
                </div>
                <span className="text-xs text-[#8A8A9A]">
                  {new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related orders */}
      <div>
        <h4 className="text-sm font-medium text-white mb-2">Order History</h4>
        {relatedOrders.length === 0 ? (
          <p className="text-xs text-[#8A8A9A] py-4 text-center">No orders found</p>
        ) : (
          <div className="divide-y divide-[#252536]">
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
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusVariant[o.status] ?? 'neutral'}>{o.status}</Badge>
                      <Badge variant={o.side === 'YES' ? 'success' : 'danger'}>{o.side}</Badge>
                    </div>
                    <span className="text-xs text-[#8A8A9A]">{formatTime(o.createdAt)}</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-[#8A8A9A]">
                    {o.type === 'limit' ? 'Limit' : 'Market'} &middot; {o.quantity} @ {o.price}¢
                    {o.filledQuantity > 0 && ` (filled ${o.filledQuantity})`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <Button
        variant="secondary"
        fullWidth
        onClick={() => navigate(`/market/${position.marketId}`)}
      >
        View Market
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

  const handlePositionClick = (pos: Position) => {
    setSelectedPosition(pos)
    setPositionDrawerOpen(true)
  }

  const tabs = [
    { id: 'positions' as const, label: 'Positions', count: positions.length },
    { id: 'orders' as const, label: 'Open Orders', count: openOrders.length },
    { id: 'activity' as const, label: 'Activity' },
    { id: 'trades' as const, label: 'Trade History', count: allTrades.length },
  ]

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Portfolio</h1>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        className="mb-5"
      />

      {/* Positions */}
      {activeTab === 'positions' && (
        <div className="space-y-3">
          {positions.length === 0 ? (
            <p className="text-[#8A8A9A] text-sm text-center py-12">No positions</p>
          ) : (
            positions.map((pos) => (
              <Card
                key={pos.id}
                className="cursor-pointer hover:border-[#2DD4BF]/30 transition-colors"
                onClick={() => handlePositionClick(pos)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-white text-left">
                    {pos.marketTitle}
                  </span>
                  <Badge variant={pos.side === 'YES' ? 'success' : 'danger'}>{pos.side}</Badge>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[#8A8A9A] mb-2">
                  <span>Qty: {pos.quantity}</span>
                  <span>Avg: {pos.avgPrice}¢</span>
                  <span>Current: {pos.currentPrice}¢</span>
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
            ))
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
              <p className="text-[#8A8A9A] text-sm">No open orders</p>
            </div>
          ) : (
            openOrders.map((order) => (
              <Card key={order.id}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-white">{order.marketTitle}</span>
                  <div className="flex gap-1.5">
                    <Badge variant="info">{order.type === 'market' ? 'Market' : 'Limit'}</Badge>
                    <Badge variant={order.side === 'YES' ? 'success' : 'danger'}>{order.side}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[#8A8A9A] mb-2">
                  <span>Price: {order.price}¢</span>
                  <span>Qty: {order.quantity}</span>
                  <span>Filled: {order.filledQuantity}/{order.quantity}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={order.status === 'Open' ? 'success' : 'warning'}>
                    {order.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      useOrderStore.getState().cancelOrder(order.id)
                      useToastStore.getState().addToast({
                        type: 'success',
                        message: 'Order cancelled',
                        cta: { label: 'Place New Order', route: `/market/${order.marketId}` },
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            ))
          )}
          {openOrders.length > 0 && (
            <p className="text-xs text-[#8A8A9A] text-center mt-3">
              To modify an order, cancel it and place a new one.
            </p>
          )}
        </div>
      )}

      {/* Activity */}
      {activeTab === 'activity' && <ActivityTab />}

      {/* Trade History */}
      {activeTab === 'trades' && <TradeHistoryTab />}

      {/* Cancel All Confirmation */}
      <Modal isOpen={confirmCancelAll} onClose={() => setConfirmCancelAll(false)} title="Cancel All Orders">
        <p className="text-sm text-[#8A8A9A] mb-4">
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
        {selectedPosition && <PositionDetailContent position={selectedPosition} />}
      </SideDrawer>
    </div>
  )
}
