import { useMemo, useState } from 'react'
import { useOrderbookStore } from '../stores/orderbookStore'
import DepthChart from './DepthChart'
import type { OrderSide } from '../types'

interface Props {
  isOpen: boolean
  className?: string
  onPriceClick?: (price: number, side: OrderSide) => void
}

function centsToUsdc(cents: number): string {
  return (cents / 100).toFixed(2)
}

export default function Orderbook({ isOpen, className, onPriceClick }: Props) {
  const bids = useOrderbookStore((s) => s.bids)
  const lastSeq = useOrderbookStore((s) => s.lastSeq)

  const [showAll, setShowAll] = useState(false)
  const [viewMode, setViewMode] = useState<'levels' | 'depth'>('levels')
  const defaultDepth = 8

  const displayBids = useMemo(
    () => (showAll ? bids : bids.slice(0, defaultDepth)),
    [bids, showAll],
  )

  const hasMoreDepth = bids.length > defaultDepth

  const maxQty = useMemo(() => {
    return Math.max(...displayBids.map((l) => l.quantity), 1)
  }, [displayBids])

  return (
    <div className={`bg-[#161622] rounded-xl border border-[#252536] overflow-hidden relative ${className ?? ''}`}>
      {/* Frozen overlay for closed markets */}
      {!isOpen && (
        <div className="absolute inset-0 z-10 bg-[#0B0B0F]/60 flex items-center justify-center rounded-xl">
          <span className="bg-[#161622] border border-[#252536] px-4 py-2 rounded-lg text-sm text-[#8A8A9A] font-medium">
            Market Closed — Orderbook Frozen
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#252536]">
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode('levels')}
            className={`text-xs font-medium pb-0.5 transition-colors ${
              viewMode === 'levels'
                ? 'text-[#2DD4BF] border-b border-[#2DD4BF]'
                : 'text-[#8A8A9A] hover:text-white'
            }`}
          >
            YES Bids
          </button>
          <button
            onClick={() => setViewMode('depth')}
            className={`text-xs font-medium pb-0.5 transition-colors ${
              viewMode === 'depth'
                ? 'text-[#2DD4BF] border-b border-[#2DD4BF]'
                : 'text-[#8A8A9A] hover:text-white'
            }`}
          >
            Depth
          </button>
        </div>
        {viewMode === 'levels' && (
          <div className="flex gap-6 text-xs font-medium text-[#8A8A9A]">
            <span>Qty</span>
            <span>Price</span>
          </div>
        )}
      </div>

      {viewMode === 'levels' ? (
        <>
          {displayBids.map((level) => (
            <div
              key={`bid-${level.price}`}
              className={`relative flex justify-between items-center px-3 min-h-[44px] transition-colors ${
                isOpen
                  ? 'cursor-pointer hover:bg-[#252536]/50'
                  : 'cursor-default'
              }`}
              onClick={() => isOpen && onPriceClick?.(level.price, 'YES')}
            >
              <div
                className="absolute inset-y-0 right-0 bg-[#2DD4BF]/10"
                style={{ width: `${(level.quantity / maxQty) * 100}%` }}
              />
              <span className="relative text-xs text-[#8A8A9A] tabular-nums">{level.quantity}</span>
              <span className="relative text-sm font-mono text-[#2DD4BF] tabular-nums">{centsToUsdc(level.price)} USDC</span>
            </div>
          ))}

          {hasMoreDepth && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full text-center py-2 text-xs text-[#8A8A9A] hover:text-[#2DD4BF] transition-colors border-t border-[#252536]"
            >
              {showAll ? 'Show Less' : `Show All (${bids.length})`}
            </button>
          )}
        </>
      ) : (
        <DepthChart />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#252536]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#8A8A9A]">Bids Only</span>
          <span
            className="text-[#8A8A9A] cursor-help"
            title="YES bid X USDC = NO ask (1−X) USDC. Binary market equivalence."
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
        </div>
        <span className="text-xs text-[#8A8A9A] tabular-nums">Seq: {lastSeq}</span>
      </div>
    </div>
  )
}
