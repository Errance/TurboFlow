import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PredictionEvent } from '../types'
import { useEventStore } from '../stores/eventStore'

interface Props {
  event: PredictionEvent
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export default function InstantMarketCard({ event }: Props) {
  const navigate = useNavigate()
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const meta = event.instant
  const contract = event.contracts[0]

  const calcRemaining = useCallback(() => {
    if (!meta) return 0
    return Math.max(0, Math.floor((new Date(meta.endsAt).getTime() - Date.now()) / 1000))
  }, [meta])

  const [remaining, setRemaining] = useState(calcRemaining)

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(calcRemaining())
    }, 1000)
    return () => clearInterval(timer)
  }, [calcRemaining])

  if (!meta || !contract) return null

  const isExpired = remaining <= 0
  const isUrgent = remaining <= 60 && remaining > 0
  const pctElapsed = Math.min(100, ((meta.durationSeconds - remaining) / meta.durationSeconds) * 100)

  const handleTrade = (side: 'YES' | 'NO') => {
    openTradePanel(contract.id, side)
  }

  const handleCardClick = () => {
    navigate(`/event/${event.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="glow-card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden min-w-[260px] flex-shrink-0 snap-start cursor-pointer hover:border-[#2DD4BF]/30 transition-colors"
    >
      {/* Progress bar */}
      <div className="h-1 bg-[var(--bg-base)] relative">
        <div
          className={`h-full transition-all duration-1000 ${isUrgent ? 'bg-[#E85A7E]' : 'bg-[#2DD4BF]'}`}
          style={{ width: `${pctElapsed}%` }}
        />
      </div>

      <div className="p-4">
        {/* Header: LIVE tag + countdown */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#E85A7E]/20 text-[#E85A7E] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E85A7E] animate-pulse" />
              Live
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">5 min</span>
          </div>
          <span className={`font-mono text-sm font-bold tabular-nums ${isUrgent ? 'text-[#E85A7E]' : isExpired ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
            {isExpired ? 'Closed' : formatCountdown(remaining)}
          </span>
        </div>

        {/* Asset + price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[#2DD4BF]">
            {meta.assetIcon || meta.asset[0]}
          </span>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">{meta.asset} Current</p>
            <p className="text-lg font-bold text-[var(--text-primary)] font-mono tabular-nums">
              ${formatPrice(meta.currentPrice)}
            </p>
          </div>
        </div>

        {/* Strike line */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            meta.direction === 'UP'
              ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
              : 'bg-[#E85A7E]/10 text-[#E85A7E]'
          }`}>
            {meta.direction === 'UP' ? '↑' : '↓'} Strike ${formatPrice(meta.strikePrice)}
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            {meta.direction === 'UP' ? 'Above' : 'Below'} to win
          </span>
        </div>

        {/* Probability bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#2DD4BF]">Yes {contract.probability}%</span>
            <span className="text-[#E85A7E]">No {100 - contract.probability}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#E85A7E]/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2DD4BF]"
              style={{ width: `${contract.probability}%` }}
            />
          </div>
        </div>

        {/* Volume + Share */}
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-3">
          <span>Volume</span>
          <span className="font-mono">${event.totalVolume.toLocaleString()} USDC</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleTrade('YES') }}
            disabled={isExpired}
            className="flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors bg-[#2DD4BF]/15 text-[#2DD4BF] hover:bg-[#2DD4BF]/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Yes {contract.yesPrice.toFixed(2)}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleTrade('NO') }}
            disabled={isExpired}
            className="flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors bg-[#E85A7E]/15 text-[#E85A7E] hover:bg-[#E85A7E]/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            No {contract.noPrice.toFixed(2)}
          </button>
        </div>

      </div>
    </div>
  )
}
