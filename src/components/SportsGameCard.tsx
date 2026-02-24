import { useNavigate } from 'react-router-dom'
import { useEventStore } from '../stores/eventStore'
import type { PredictionEvent, Contract } from '../types'
import Badge from './ui/Badge'

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function formatGameTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getContractsByType(contracts: Contract[]) {
  const moneyline = contracts.filter((c) => c.type === 'moneyline')
  const spread = contracts.filter((c) => c.type === 'spread')
  const total = contracts.filter((c) => c.type === 'total')
  return { moneyline, spread, total }
}

function PriceButton({
  probability,
  variant,
  onClick,
  disabled,
}: {
  probability: number
  variant: 'yes' | 'no'
  onClick: () => void
  disabled?: boolean
}) {
  const base =
    variant === 'yes'
      ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20'
      : 'bg-[#E85A7E]/10 text-[#E85A7E] hover:bg-[#E85A7E]/20'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick() }}
      disabled={disabled}
      className={`${disabled ? 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed' : base} px-2 py-1.5 rounded-lg text-xs font-medium font-mono tabular-nums transition-colors min-h-[36px] min-w-[48px]`}
    >
      {probability}%
    </button>
  )
}

function BettingLine({
  label,
  contracts,
  onTrade,
  disabled,
}: {
  label: string
  contracts: Contract[]
  onTrade: (contractId: string, side: 'YES' | 'NO') => void
  disabled?: boolean
}) {
  if (contracts.length === 0) return null
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] text-[var(--text-secondary)] w-16 shrink-0 uppercase tracking-wider">{label}</span>
      <div className="flex gap-1.5 flex-1 justify-end">
        {contracts.map((c) => (
          <div key={c.id} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-[var(--text-secondary)] truncate max-w-[60px]">{c.label.split(' ').slice(-1)[0]}</span>
            <PriceButton
              probability={c.probability}
              variant="yes"
              onClick={() => onTrade(c.id, 'YES')}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SportsGameCard({ event }: { event: PredictionEvent }) {
  const navigate = useNavigate()
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const { sports } = event
  if (!sports) return null

  const { moneyline, spread, total } = getContractsByType(event.contracts)
  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'
  const isCancelled = event.status === 'CANCELLED'

  const handleTrade = (contractId: string, side: 'YES' | 'NO') => {
    openTradePanel(contractId, side)
  }

  return (
    <div
      className={`p-4 cursor-pointer ${
        isCancelled ? 'bg-[var(--bg-card)] border border-[var(--border)] rounded-xl opacity-60' : 'glow-card'
      }`}
      onClick={() => navigate(`/game/${event.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {sports.status === 'live' && <Badge variant="danger">LIVE</Badge>}
          {isCancelled && <Badge variant="neutral">Cancelled</Badge>}
          <span className="text-xs text-[var(--text-secondary)]">
            {sports.status === 'scheduled' ? formatGameTime(sports.gameTime) : sports.league}
          </span>
        </div>
        <span className="text-xs text-[var(--text-secondary)] font-mono">{formatVolume(event.totalVolume)}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 min-w-0">
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{sports.awayTeam.name}</span>
            {sports.awayTeam.record && (
              <span className="text-[10px] text-[var(--text-secondary)] shrink-0">({sports.awayTeam.record})</span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{sports.homeTeam.name}</span>
            {sports.homeTeam.record && (
              <span className="text-[10px] text-[var(--text-secondary)] shrink-0">({sports.homeTeam.record})</span>
            )}
          </div>
        </div>
        {sports.score && (
          <div className="text-right">
            <div className="text-sm font-mono font-medium text-[var(--text-primary)] mb-1.5">{sports.score.away ?? '-'}</div>
            <div className="text-sm font-mono font-medium text-[var(--text-primary)]">{sports.score.home ?? '-'}</div>
          </div>
        )}
      </div>

      {!isCancelled && (
        <div className="border-t border-[var(--border)] pt-2 space-y-0.5">
          <BettingLine label="ML" contracts={moneyline} onTrade={handleTrade} disabled={isDisabled} />
          <BettingLine label="Spread" contracts={spread} onTrade={handleTrade} disabled={isDisabled} />
          <BettingLine label="Total" contracts={total} onTrade={handleTrade} disabled={isDisabled} />
        </div>
      )}

      {isCancelled && event.statusInfo.reason && (
        <div className="border-t border-[var(--border)] pt-2">
          <p className="text-xs text-[var(--text-secondary)]">{event.statusInfo.reason}</p>
        </div>
      )}

      <div className="flex justify-end mt-2">
        <span className="text-[10px] text-[#2DD4BF]">Game View →</span>
      </div>
    </div>
  )
}
