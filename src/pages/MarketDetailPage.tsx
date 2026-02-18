import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMarketStore } from '../stores/marketStore'
import { useOrderbookStore } from '../stores/orderbookStore'
import { usePortfolioStore } from '../stores/portfolioStore'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Drawer from '../components/ui/Drawer'
import SideDrawer from '../components/ui/SideDrawer'
import PriceChart from '../components/PriceChart'
import Orderbook from '../components/Orderbook'
import QuickOrderPanel from '../components/QuickOrderPanel'
import LimitOrderPanel from '../components/LimitOrderPanel'
import type { Market, OrderSide } from '../types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBanner({ market }: { market: Market }) {
  const info: Record<string, { title: string; desc: string }> = {
    CLOSED: { title: 'Market Closed', desc: 'Trading has ended. Awaiting resolution.' },
    RESOLVING: { title: 'Resolving', desc: 'Outcome is being determined.' },
    SETTLED: {
      title: 'Settled',
      desc: market.settlementResult ? `Resolved ${market.settlementResult}` : 'Market has been settled.',
    },
  }
  const content = info[market.status]
  if (!content) return null
  return (
    <div className="bg-[#E85A7E]/10 border border-[#E85A7E]/20 rounded-lg p-3">
      <p className="text-sm font-medium text-[#E85A7E]">{content.title}</p>
      <p className="text-xs text-[#8A8A9A] mt-1">{content.desc}</p>
    </div>
  )
}

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const markets = useMarketStore((s) => s.markets)
  const market = useMemo(() => markets.find((m) => m.id === id), [markets, id])

  const allTrades = usePortfolioStore((s) => s.trades)
  const allMarketTrades = useMemo(
    () => allTrades.filter((t) => t.marketId === (market?.id ?? '')),
    [allTrades, market?.id],
  )
  const recentTrades = useMemo(
    () => allMarketTrades.slice(0, 5),
    [allMarketTrades],
  )

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [limitDrawerOpen, setLimitDrawerOpen] = useState(false)
  const [prefillPrice, setPrefillPrice] = useState<number | undefined>()
  const [prefillSide, setPrefillSide] = useState<OrderSide | undefined>()
  const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false)
  const [settlementDrawerOpen, setSettlementDrawerOpen] = useState(false)
  const [tradesDrawerOpen, setTradesDrawerOpen] = useState(false)

  const isOpen = market?.status === 'OPEN'
  const showChart = market?.status === 'OPEN' || market?.status === 'CLOSED'

  useEffect(() => {
    if (!id || !isOpen) return
    useOrderbookStore.getState().startDeltaStream(id)
    return () => { useOrderbookStore.getState().stopDeltaStream() }
  }, [id, isOpen])

  const handlePriceClick = useCallback((price: number, side: OrderSide) => {
    setPrefillPrice(price)
    setPrefillSide(side)
    setLimitDrawerOpen(true)
  }, [])

  const handleLimitClick = useCallback(() => {
    setPrefillPrice(undefined)
    setPrefillSide(undefined)
    setLimitDrawerOpen(true)
  }, [])

  const handleLimitOrderPlaced = useCallback(() => {
    setLimitDrawerOpen(false)
  }, [])

  if (!market) {
    return (
      <div className="px-4 md:px-6 py-6">
        <p className="text-[#8A8A9A]">Market not found</p>
        <button onClick={() => navigate('/')} className="mt-2 text-[#2DD4BF] hover:underline text-sm">
          ← Markets
        </button>
      </div>
    )
  }

  const statusMap: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    OPEN: { variant: 'success', label: 'Open' },
    CLOSED: { variant: 'warning', label: 'Closed' },
    RESOLVING: { variant: 'warning', label: 'Resolving' },
    SETTLED: { variant: 'neutral', label: 'Settled' },
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      {/* Desktop: two columns */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Back + Market Info */}
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-[#8A8A9A] hover:text-white text-sm mb-3 flex items-center gap-1 min-h-[44px]"
            >
              ← Markets
            </button>
            <h1 className="text-lg font-semibold text-white mb-2">{market.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={statusMap[market.status].variant}>
                {statusMap[market.status].label}
              </Badge>
              <span className="text-xs text-[#8A8A9A] px-2 py-0.5 rounded-full bg-[#252536]">
                {market.category}
              </span>
              <span className="text-xs text-[#8A8A9A]">Expires: {formatDate(market.expiresAt)}</span>
            </div>
          </div>

          <StatusBanner market={market} />

          {/* Rules summary + More Rules button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8A8A9A] flex-1">{market.resolutionSource}</p>
            {market.rules && (
              <Button size="sm" variant="ghost" onClick={() => setRulesDrawerOpen(true)}>
                View Full Rules
              </Button>
            )}
          </div>

          {/* Settlement Details button for SETTLED markets */}
          {market.status === 'SETTLED' && market.settlementDetails && (
            <Button size="sm" variant="secondary" onClick={() => setSettlementDrawerOpen(true)}>
              View Settlement Details
            </Button>
          )}

          {/* K-line Chart */}
          {showChart && <PriceChart marketId={market.id} />}

          {/* Orderbook */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">Orderbook</h3>
            <Orderbook isOpen={!!isOpen} onPriceClick={isOpen ? handlePriceClick : undefined} />
          </div>

          {/* Recent Trades */}
          {recentTrades.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Recent Trades</h3>
                {allMarketTrades.length > 5 && (
                  <Button size="sm" variant="ghost" onClick={() => setTradesDrawerOpen(true)}>
                    View All ({allMarketTrades.length})
                  </Button>
                )}
              </div>
              <div className="bg-[#161622] rounded-xl border border-[#252536] divide-y divide-[#252536]">
                {recentTrades.map((t) => (
                  <div key={t.id} className="flex justify-between px-3 py-2 text-sm">
                    <span className={t.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}>
                      {t.side}
                    </span>
                    <span className="font-mono text-[#8A8A9A] tabular-nums">
                      {t.quantity} @ {t.price}¢
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — desktop Quick Order */}
        <div className="hidden md:block w-80 shrink-0">
          <div className="sticky top-20">
            <QuickOrderPanel market={market} onLimitClick={handleLimitClick} />
          </div>
        </div>
      </div>

      {/* Mobile: fixed bottom Trade button */}
      {isOpen && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-20 px-4 pb-2 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/95 to-transparent pt-4">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="w-full h-12 bg-[#2DD4BF] text-[#0B0B0F] font-semibold rounded-lg text-sm transition-opacity hover:opacity-90"
          >
            Trade
          </button>
        </div>
      )}

      {/* Mobile: BottomSheet with Quick Order */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Quick Order"
      >
        <QuickOrderPanel market={market} className="border-0 bg-transparent p-0" onLimitClick={() => {
          setMobileDrawerOpen(false)
          setTimeout(() => handleLimitClick(), 250)
        }} />
      </Drawer>

      {/* Limit Order Drawer */}
      <SideDrawer
        isOpen={limitDrawerOpen}
        onClose={() => setLimitDrawerOpen(false)}
        title="Limit Order"
      >
        <LimitOrderPanel
          market={market}
          prefillPrice={prefillPrice}
          prefillSide={prefillSide}
          onOrderPlaced={handleLimitOrderPlaced}
        />
      </SideDrawer>

      {/* Rules Drawer */}
      <SideDrawer
        isOpen={rulesDrawerOpen}
        onClose={() => setRulesDrawerOpen(false)}
        title="Market Rules"
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Resolution Source</h4>
            <p className="text-sm text-[#8A8A9A]">{market.resolutionSource}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Expiration</h4>
            <p className="text-sm text-[#8A8A9A]">{formatDate(market.expiresAt)}</p>
          </div>
          {market.rules && (
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Full Rules</h4>
              <p className="text-sm text-[#8A8A9A] whitespace-pre-line">{market.rules}</p>
            </div>
          )}
        </div>
      </SideDrawer>

      {/* Settlement Details Drawer */}
      <SideDrawer
        isOpen={settlementDrawerOpen}
        onClose={() => setSettlementDrawerOpen(false)}
        title="Settlement Details"
      >
        {market.settlementDetails ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Result</h4>
              <Badge variant={market.settlementResult === 'YES' ? 'success' : 'danger'}>
                {market.settlementResult}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Settlement Source</h4>
              <p className="text-sm text-[#8A8A9A]">{market.settlementDetails.source}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Settled At</h4>
              <p className="text-sm text-[#8A8A9A]">{formatDate(market.settlementDetails.settledAt)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Evidence</h4>
              <p className="text-sm text-[#8A8A9A] whitespace-pre-line">{market.settlementDetails.evidence}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8A8A9A]">No settlement details available.</p>
        )}
      </SideDrawer>

      {/* All Trades Drawer */}
      <SideDrawer
        isOpen={tradesDrawerOpen}
        onClose={() => setTradesDrawerOpen(false)}
        title="All Trades"
      >
        <div className="space-y-0 divide-y divide-[#252536]">
          {allMarketTrades.map((t) => (
            <div key={t.id} className="flex justify-between items-center py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className={`font-medium ${t.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {t.side}
                </span>
                <span className="font-mono text-white tabular-nums">
                  {t.quantity} @ {t.price}¢
                </span>
              </div>
              <span className="text-xs text-[#8A8A9A]">
                {new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {allMarketTrades.length === 0 && (
            <p className="text-sm text-[#8A8A9A] text-center py-8">No trades recorded</p>
          )}
        </div>
      </SideDrawer>
    </div>
  )
}
