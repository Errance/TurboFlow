import { useEffect, useRef, useState, useCallback } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'
import { EC_ASSETS, type ECAsset } from '../../types/eventContract'
import type { ECGlobalSettlement } from '../../types/eventContract'
import { getPriceHistory } from '../../data/ecPriceEngine'

function formatPrice(price: number) {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

interface PriceRange {
  min: number
  max: number
  height: number
}

function Sparkline({
  asset,
  duration,
  onRangeUpdate,
}: {
  asset: ECAsset
  duration: number
  onRangeUpdate?: (range: PriceRange) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentPrices = useEventContractStore((s) => s.currentPrices)
  const activeBets = useEventContractStore((s) => s.activeBets)
  const settledBets = useEventContractStore((s) => s.settledBets)
  const rangeRef = useRef<PriceRange>({ min: 0, max: 0, height: 0 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const count = Math.min(duration * 2, 300)
    const points = getPriceHistory(asset, count)
    if (points.length < 2) return

    const w = rect.width
    const h = rect.height

    const now = Date.now()
    const tickMs = 500
    const windowMs = points.length * tickMs
    const windowStart = now - windowMs

    const allBets = [...activeBets, ...settledBets]
    const visibleBets = allBets.filter(
      (b) => b.asset === asset && b.createdAt >= windowStart
    )

    let min = Math.min(...points)
    let max = Math.max(...points)
    for (const b of visibleBets) {
      if (b.entryPrice < min) min = b.entryPrice
      if (b.entryPrice > max) max = b.entryPrice
    }
    const range = max - min || 1

    const newRange = { min, max, height: h }
    if (
      rangeRef.current.min !== min ||
      rangeRef.current.max !== max ||
      rangeRef.current.height !== h
    ) {
      rangeRef.current = newRange
      onRangeUpdate?.(newRange)
    }

    ctx.clearRect(0, 0, w, h)

    const isUp = points[points.length - 1] >= points[0]
    const color = isUp ? '#2DD4BF' : '#F87171'

    const toY = (price: number) => h - ((price - min) / range) * h * 0.8 - h * 0.1

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, isUp ? 'rgba(45,212,191,0.15)' : 'rgba(248,113,113,0.15)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = toY(p)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Fill
    const lastX = w
    const firstX = 0
    ctx.lineTo(lastX, h)
    ctx.lineTo(firstX, h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Draw bet markers
    for (const bet of visibleBets) {
      const ticksFromEnd = (now - bet.createdAt) / tickMs
      const idx = points.length - 1 - ticksFromEnd
      if (idx < 0 || idx > points.length - 1) continue

      const bx = (idx / (points.length - 1)) * w
      const by = toY(bet.entryPrice)
      const isHigher = bet.direction === 'higher'
      const mc = isHigher ? '#2DD4BF' : '#F87171'
      const isSettled = bet.status === 'won' || bet.status === 'lost'
      const r = isSettled ? 4 : 5

      if (isSettled && bet.settlementPrice != null) {
        const sy = toY(bet.settlementPrice)
        ctx.beginPath()
        ctx.setLineDash([3, 3])
        ctx.moveTo(bx, by)
        ctx.lineTo(bx, sy)
        ctx.strokeStyle = mc + '60'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.setLineDash([])
      }

      if (isSettled) {
        ctx.beginPath()
        ctx.arc(bx, by, r + 2, 0, Math.PI * 2)
        ctx.fillStyle = (mc + '15')
        ctx.fill()

        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.strokeStyle = mc
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = mc + '30'
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(bx, by, r + 3, 0, Math.PI * 2)
        ctx.fillStyle = isHigher ? 'rgba(45,212,191,0.2)' : 'rgba(248,113,113,0.2)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fillStyle = mc
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'
        ctx.lineWidth = 1
        ctx.stroke()

        const triSize = 5
        const triOffset = r + triSize + 2
        ctx.beginPath()
        if (isHigher) {
          const ty = by - triOffset
          ctx.moveTo(bx, ty - triSize)
          ctx.lineTo(bx - triSize, ty + triSize * 0.6)
          ctx.lineTo(bx + triSize, ty + triSize * 0.6)
        } else {
          const ty = by + triOffset
          ctx.moveTo(bx, ty + triSize)
          ctx.lineTo(bx - triSize, ty - triSize * 0.6)
          ctx.lineTo(bx + triSize, ty - triSize * 0.6)
        }
        ctx.closePath()
        ctx.fillStyle = mc
        ctx.fill()
      }

      const isWon = bet.status === 'won'
      const label = isSettled
        ? `${isWon ? 'W' : 'L'} ${isWon ? '+' : ''}$${(bet.pnl ?? 0).toFixed(0)}`
        : `$${bet.entryPrice.toFixed(asset === 'BTC' ? 0 : 1)}`
      ctx.font = isSettled ? 'bold 10px system-ui, sans-serif' : '10px system-ui, sans-serif'
      ctx.textAlign = bx > w * 0.8 ? 'right' : 'left'
      ctx.textBaseline = 'middle'
      const lx = bx > w * 0.8 ? bx - r - 6 : bx + r + 6
      const labelY = isHigher ? by - r - 10 : by + r + 10
      const metrics = ctx.measureText(label)
      const pad = 4

      if (isSettled) {
        ctx.fillStyle = isWon ? 'rgba(45,212,191,0.25)' : 'rgba(248,113,113,0.25)'
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
      }
      const bgX = ctx.textAlign === 'right' ? lx - metrics.width - pad : lx - pad
      ctx.beginPath()
      const bgW = metrics.width + pad * 2
      const bgH = 14
      const bgY = labelY - 7
      const cr = 3
      ctx.moveTo(bgX + cr, bgY)
      ctx.lineTo(bgX + bgW - cr, bgY)
      ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + cr)
      ctx.lineTo(bgX + bgW, bgY + bgH - cr)
      ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - cr, bgY + bgH)
      ctx.lineTo(bgX + cr, bgY + bgH)
      ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - cr)
      ctx.lineTo(bgX, bgY + cr)
      ctx.quadraticCurveTo(bgX, bgY, bgX + cr, bgY)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = mc
      ctx.fillText(label, lx, labelY)
    }
  }, [asset, duration, currentPrices, activeBets, settledBets, onRangeUpdate])

  useEffect(() => {
    draw()
    const id = setInterval(draw, 500)
    return () => clearInterval(id)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48 md:h-80"
      style={{ display: 'block' }}
    />
  )
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

function SettlementFloat({ s, priceRange }: { s: ECGlobalSettlement; priceRange: PriceRange }) {
  const won = s.pnl > 0
  const { min, max, height } = priceRange
  const range = max - min || 1

  const yPct = ((s.price - min) / range) * 0.8 + 0.1
  const yPx = height - yPct * height

  const h = hashId(s.id)
  const randX = (h % 60) / 10
  const randYJitter = ((h >> 4) % 20) - 10

  const dyMid = won ? -(25 + (h % 20)) : (25 + (h % 20))
  const dyEnd = won ? -(50 + (h % 30)) : (50 + (h % 30))
  const dxMid = 8 + (h % 12)
  const dxEnd = 15 + (h % 15)

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        right: `${2 + randX}%`,
        top: `${Math.max(8, Math.min(yPx + randYJitter, height - 24))}px`,
        animation: `settleScatter 4.5s ease-out forwards`,
        ['--dy-mid' as string]: `${dyMid}px`,
        ['--dy-end' as string]: `${dyEnd}px`,
        ['--dx-mid' as string]: `${dxMid}px`,
        ['--dx-end' as string]: `${dxEnd}px`,
      }}
    >
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 whitespace-nowrap"
        style={{
          background: won ? 'rgba(45,212,191,0.2)' : 'rgba(248,113,113,0.2)',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: won ? '#2DD4BF' : '#F87171' }}
        />
        <span
          className="text-[11px] font-bold"
          style={{
            color: won ? '#2DD4BF' : '#F87171',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          {s.playerName} {won ? '+' : ''}{s.pnl.toFixed(0)}
        </span>
      </span>
    </div>
  )
}

function MomentumBadge({ asset }: { asset: ECAsset }) {
  const price = useEventContractStore((s) => s.currentPrices[asset])
  const [prev, setPrev] = useState(price)
  const [momentum, setMomentum] = useState<'bullish' | 'bearish' | 'neutral'>('neutral')

  useEffect(() => {
    const diff = price - prev
    const pct = Math.abs(diff / prev)
    if (pct > 0.0001) {
      setMomentum(diff > 0 ? 'bullish' : 'bearish')
    } else {
      setMomentum('neutral')
    }
    setPrev(price)
  }, [price])

  const label =
    momentum === 'bullish' ? '偏强' : momentum === 'bearish' ? '偏弱' : '平稳'
  const color =
    momentum === 'bullish'
      ? 'text-[#2DD4BF]'
      : momentum === 'bearish'
        ? 'text-[#F87171]'
        : 'text-[var(--text-tertiary)]'

  return <span className={`text-[10px] font-medium ${color}`}>{label}</span>
}

export function MarketPriceBar() {
  const currentAsset = useEventContractStore((s) => s.currentAsset)
  const setAsset = useEventContractStore((s) => s.setAsset)
  const currentPrices = useEventContractStore((s) => s.currentPrices)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevPrice = useRef(currentPrices[currentAsset])

  const price = currentPrices[currentAsset]

  useEffect(() => {
    if (price > prevPrice.current) setFlash('up')
    else if (price < prevPrice.current) setFlash('down')
    prevPrice.current = price

    const t = setTimeout(() => setFlash(null), 300)
    return () => clearTimeout(t)
  }, [price])

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[#2DD4BF]/40 transition-colors"
        >
          <span className="text-sm font-semibold">{currentAsset}/USDT</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[120px]">
            {EC_ASSETS.map((a) => (
              <button
                key={a}
                onClick={() => { setAsset(a); setDropdownOpen(false) }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)] transition-colors ${
                  a === currentAsset ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'
                }`}
              >
                {a}/USDT
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <MomentumBadge asset={currentAsset} />
        <span
          className={`text-xl md:text-2xl font-bold tabular-nums transition-colors duration-200 ${
            flash === 'up'
              ? 'text-[#2DD4BF]'
              : flash === 'down'
                ? 'text-[#F87171]'
                : 'text-[var(--text-primary)]'
          }`}
        >
          ${formatPrice(price)}
        </span>
      </div>
    </div>
  )
}

export function MarketChart() {
  const currentAsset = useEventContractStore((s) => s.currentAsset)
  const currentDuration = useEventContractStore((s) => s.currentDuration)
  const globalSettlements = useEventContractStore((s) => s.globalSettlements)
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 0, height: 0 })

  const assetSettlements = globalSettlements.filter((s) => s.asset === currentAsset)

  return (
    <>
      <style>{`
        @keyframes settleScatter {
          0% { opacity: 0.95; transform: translate(0, 0); }
          50% { opacity: 0.85; transform: translate(var(--dx-mid), var(--dy-mid)); }
          100% { opacity: 0; transform: translate(var(--dx-end), var(--dy-end)); }
        }
      `}</style>
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden relative">
        <Sparkline
          asset={currentAsset}
          duration={currentDuration}
          onRangeUpdate={setPriceRange}
        />
        {priceRange.height > 0 && assetSettlements.map((s) => (
          <SettlementFloat key={s.id} s={s} priceRange={priceRange} />
        ))}
      </div>
    </>
  )
}

export default function MarketStage() {
  return (
    <section className="mb-4">
      <MarketPriceBar />
      <MarketChart />
    </section>
  )
}
