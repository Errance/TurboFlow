import { useState, useRef, useEffect } from 'react'
import { useParlayStore } from '../stores/parlayStore'
import Button from './ui/Button'

function formatUsdc(v: number): string {
  return v.toFixed(2)
}

// ── ParlayBar (persistent compact bar) ──────────────────────────

function ParlayBar({ legCount, odds, onOpen }: { legCount: number; odds: number; onOpen: () => void }) {
  return (
    <>
      {/* Mobile: above tab bar */}
      <div
        onClick={onOpen}
        className="md:hidden fixed bottom-[56px] left-0 right-0 z-31 bg-[#161622] border-t border-[#2DD4BF]/20 px-4 flex items-center justify-between cursor-pointer min-h-[40px] hover:bg-[#1C1C28] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#2DD4BF]">
            <path d="M2 3h2l2 8h6l2-6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="14" r="1" fill="currentColor" />
            <circle cx="12" cy="14" r="1" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium text-white">Parlay</span>
          <span className="text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-1.5 py-0.5 rounded font-bold">
            {legCount}
          </span>
          <span className="text-[10px] text-[#8A8A9A] font-mono">{odds.toFixed(2)}x</span>
        </div>
        <span className="text-xs text-[#2DD4BF] font-medium">View Slip</span>
      </div>

      {/* Desktop: sticky bottom-right card */}
      <div
        onClick={onOpen}
        className="hidden md:flex fixed bottom-4 right-4 z-40 bg-[#161622] border border-[#2DD4BF]/20 rounded-xl px-4 py-3 items-center gap-3 cursor-pointer shadow-lg shadow-[#2DD4BF]/10 hover:border-[#2DD4BF]/40 transition-colors min-w-[240px]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#2DD4BF] shrink-0">
          <path d="M2 3h2l2 8h6l2-6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
        </svg>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Parlay Slip</span>
            <span className="text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-1.5 py-0.5 rounded font-bold">
              {legCount} legs
            </span>
          </div>
          <span className="text-xs text-[#8A8A9A] font-mono">Combined: {odds.toFixed(2)}x</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#8A8A9A] shrink-0">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  )
}

// ── ParlayPanel (expanded full panel) ───────────────────────────

function ParlayPanel({
  slip,
  combinedOdds,
  onClose,
  onRemoveLeg,
  onClear,
  onPlace,
}: {
  slip: ReturnType<typeof useParlayStore.getState>['slip']
  combinedOdds: number
  onClose: () => void
  onRemoveLeg: (contractId: string) => void
  onClear: () => void
  onPlace: (stake: number) => void
}) {
  const [stake, setStake] = useState('')
  const parsedStake = parseFloat(stake) || 0
  const potentialPayout = parsedStake * combinedOdds
  const potentialProfit = potentialPayout - parsedStake
  const canPlace = slip.length >= 2 && parsedStake > 0

  const handlePlace = () => {
    if (!canPlace) return
    onPlace(parsedStake)
    setStake('')
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:w-[380px] z-50 bg-[#161622] border-t md:border border-[#252536] md:rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Handle + Header */}
        <div className="md:hidden w-10 h-1 bg-[#252536] rounded-full mx-auto mt-2" />
        <div className="flex items-center justify-between p-4 border-b border-[#252536]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Parlay Slip</h3>
            <span className="text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-1.5 py-0.5 rounded font-medium">
              {slip.length} legs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClear} className="text-xs text-[#8A8A9A] hover:text-[#E85A7E] transition-colors">
              Clear All
            </button>
            <button onClick={onClose} className="text-[#8A8A9A] hover:text-white transition-colors p-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legs */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {slip.map((leg) => (
            <div
              key={leg.contractId}
              className="bg-[#0B0B0F] rounded-lg p-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#8A8A9A] truncate">{leg.eventTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    leg.side === 'YES' ? 'bg-[#2DD4BF]/20 text-[#2DD4BF]' : 'bg-[#E85A7E]/20 text-[#E85A7E]'
                  }`}>
                    {leg.side}
                  </span>
                  <span className="text-xs text-white truncate">{leg.contractLabel}</span>
                  <span className="text-xs text-[#8A8A9A] font-mono">{formatUsdc(leg.price)}</span>
                </div>
              </div>
              <button
                onClick={() => onRemoveLeg(leg.contractId)}
                className="text-[#8A8A9A] hover:text-[#E85A7E] transition-colors p-0.5 shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          {slip.length < 2 && (
            <p className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 rounded-lg p-3">
              Add at least 2 legs to place a parlay
            </p>
          )}
        </div>

        {/* Stake + Summary (pinned bottom) */}
        <div className="p-4 border-t border-[#252536] space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-[#8A8A9A]">Combined odds</span>
            <span className="text-white font-mono font-medium">{combinedOdds.toFixed(2)}x</span>
          </div>

          <div>
            <label className="text-xs text-[#8A8A9A] mb-1 block">Stake (USDC)</label>
            <div className="flex items-center gap-2 bg-[#0B0B0F] border border-[#252536] rounded-lg px-3 py-2">
              <span className="text-sm text-[#8A8A9A]">$</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
                min="0"
                step="0.01"
              />
              <span className="text-xs text-[#8A8A9A]">USDC</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setStake(String(v))}
                  className="flex-1 py-2 text-xs font-medium text-[#8A8A9A] bg-[#0B0B0F] rounded hover:bg-[#252536] hover:text-white transition-colors"
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {parsedStake > 0 && (
            <div className="bg-[#0B0B0F] rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8A8A9A]">Potential payout</span>
                <span className="text-[#2DD4BF] font-mono">{formatUsdc(potentialPayout)} USDC</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#252536] pt-1.5">
                <span className="text-[#8A8A9A]">Potential profit</span>
                <span className="text-[#2DD4BF] font-mono font-medium">
                  +{formatUsdc(potentialProfit)} USDC
                </span>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!canPlace}
            onClick={handlePlace}
          >
            {slip.length < 2
              ? `Need ${2 - slip.length} more leg${2 - slip.length > 1 ? 's' : ''}`
              : parsedStake > 0
                ? `Place Parlay — $${formatUsdc(parsedStake)}`
                : 'Enter Stake Amount'}
          </Button>
        </div>
      </div>
    </>
  )
}

// ── Root ParlaySlip component ───────────────────────────────────

export default function ParlaySlip() {
  const slip = useParlayStore((s) => s.slip)
  const slipOpen = useParlayStore((s) => s.slipOpen)
  const removeLeg = useParlayStore((s) => s.removeLeg)
  const clearSlip = useParlayStore((s) => s.clearSlip)
  const openSlip = useParlayStore((s) => s.openSlip)
  const closeSlip = useParlayStore((s) => s.closeSlip)
  const placeParlay = useParlayStore((s) => s.placeParlay)

  if (slip.length === 0) return null

  const combinedOdds = slip.reduce((acc, leg) => acc / leg.price, 1)

  if (!slipOpen) {
    return <ParlayBar legCount={slip.length} odds={combinedOdds} onOpen={openSlip} />
  }

  return (
    <ParlayPanel
      slip={slip}
      combinedOdds={combinedOdds}
      onClose={closeSlip}
      onRemoveLeg={removeLeg}
      onClear={clearSlip}
      onPlace={(stake) => placeParlay(stake)}
    />
  )
}
