import { useEffect, useRef } from 'react'
import { createChart, LineSeries, type IChartApi, type ISeriesApi, type Time } from 'lightweight-charts'
import { priceHistories } from '../data/priceHistory'

interface Props {
  marketId: string
  className?: string
}

export default function PriceChart({ marketId, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#161622' },
        textColor: '#8A8A9A',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#252536' },
        horzLines: { color: '#252536' },
      },
      rightPriceScale: {
        borderColor: '#252536',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#252536',
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: '#8A8A9A', width: 1, style: 3 },
        horzLine: { color: '#8A8A9A', width: 1, style: 3 },
      },
      handleScroll: true,
      handleScale: true,
    })

    const yesSeries = chart.addSeries(LineSeries, {
      color: '#2DD4BF',
      lineWidth: 2,
      title: 'YES',
      priceFormat: { type: 'custom', formatter: (p: number) => `${p.toFixed(1)}¢` },
    })

    const noSeries = chart.addSeries(LineSeries, {
      color: '#E85A7E',
      lineWidth: 2,
      title: 'NO',
      priceFormat: { type: 'custom', formatter: (p: number) => `${p.toFixed(1)}¢` },
    })

    const history = priceHistories[marketId]
    if (history) {
      yesSeries.setData(history.map((p) => ({ time: p.time as Time, value: p.yes })))
      noSeries.setData(history.map((p) => ({ time: p.time as Time, value: p.no })))
    }

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
  }, [marketId])

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
