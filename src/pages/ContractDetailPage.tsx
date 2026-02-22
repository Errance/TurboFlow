import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrderbookStore } from '../stores/orderbookStore'
import { usePortfolioStore } from '../stores/portfolioStore'
import { getContractById } from '../data/events'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SideDrawer from '../components/ui/SideDrawer'
import Drawer from '../components/ui/Drawer'
import PriceChart from '../components/PriceChart'
import Orderbook from '../components/Orderbook'
import QuickOrderPanel from '../components/QuickOrderPanel'
import LimitOrderPanel from '../components/LimitOrderPanel'
import type { Market, OrderSide } from '../types'

const CONTRACT_TO_MARKET_MAP: Record<string, string> = {
  'ctr-fed-q1': 'mkt-fed-rates',
  'ctr-fed-h1': 'mkt-fed-rates',
  'ctr-fed-eoy': 'mkt-fed-rates',
  'ctr-btc-100k-mar': 'mkt-btc-100k',
  'ctr-btc-100k-jun': 'mkt-btc-100k',
  'ctr-btc-150k-eoy': 'mkt-btc-100k',
}

function useLegacyMarket(contractId: string): Market | null {
  const result = getContractById(contractId)
  if (!result) return null

  const { event, contract } = result
  const legacyId = CONTRACT_TO_MARKET_MAP[contractId] ?? contractId

  return {
    id: legacyId,
    title: `${event.title} — ${contract.label}`,
    description: event.description,
    category: event.category,
    resolutionSource: event.resolutionSource,
    expiresAt: contract.expiresAt,
    status: contract.status === 'CANCELLED' || contract.status === 'VOIDED' ? 'SETTLED' : contract.status as 'OPEN' | 'CLOSED' | 'RESOLVING' | 'SETTLED',
    lastPrice: Math.round(contract.yesPrice * 100),
    volume: contract.volume,
    settlementResult: contract.settlementResult,
    rules: event.rulesDetail,
  }
}

export default function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const navigate = useNavigate()

  const result = contractId ? getContractById(contractId) : undefined
  const legacyMarket = contractId ? useLegacyMarket(contractId) : null

  const allTrades = usePortfolioStore((s) => s.trades)
  const relevantTrades = useMemo(
    () => allTrades.filter((t) => t.marketId === (legacyMarket?.id ?? '')),
    [allTrades, legacyMarket?.id],
  )
  const recentTrades = useMemo(() => relevantTrades.slice(0, 5), [relevantTrades])

  const [orderTab, setOrderTab] = useState<'market' | 'limit'>('market')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [prefillPrice, setPrefillPrice] = useState<number | undefined>()
  const [prefillSide, setPrefillSide] = useState<OrderSide | undefined>()
  const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false)
  const [tradesDrawerOpen, setTradesDrawerOpen] = useState(false)

  const isOpen = legacyMarket?.status === 'OPEN'

  useEffect(() => {
    if (!legacyMarket?.id || !isOpen) return
    useOrderbookStore.getState().startDeltaStream(legacyMarket.id)
    return () => { useOrderbookStore.getState().stopDeltaStream() }
  }, [legacyMarket?.id, isOpen])

  const handlePriceClick = useCallback((price: number, side: OrderSide) => {
    setPrefillPrice(price)
    setPrefillSide(side)
    setOrderTab('limit')
  }, [])

  const handleLimitOrderPlaced = useCallback(() => {
    setPrefillPrice(undefined)
    setPrefillSide(undefined)
  }, [])

  if (!result || !legacyMarket || !contractId) {
    return (
      <div className="px-4 md:px-6 py-12 text-center">
        <p className="text-[#8A8A9A]">Contract not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          Back to Explore
        </Button>
      </div>
    )
  }

  const { event, contract } = result
  const showChart = isOpen || legacyMarket.status === 'CLOSED'

  const OrderTabBar = ({ current, onChange }: { current: 'market' | 'limit'; onChange: (v: 'market' | 'limit') => void }) => (
    <div className="flex gap-1 bg-[#0B0B0F] rounded-lg p-0.5 mb-3">
      <button
        onClick={() => onChange('market')}
        className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
          current === 'market' ? 'bg-[#252536] text-white' : 'text-[#8A8A9A] hover:text-white'
        }`}
      >
        Market
      </button>
      <button
        onClick={() => onChange('limit')}
        className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
          current === 'limit' ? 'bg-[#252536] text-white' : 'text-[#8A8A9A] hover:text-white'
        }`}
      >
        Limit
      </button>
    </div>
  )

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      {/* Event attribution header */}
      <div className="mb-4">
        <button
          onClick={() => navigate(event.category === 'Sports' ? `/game/${event.id}` : `/event/${event.id}`)}
          className="text-[#2DD4BF] hover:underline text-xs mb-2 flex items-center gap-1 min-h-[44px]"
        >
          ← {event.title}
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">{contract.label}</h1>
          <Badge variant="info">Advanced Trading</Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl font-bold font-mono text-[#2DD4BF]">{contract.probability}%</span>
          <span className={`text-sm font-mono ${contract.change24h >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
            {contract.change24h >= 0 ? '+' : ''}{contract.change24h.toFixed(1)}%
          </span>
          <Badge variant={contract.status === 'OPEN' ? 'success' : 'neutral'}>{contract.status}</Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8A8A9A] flex-1">{event.resolutionSource}</p>
            {event.rulesDetail && (
              <Button size="sm" variant="ghost" onClick={() => setRulesDrawerOpen(true)}>
                View Full Rules
              </Button>
            )}
          </div>

          {showChart && <PriceChart marketId={legacyMarket.id} />}

          <div>
            <h3 className="text-sm font-medium text-white mb-2">Orderbook</h3>
            <Orderbook isOpen={!!isOpen} onPriceClick={isOpen ? handlePriceClick : undefined} />
          </div>

          {recentTrades.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Recent Trades</h3>
                {relevantTrades.length > 5 && (
                  <Button size="sm" variant="ghost" onClick={() => setTradesDrawerOpen(true)}>
                    View All ({relevantTrades.length})
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
                      {t.quantity} @ ${(t.price / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — unified Market/Limit panel */}
        <div className="hidden md:block w-80 shrink-0">
          <div className="sticky top-24 bg-[#161622] rounded-xl border border-[#252536] p-4">
            <OrderTabBar current={orderTab} onChange={setOrderTab} />
            {orderTab === 'market' ? (
              <QuickOrderPanel
                market={legacyMarket}
                className="border-0 bg-transparent p-0"
              />
            ) : (
              <LimitOrderPanel
                market={legacyMarket}
                prefillPrice={prefillPrice}
                prefillSide={prefillSide}
                onOrderPlaced={handleLimitOrderPlaced}
              />
            )}
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

      {/* Mobile BottomSheet — unified Market/Limit */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Trade"
      >
        <OrderTabBar current={orderTab} onChange={setOrderTab} />
        {orderTab === 'market' ? (
          <QuickOrderPanel
            market={legacyMarket}
            className="border-0 bg-transparent p-0"
          />
        ) : (
          <LimitOrderPanel
            market={legacyMarket}
            prefillPrice={prefillPrice}
            prefillSide={prefillSide}
            onOrderPlaced={() => {
              handleLimitOrderPlaced()
              setMobileDrawerOpen(false)
            }}
          />
        )}
      </Drawer>

      {/* Rules Drawer */}
      <SideDrawer
        isOpen={rulesDrawerOpen}
        onClose={() => setRulesDrawerOpen(false)}
        title="Contract Rules"
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Measurement</h4>
            <p className="text-sm text-[#8A8A9A]">{event.rulesMeasurement}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Resolution Source</h4>
            <p className="text-sm text-[#8A8A9A]">{event.resolutionSource}</p>
          </div>
          {event.rulesDetail && (
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Full Rules</h4>
              <p className="text-sm text-[#8A8A9A] whitespace-pre-line">{event.rulesDetail}</p>
            </div>
          )}
        </div>
      </SideDrawer>

      {/* All Trades Drawer */}
      <SideDrawer
        isOpen={tradesDrawerOpen}
        onClose={() => setTradesDrawerOpen(false)}
        title="All Trades"
      >
        <div className="divide-y divide-[#252536]">
          {relevantTrades.map((t) => (
            <div key={t.id} className="flex justify-between items-center py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className={`font-medium ${t.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {t.side}
                </span>
                <span className="font-mono text-white tabular-nums">
                  {t.quantity} @ ${(t.price / 100).toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-[#8A8A9A]">
                {new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {relevantTrades.length === 0 && (
            <p className="text-sm text-[#8A8A9A] text-center py-8">No trades recorded</p>
          )}
        </div>
      </SideDrawer>
    </div>
  )
}
