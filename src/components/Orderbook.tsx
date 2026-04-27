import { useMemo, useState } from 'react'
import { useOrderbookStore } from '../stores/orderbookStore'
import DepthChart from './DepthChart'
import type { OrderSide, OrderbookLevel } from '../types'

interface Props {
  isOpen: boolean
  side?: OrderSide
  className?: string
  onPriceClick?: (price: number, side: OrderSide) => void
  compact?: boolean
}

function fmtUsdc(v: number): string {
  return v.toFixed(2)
}

function mirrorLevels(levels: OrderbookLevel[]): OrderbookLevel[] {
  return levels
    .map((l) => ({ price: Math.round((1 - l.price) * 100) / 100, quantity: l.quantity }))
    .filter((l) => l.price > 0 && l.price < 1)
}

export default function Orderbook({ isOpen, side = 'YES', className, onPriceClick, compact }: Props) {
  const rawBids = useOrderbookStore((s) => s.bids)
  const rawAsks = useOrderbookStore((s) => s.asks)
  const lastSeq = useOrderbookStore((s) => s.lastSeq)

  const isNo = side === 'NO'
  const bids = useMemo(() => {
    const src = isNo ? mirrorLevels(rawAsks) : rawBids
    return [...src].sort((a, b) => b.price - a.price)
  }, [rawBids, rawAsks, isNo])

  const asks = useMemo(() => {
    const src = isNo ? mirrorLevels(rawBids) : rawAsks
    return [...src].sort((a, b) => a.price - b.price)
  }, [rawBids, rawAsks, isNo])

  const [showAll, setShowAll] = useState(false)
  const [viewMode, setViewMode] = useState<'levels' | 'depth'>('levels')
  const defaultDepth = compact ? 5 : 8

  const displayAsks = useMemo(
    () => asks.slice(0, defaultDepth).reverse(),
    [asks, defaultDepth],
  )

  const displayBids = useMemo(
    () => (showAll && !compact ? bids : bids.slice(0, defaultDepth)),
    [bids, showAll, compact, defaultDepth],
  )

  const hasMoreDepth = !compact && bids.length > defaultDepth

  const maxQty = useMemo(() => {
    const all = [...displayAsks, ...displayBids]
    return Math.max(...all.map((l) => l.quantity), 1)
  }, [displayAsks, displayBids])

  const bestBid = displayBids[0]?.price ?? 0
  const bestAsk = displayAsks[displayAsks.length - 1]?.price ?? 0
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0

  const bidColor = side === 'YES' ? '#2DD4BF' : '#E85A7E'
  const askColor = side === 'YES' ? '#E85A7E' : '#2DD4BF'

  return (
    <div className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden relative ${className ?? ''}`}>
      {/* Frozen overlay for closed markets */}
      {!isOpen && (
        <div className="absolute inset-0 z-10 bg-[var(--bg-base)]/60 flex items-center justify-center rounded-xl">
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] font-medium">
            市场已关闭，订单簿已冻结
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 border-b border-[var(--border)]">
        <div className="flex gap-4 min-h-[44px] items-center">
          <button
            onClick={() => setViewMode('levels')}
            className={`text-xs font-medium pb-0.5 transition-colors ${
              viewMode === 'levels'
                ? 'text-[#2DD4BF] border-b border-[#2DD4BF]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {side} Book
          </button>
          <button
            onClick={() => setViewMode('depth')}
            className={`text-xs font-medium pb-0.5 transition-colors ${
              viewMode === 'depth'
                ? 'text-[#2DD4BF] border-b border-[#2DD4BF]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Depth
          </button>
        </div>
        {viewMode === 'levels' && (
          <div className="flex gap-6 text-xs font-medium text-[var(--text-secondary)]">
            <span>Qty</span>
            <span>Price</span>
          </div>
        )}
      </div>

      {viewMode === 'levels' ? (
        <>
          {/* Asks — highest at top, lowest near spread */}
          {displayAsks.map((level) => (
            <div
              key={`ask-${level.price}`}
              className={`relative flex justify-between items-center px-3 min-h-[36px] transition-colors ${
                isOpen
                  ? 'cursor-pointer hover:bg-[var(--border)]'
                  : 'cursor-default'
              }`}
              onClick={() => isOpen && onPriceClick?.(level.price, side)}
            >
              <div
                className="absolute inset-y-0 right-0"
                style={{ width: `${(level.quantity / maxQty) * 100}%`, backgroundColor: `${askColor}1A` }}
              />
              <span className="relative text-xs text-[var(--text-secondary)] tabular-nums">{level.quantity}</span>
              <span className="relative text-sm font-mono font-medium tabular-nums" style={{ color: askColor }}>{fmtUsdc(level.price)} USDC</span>
            </div>
          ))}

          {/* Spread divider */}
          <div className="flex items-center justify-between px-3 py-1.5 border-y border-[var(--border)] bg-[var(--bg-base)]">
            <span className="text-xs text-[var(--text-secondary)]">Spread</span>
            <span className="text-sm text-[var(--text-secondary)] font-mono font-medium tabular-nums">{fmtUsdc(spread)} USDC</span>
          </div>

          {/* Bids — highest near spread, lowest at bottom */}
          {displayBids.map((level) => (
            <div
              key={`bid-${level.price}`}
              className={`relative flex justify-between items-center px-3 min-h-[36px] transition-colors ${
                isOpen
                  ? 'cursor-pointer hover:bg-[var(--border)]'
                  : 'cursor-default'
              }`}
              onClick={() => isOpen && onPriceClick?.(level.price, side)}
            >
              <div
                className="absolute inset-y-0 right-0"
                style={{ width: `${(level.quantity / maxQty) * 100}%`, backgroundColor: `${bidColor}1A` }}
              />
              <span className="relative text-xs text-[var(--text-secondary)] tabular-nums">{level.quantity}</span>
              <span className="relative text-sm font-mono font-medium tabular-nums" style={{ color: bidColor }}>{fmtUsdc(level.price)} USDC</span>
            </div>
          ))}

          {hasMoreDepth && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full text-center min-h-[44px] text-xs text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors border-t border-[var(--border)]"
            >
              {showAll ? 'Show Less' : `Show All (${bids.length})`}
            </button>
          )}
        </>
      ) : (
        <DepthChart />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 min-h-[44px] border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-secondary)]">{side} Bids · Asks</span>
          <span
            className="text-[var(--text-secondary)] cursor-help p-2 -m-2"
            title="YES bid X USDC = NO ask (1−X) USDC. Binary market equivalence."
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
        </div>
        <span className="text-sm text-[var(--text-secondary)] font-medium tabular-nums font-mono">Seq: {lastSeq}</span>
      </div>
    </div>
  )
}
