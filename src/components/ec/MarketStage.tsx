import { useEffect, useRef, useState, useCallback } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'
import { EC_ASSETS, type ECAsset } from '../../types/eventContract'
import { getPriceHistory } from '../../data/ecPriceEngine'

function formatPrice(price: number) {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function Sparkline({ asset, duration }: { asset: ECAsset; duration: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentPrices = useEventContractStore((s) => s.currentPrices)

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
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1

    ctx.clearRect(0, 0, w, h)

    const isUp = points[points.length - 1] >= points[0]
    const color = isUp ? '#2DD4BF' : '#F87171'

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, isUp ? 'rgba(45,212,191,0.15)' : 'rgba(248,113,113,0.15)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - min) / range) * h * 0.8 - h * 0.1
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
  }, [asset, duration, currentPrices])

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
    momentum === 'bullish' ? 'Bullish' : momentum === 'bearish' ? 'Bearish' : 'Neutral'
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

  return (
    <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
      <Sparkline asset={currentAsset} duration={currentDuration} />
    </div>
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
