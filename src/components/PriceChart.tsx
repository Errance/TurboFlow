import { useEffect, useRef } from 'react'
import { createChart, LineSeries, type IChartApi, type Time } from 'lightweight-charts'
import { getPriceHistory } from '../data/priceHistory'
import { useThemeStore } from '../stores/themeStore'

interface Props {
  marketId: string
  className?: string
}

function getThemeColors() {
  const s = getComputedStyle(document.documentElement)
  const v = (name: string) => s.getPropertyValue(name).trim()
  return {
    bgCard: v('--bg-card'),
    textSecondary: v('--text-secondary'),
    border: v('--border'),
  }
}

export default function PriceChart({ marketId, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    if (!containerRef.current) return

    const tc = getThemeColors()
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: tc.bgCard },
        textColor: tc.textSecondary,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: tc.border },
        horzLines: { color: tc.border },
      },
      rightPriceScale: {
        borderColor: tc.border,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: tc.border,
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: tc.textSecondary, width: 1, style: 3 },
        horzLine: { color: tc.textSecondary, width: 1, style: 3 },
      },
      handleScroll: true,
      handleScale: true,
    })

    const logoEl = containerRef.current.querySelector('[class*="apply-common-tooltip"]') as HTMLElement
    if (logoEl) logoEl.style.display = 'none'

    const yesSeries = chart.addSeries(LineSeries, {
      color: '#2DD4BF',
      lineWidth: 2,
      title: 'YES',
      priceFormat: { type: 'custom', formatter: (p: number) => `${p.toFixed(2)}` },
    })

    const noSeries = chart.addSeries(LineSeries, {
      color: '#E85A7E',
      lineWidth: 2,
      title: 'NO',
      priceFormat: { type: 'custom', formatter: (p: number) => `${p.toFixed(2)}` },
    })

    const history = getPriceHistory(marketId)
    yesSeries.setData(history.map((p) => ({ time: p.time as Time, value: p.yes })))
    noSeries.setData(history.map((p) => ({ time: p.time as Time, value: p.no })))

    chart.timeScale().fitContent()
    chartRef.current = chart

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        chart.applyOptions({ width, height })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [marketId, theme])

  return (
    <div className={className}>
      <div className="flex items-center gap-4 mb-2">
        <span className="text-xs font-medium text-[#2DD4BF]">● YES</span>
        <span className="text-xs font-medium text-[#E85A7E]">● NO</span>
      </div>
      <div
        ref={containerRef}
        className="w-full h-[240px] md:h-[300px] rounded-lg overflow-hidden"
      />
    </div>
  )
}
