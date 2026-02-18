import { useMemo, useState } from 'react'
import { useOrderbookStore } from '../stores/orderbookStore'
import DepthChart from './DepthChart'
import type { OrderSide } from '../types'

interface Props {
  isOpen: boolean
  className?: string
  onPriceClick?: (price: number, side: OrderSide) => void
}

export default function Orderbook({ isOpen, className, onPriceClick }: Props) {
  const bids = useOrderbookStore((s) => s.bids)
  const asks = useOrderbookStore((s) => s.asks)
  const lastSeq = useOrderbookStore((s) => s.lastSeq)

  const [showAll, setShowAll] = useState(false)
  const [viewMode, setViewMode] = useState<'levels' | 'depth'>('levels')
  const defaultDepth = 8

  const sortedAsks = useMemo(
    () => [...asks].sort((a, b) => a.price - b.price),
    [asks],
  )

  const displayAsks = useMemo(
    () => (showAll ? [...sortedAsks].reverse() : sortedAsks.slice(0, defaultDepth).reverse()),
    [sortedAsks, showAll],
  )
  const displayBids = useMemo(
    () => (showAll ? bids : bids.slice(0, defaultDepth)),
    [bids, showAll],
  )

  const hasMoreDepth = asks.length > defaultDepth || bids.length > defaultDepth

  const maxQty = useMemo(() => {
    const all = [...displayBids, ...displayAsks]
    return Math.max(...all.map((l) => l.quantity), 1)
  }, [displayBids, displayAsks])

  const bestBid = displayBids[0]?.price ?? 0
  const bestAsk = displayAsks[displayAsks.length - 1]?.price ?? 0
  const spread = bestAsk > 0 && bestBid > 0 ? (bestAsk - bestBid).toFixed(1) : '—'

  if (!isOpen) {
    return (
      <div className={`bg-[#161622] rounded-xl border border-[#252536] p-6 text-center ${className ?? ''}`}>
        <p className="text-[#8A8A9A] text-sm">Market closed — orderbook frozen</p>
      </div>
    )
  }

  return (
    <div className={`bg-[#161622] rounded-xl border border-[#252536] overflow-hidden ${className ?? ''}`}>
      {/* Header with Levels/Depth tabs */}
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
            Levels
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
          {/* Asks (top, pink) — lowest ask at bottom, closest to spread */}
          {displayAsks.map((level) => (
            <div
              key={`ask-${level.price}`}
              className="relative flex justify-between items-center px-3 min-h-[44px] cursor-pointer hover:bg-[#252536]/50 transition-colors"
              onClick={() => onPriceClick?.(level.price, 'NO')}
            >
              <div
                className="absolute inset-y-0 right-0 bg-[#E85A7E]/10"
                style={{ width: `${(level.quantity / maxQty) * 100}%` }}
              />
              <span className="relative text-xs text-[#8A8A9A] tabular-nums">{level.quantity}</span>
              <span className="relative text-sm font-mono text-[#E85A7E] tabular-nums">{level.price}¢</span>
            </div>
          ))}

          {/* Spread */}
          <div className="flex justify-center items-center py-1.5 border-y border-[#252536] bg-[#0B0B0F]/50">
            <span className="text-xs text-[#8A8A9A]">Spread: {spread}¢</span>
          </div>

          {/* Bids (bottom, teal) — highest bid at top, closest to spread */}
          {displayBids.map((level) => (
            <div
              key={`bid-${level.price}`}
              className="relative flex justify-between items-center px-3 min-h-[44px] cursor-pointer hover:bg-[#252536]/50 transition-colors"
              onClick={() => onPriceClick?.(level.price, 'YES')}
            >
              <div
                className="absolute inset-y-0 right-0 bg-[#2DD4BF]/10"
                style={{ width: `${(level.quantity / maxQty) * 100}%` }}
              />
              <span className="relative text-xs text-[#8A8A9A] tabular-nums">{level.quantity}</span>
              <span className="relative text-sm font-mono text-[#2DD4BF] tabular-nums">{level.price}¢</span>
            </div>
          ))}

          {/* Show More / Less */}
          {hasMoreDepth && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full text-center py-2 text-xs text-[#8A8A9A] hover:text-[#2DD4BF] transition-colors border-t border-[#252536]"
            >
              {showAll ? 'Show Less' : `Show All (${asks.length + bids.length})`}
            </button>
          )}
        </>
      ) : (
        <DepthChart />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#252536]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#8A8A9A]">仅显示 Bids</span>
          <span
            className="text-[#8A8A9A] cursor-help"
            title="YES bid X 等价 NO ask (100-X)"
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
