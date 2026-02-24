import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, AreaSeries, type IChartApi, type Time } from 'lightweight-charts'
import { getPnlHistory, getLatestPnl, type PnlRange } from '../data/pnlHistory'
import { useThemeStore } from '../stores/themeStore'

const RANGES: PnlRange[] = ['1D', '1W', '1M', 'ALL']

function getThemeColors() {
  const s = getComputedStyle(document.documentElement)
  const v = (name: string) => s.getPropertyValue(name).trim()
  return {
    bgCard: v('--bg-card'),
    bgControl: v('--bg-control'),
    border: v('--border'),
    textPrimary: v('--text-primary'),
    textSecondary: v('--text-secondary'),
  }
}

function formatPnl(v: number): string {
  const sign = v >= 0 ? '+' : ''
  return `${sign}$${Math.abs(v).toFixed(2)}`
}

function formatDate(timeStr: string, range: PnlRange): string {
  if (range === '1D' && timeStr.includes(' ')) {
    const [datePart, timePart] = timeStr.split(' ')
    const d = new Date(datePart)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + timePart
  }
  const d = new Date(timeStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  className?: string
  portfolioValue: number
}

export default function PnlChart({ className, portfolioValue }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const theme = useThemeStore((s) => s.theme)
  const [range, setRange] = useState<PnlRange>('1M')
  const [hoverPnl, setHoverPnl] = useState<number | null>(null)
  const [hoverTime, setHoverTime] = useState<string | null>(null)

  const latestPnl = getLatestPnl()
  const displayPnl = hoverPnl ?? latestPnl
  const data = getPnlHistory(range)
  const displayTime = hoverTime ?? (data.length > 0 ? data[data.length - 1].time : '')
  const isPositive = displayPnl >= 0

  const handleCrosshairMove = useCallback((param: any) => {
    if (!param?.time || !param.seriesData?.size) {
      setHoverPnl(null)
      setHoverTime(null)
      return
    }
    const entry = param.seriesData.values().next().value
    if (entry && typeof entry.value === 'number') {
      setHoverPnl(Math.round(entry.value * 100) / 100)
      setHoverTime(String(param.time))
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const tc = getThemeColors()
    const positive = data.length > 0 && data[data.length - 1].value >= 0
    const lineColor = positive ? '#2DD4BF' : '#E85A7E'
    const topFill = positive ? 'rgba(45, 212, 191, 0.25)' : 'rgba(232, 90, 126, 0.25)'
    const bottomFill = positive ? 'rgba(45, 212, 191, 0.02)' : 'rgba(232, 90, 126, 0.02)'

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: tc.bgCard },
        textColor: tc.textSecondary,
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: tc.border, style: 3 },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.15, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { color: tc.textSecondary, width: 1, style: 3, labelVisible: false },
        horzLine: { color: tc.textSecondary, width: 1, style: 3, labelVisible: true },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: false,
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: topFill,
      bottomColor: bottomFill,
      lineWidth: 2,
      priceFormat: { type: 'custom', formatter: (p: number) => formatPnl(p) },
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: tc.bgCard,
    })

    const chartData = data.map((p) => ({
      time: (range === '1D' && p.time.includes(' ') ? p.time : p.time) as Time,
      value: p.value,
    }))
    series.setData(chartData)
    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(handleCrosshairMove)
    chartRef.current = chart

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        chart.applyOptions({ width, height })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [range, theme, handleCrosshairMove])

  return (
    <div className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isPositive ? '#2DD4BF' : '#E85A7E' }}
            />
            <span className="text-xs font-medium text-[var(--text-secondary)]">P&L</span>
          </div>
          <div className="flex gap-1 bg-[var(--bg-control)] rounded-lg p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  range === r
                    ? 'bg-[var(--border)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono tabular-nums ${isPositive ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
          {formatPnl(displayPnl)}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
          {formatDate(displayTime, range)}
        </div>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="w-full h-[160px] md:h-[200px]"
      />

      {/* Footer: Portfolio Value */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--text-secondary)]">Portfolio Value</span>
        <span className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">
          ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
