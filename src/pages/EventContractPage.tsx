import { useEffect, useState } from 'react'
import { useEventContractStore } from '../stores/eventContractStore'
import MarketStage, { MarketPriceBar, MarketChart } from '../components/ec/MarketStage'
import OrderPanel from '../components/ec/OrderPanel'
import PositionsStage from '../components/ec/PositionsStage'
import SettlementReveal from '../components/ec/SettlementReveal'
import EffectsSettings from '../components/ec/EffectsSettings'
import Leaderboard from '../components/ec/Leaderboard'

export default function EventContractPage() {
  const initPriceFeed = useEventContractStore((s) => s.initPriceFeed)
  const initMockEngine = useEventContractStore((s) => s.initMockEngine)
  const dispose = useEventContractStore((s) => s.dispose)
  const [effectsOpen, setEffectsOpen] = useState(false)
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false)

  useEffect(() => {
    initPriceFeed()
    initMockEngine()
    return () => dispose()
  }, [initPriceFeed, initMockEngine, dispose])

  return (
    <>
      {/* Mobile: single column */}
      <div className="md:hidden px-4 py-4">
        <Leaderboard expanded={leaderboardExpanded} onToggle={() => setLeaderboardExpanded(!leaderboardExpanded)} />
        <div className="flex justify-end mb-2">
          <EffectsButton onClick={() => setEffectsOpen(true)} />
        </div>
        <MarketStage />
        <OrderPanel />
        <PositionsStage />
      </div>

      {/* Desktop: two-column */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 py-6">
        <Leaderboard expanded={leaderboardExpanded} onToggle={() => setLeaderboardExpanded(!leaderboardExpanded)} />
        <div className="flex items-center justify-between mb-2">
          <MarketPriceBar />
          <EffectsButton onClick={() => setEffectsOpen(true)} />
        </div>
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
          <div>
            <MarketChart />
            <div className="mt-4">
              <PositionsStage />
            </div>
          </div>

          <div className="sticky top-20">
            <OrderPanel />
          </div>
        </div>
      </div>

      <SettlementReveal />
      <EffectsSettings open={effectsOpen} onClose={() => setEffectsOpen(false)} />
    </>
  )
}

function EffectsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M2.5 9.5l1.4-1.4M8.1 3.9l1.4-1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
      Effects
    </button>
  )
}
