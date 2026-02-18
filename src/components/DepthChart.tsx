import { useMemo, useRef, useEffect, useState } from 'react'
import { useOrderbookStore } from '../stores/orderbookStore'

const CHART_HEIGHT = 200
const PADDING = { top: 12, right: 16, bottom: 28, left: 48 }
const COLORS = {
  bid: '#2DD4BF',
  bidFill: 'rgba(45, 212, 191, 0.15)',
  ask: '#E85A7E',
  askFill: 'rgba(232, 90, 126, 0.15)',
  axis: '#8A8A9A',
  grid: '#252536',
  bg: '#161622',
  spread: '#0B0B0F',
}

interface CumulativePoint {
  price: number
  cumulative: number
}

function buildCumulativeBids(bids: { price: number; quantity: number }[]): CumulativePoint[] {
  const sorted = [...bids].sort((a, b) => b.price - a.price)
  const points: CumulativePoint[] = []
  let cum = 0
  for (const level of sorted) {
    cum += level.quantity
    points.push({ price: level.price, cumulative: cum })
  }
  return points
}

function buildCumulativeAsks(asks: { price: number; quantity: number }[]): CumulativePoint[] {
  const sorted = [...asks].sort((a, b) => a.price - b.price)
  const points: CumulativePoint[] = []
  let cum = 0
  for (const level of sorted) {
    cum += level.quantity
    points.push({ price: level.price, cumulative: cum })
  }
  return points
}

function buildStepPath(
  points: CumulativePoint[],
  side: 'bid' | 'ask',
  xScale: (p: number) => number,
  yScale: (q: number) => number,
  _drawAreaHeight: number,
): { line: string; area: string } {
  if (points.length === 0) return { line: '', area: '' }

  const segments: string[] = []
  const areaSegments: string[] = []

  const baseY = yScale(0)

  if (side === 'bid') {
    const startX = xScale(points[0].price)
    segments.push(`M ${startX} ${yScale(points[0].cumulative)}`)
    areaSegments.push(`M ${startX} ${baseY}`)
    areaSegments.push(`L ${startX} ${yScale(points[0].cumulative)}`)

    for (let i = 1; i < points.length; i++) {
      const prevY = yScale(points[i - 1].cumulative)
      const currX = xScale(points[i].price)
      const currY = yScale(points[i].cumulative)
      segments.push(`L ${currX} ${prevY}`)
      segments.push(`L ${currX} ${currY}`)
      areaSegments.push(`L ${currX} ${prevY}`)
      areaSegments.push(`L ${currX} ${currY}`)
    }

    const lastX = xScale(points[points.length - 1].price)
    areaSegments.push(`L ${lastX} ${baseY}`)
    areaSegments.push('Z')
  } else {
    const startX = xScale(points[0].price)
    segments.push(`M ${startX} ${yScale(points[0].cumulative)}`)
    areaSegments.push(`M ${startX} ${baseY}`)
    areaSegments.push(`L ${startX} ${yScale(points[0].cumulative)}`)

    for (let i = 1; i < points.length; i++) {
      const prevY = yScale(points[i - 1].cumulative)
      const currX = xScale(points[i].price)
      const currY = yScale(points[i].cumulative)
      segments.push(`L ${currX} ${prevY}`)
      segments.push(`L ${currX} ${currY}`)
      areaSegments.push(`L ${currX} ${prevY}`)
      areaSegments.push(`L ${currX} ${currY}`)
    }

    const lastX = xScale(points[points.length - 1].price)
    areaSegments.push(`L ${lastX} ${baseY}`)
    areaSegments.push('Z')
  }

  return { line: segments.join(' '), area: areaSegments.join(' ') }
}

export default function DepthChart({ className }: { className?: string }) {
  const bids = useOrderbookStore((s) => s.bids)
  const asks = useOrderbookStore((s) => s.asks)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const cumBids = useMemo(() => buildCumulativeBids(bids), [bids])
  const cumAsks = useMemo(() => buildCumulativeAsks(asks), [asks])

  const { minPrice, maxPrice, maxCum } = useMemo(() => {
    const allPrices = [...cumBids.map((p) => p.price), ...cumAsks.map((p) => p.price)]
    const allCum = [...cumBids.map((p) => p.cumulative), ...cumAsks.map((p) => p.cumulative)]
    return {
      minPrice: allPrices.length ? Math.min(...allPrices) : 0,
      maxPrice: allPrices.length ? Math.max(...allPrices) : 100,
      maxCum: allCum.length ? Math.max(...allCum) : 1,
    }
  }, [cumBids, cumAsks])

  const drawW = width - PADDING.left - PADDING.right
  const drawH = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const priceRange = maxPrice - minPrice || 1
  const xScale = (price: number) => PADDING.left + ((price - minPrice) / priceRange) * drawW
  const yScale = (cum: number) => PADDING.top + drawH - (cum / (maxCum || 1)) * drawH

  const bidPath = useMemo(
    () => buildStepPath(cumBids, 'bid', xScale, yScale, drawH),
    [cumBids, drawW, drawH, minPrice, maxPrice, maxCum],
  )
  const askPath = useMemo(
    () => buildStepPath(cumAsks, 'ask', xScale, yScale, drawH),
    [cumAsks, drawW, drawH, minPrice, maxPrice, maxCum],
  )

  const yTicks = useMemo(() => {
    const count = 4
    const step = maxCum / count
    return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step))
  }, [maxCum])

  const xTicks = useMemo(() => {
    const count = 5
    const step = priceRange / count
    return Array.from({ length: count + 1 }, (_, i) =>
      Math.round((minPrice + i * step) * 10) / 10,
    )
  }, [minPrice, priceRange])

  const bestBid = cumBids.length ? cumBids[0].price : null
  const bestAsk = cumAsks.length ? cumAsks[0].price : null

  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[200px] text-sm text-[#8A8A9A] ${className ?? ''}`}>
        No depth data
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`w-full ${className ?? ''}`}>
      <svg width={width} height={CHART_HEIGHT} className="block">
        <rect width={width} height={CHART_HEIGHT} fill={COLORS.bg} rx={0} />

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={`yg-${tick}`}
            x1={PADDING.left}
            y1={yScale(tick)}
            x2={width - PADDING.right}
            y2={yScale(tick)}
            stroke={COLORS.grid}
            strokeWidth={1}
            strokeDasharray="2,3"
          />
        ))}

        {/* Spread zone */}
        {bestBid != null && bestAsk != null && (
          <rect
            x={xScale(bestBid)}
            y={PADDING.top}
            width={Math.max(0, xScale(bestAsk) - xScale(bestBid))}
            height={drawH}
            fill={COLORS.spread}
            opacity={0.5}
          />
        )}

        {/* Bid area + line */}
        {bidPath.area && (
          <path d={bidPath.area} fill={COLORS.bidFill} />
        )}
        {bidPath.line && (
          <path d={bidPath.line} fill="none" stroke={COLORS.bid} strokeWidth={1.5} />
        )}

        {/* Ask area + line */}
        {askPath.area && (
          <path d={askPath.area} fill={COLORS.askFill} />
        )}
        {askPath.line && (
          <path d={askPath.line} fill="none" stroke={COLORS.ask} strokeWidth={1.5} />
        )}

        {/* Y axis labels */}
        {yTicks.map((tick) => (
          <text
            key={`yl-${tick}`}
            x={PADDING.left - 6}
            y={yScale(tick) + 4}
            textAnchor="end"
            fill={COLORS.axis}
            fontSize={10}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {tick}
          </text>
        ))}

        {/* X axis labels */}
        {xTicks.map((tick) => (
          <text
            key={`xl-${tick}`}
            x={xScale(tick)}
            y={CHART_HEIGHT - 6}
            textAnchor="middle"
            fill={COLORS.axis}
            fontSize={10}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {tick}¢
          </text>
        ))}
      </svg>
    </div>
  )
}
