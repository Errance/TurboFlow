import { useParams, useNavigate } from 'react-router-dom'
import { useEventStore } from '../stores/eventStore'
import { useParlayStore } from '../stores/parlayStore'
import type { Contract, PredictionEvent } from '../types'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TradePanel from '../components/TradePanel'
import ParlayAddPopover from '../components/ParlayAddPopover'

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function BettingLineRow({
  label,
  contracts,
  event,
  onSelect,
  selectedContractId,
  disabled,
}: {
  label: string
  contracts: Contract[]
  event: PredictionEvent
  onSelect: (contractId: string, side: 'YES' | 'NO') => void
  selectedContractId: string | null
  disabled: boolean
}) {
  const addLeg = useParlayStore((s) => s.addLeg)
  const hasLeg = useParlayStore((s) => s.hasLeg)

  if (contracts.length === 0) return null

  const handleAddParlay = (c: Contract, side: 'YES' | 'NO') => {
    addLeg({
      contractId: c.id,
      eventId: event.id,
      side,
      price: side === 'YES' ? c.yesPrice : c.noPrice,
      eventTitle: event.title,
      contractLabel: c.label,
    })
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{label}</h3>
      <div className="space-y-2">
        {contracts.map((c) => {
          const noProb = Math.round((1 - c.yesPrice) * 100)
          const isSelected = selectedContractId === c.id
          const inParlay = hasLeg(c.id)
          return (
            <div
              key={c.id}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg min-h-[48px] transition-colors ${
                inParlay ? 'border-l-2 border-l-[#2DD4BF]' : ''
              } ${isSelected ? 'bg-[#2DD4BF]/5 border border-[#2DD4BF]/20' : 'hover:bg-[var(--border)]'}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)]">{c.label}</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-mono">{formatVolume(c.volume)} vol</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => !disabled && onSelect(c.id, 'YES')}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] min-w-[56px] transition-colors ${
                    disabled
                      ? 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
                      : 'bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20'
                  }`}
                >
                  Yes {c.probability}%
                </button>
                <button
                  onClick={() => !disabled && onSelect(c.id, 'NO')}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] min-w-[56px] transition-colors ${
                    disabled
                      ? 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
                      : 'bg-[#E85A7E]/10 text-[#E85A7E] hover:bg-[#E85A7E]/20'
                  }`}
                >
                  No {noProb}%
                </button>
                {!disabled && (
                  <ParlayAddPopover
                    yesPrice={c.yesPrice}
                    noPrice={c.noPrice}
                    probability={c.probability}
                    inParlay={inParlay}
                    onAdd={(side) => handleAddParlay(c, side)}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SportsGamePage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const getEvent = useEventStore((s) => s.getEvent)
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const selectedContractId = useEventStore((s) => s.selectedContractId)
  const tradePanelOpen = useEventStore((s) => s.tradePanelOpen)
  const closeTradePanel = useEventStore((s) => s.closeTradePanel)

  const event = getEvent(eventId ?? '')

  if (!event || !event.sports) {
    return (
      <div className="px-4 md:px-6 py-12 text-center">
        <p className="text-[var(--text-secondary)]">Game not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          Back to Sports
        </Button>
      </div>
    )
  }

  const { sports } = event
  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'
  const isCancelled = event.status === 'CANCELLED'

  const moneyline = event.contracts.filter((c) => c.type === 'moneyline')
  const spread = event.contracts.filter((c) => c.type === 'spread')
  const total = event.contracts.filter((c) => c.type === 'total')
  const other = event.contracts.filter((c) => !c.type || !['moneyline', 'spread', 'total'].includes(c.type))

  const handleSelect = (contractId: string, side: 'YES' | 'NO') => {
    openTradePanel(contractId, side)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      {/* Full-width back button */}
      <button
        onClick={() => navigate('/?category=Sports')}
        className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-4 min-h-[44px] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Sports
      </button>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left main area */}
        <div className="flex-1">
          {/* Game header */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant={sports.status === 'live' ? 'danger' : sports.status === 'final' ? 'neutral' : 'success'}>
                {sports.status === 'live' ? 'LIVE' : sports.status === 'final' ? 'FINAL' : 'Upcoming'}
              </Badge>
              <span className="text-xs text-[var(--text-secondary)]">{sports.league}</span>
              {isCancelled && <Badge variant="danger">Cancelled</Badge>}
            </div>

            {/* Teams matchup */}
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                    {sports.awayTeam.abbreviation}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[var(--text-primary)] truncate">{sports.awayTeam.name}</p>
                    {sports.awayTeam.record && (
                      <p className="text-xs text-[var(--text-secondary)]">{sports.awayTeam.record}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)] shrink-0">
                    {sports.homeTeam.abbreviation}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[var(--text-primary)] truncate">{sports.homeTeam.name}</p>
                    {sports.homeTeam.record && (
                      <p className="text-xs text-[var(--text-secondary)]">{sports.homeTeam.record}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Score */}
              {sports.score && (
                <div className="text-right space-y-3">
                  <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">{sports.score.away}</p>
                  <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">{sports.score.home}</p>
                </div>
              )}
            </div>

            {/* Volume */}
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="font-mono">{formatVolume(event.totalVolume)} vol</span>
              <span>{event.contracts.length} contracts</span>
            </div>
          </div>

          {/* Status banner for cancelled/paused */}
          {isCancelled && (
            <div className="bg-[var(--border)] border border-[var(--border)] rounded-xl p-4 mb-4">
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">Game Cancelled</p>
              <p className="text-xs text-[var(--text-secondary)]">{event.statusInfo.reason}</p>
              {event.statusInfo.actionAvailable?.includes('view_refund') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  View Refund
                </Button>
              )}
            </div>
          )}

          {event.statusInfo.subStatus === 'paused' && (
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-[#F59E0B] font-medium mb-1">Trading Paused</p>
              <p className="text-xs text-[var(--text-secondary)]">{event.statusInfo.reason}</p>
            </div>
          )}

          {/* Betting lines */}
          <div className="space-y-3">
            <BettingLineRow label="Moneyline" contracts={moneyline} event={event} onSelect={handleSelect} selectedContractId={selectedContractId} disabled={isDisabled} />
            <BettingLineRow label="Spread" contracts={spread} event={event} onSelect={handleSelect} selectedContractId={selectedContractId} disabled={isDisabled} />
            <BettingLineRow label="Total" contracts={total} event={event} onSelect={handleSelect} selectedContractId={selectedContractId} disabled={isDisabled} />
            {other.length > 0 && (
              <BettingLineRow label="Other Props" contracts={other} event={event} onSelect={handleSelect} selectedContractId={selectedContractId} disabled={isDisabled} />
            )}
          </div>

          {/* Rules (collapsed) */}
          <details className="mt-4">
            <summary className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors py-2">
              Rules & Settlement
            </summary>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mt-1 space-y-2">
              <div className="flex gap-2">
                <span className="text-xs text-[var(--text-secondary)] shrink-0 w-20">Measurement</span>
                <span className="text-xs text-[var(--text-primary)]">{event.rulesMeasurement}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-[var(--text-secondary)] shrink-0 w-20">Closing</span>
                <span className="text-xs text-[var(--text-primary)]">{event.rulesClosing}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-[var(--text-secondary)] shrink-0 w-20">Source</span>
                <span className="text-xs text-[var(--text-primary)]">{event.resolutionSource}</span>
              </div>
              {event.rulesDetail && (
                <p className="text-xs text-[var(--text-secondary)] mt-2 whitespace-pre-line">{event.rulesDetail}</p>
              )}
            </div>
          </details>
        </div>

        {/* Right trade panel — desktop */}
        <div className="hidden md:block w-[340px] shrink-0 sticky top-20 self-start">
          <TradePanel event={event} />
        </div>
      </div>

      {/* Mobile trade panel — BottomSheet */}
      {tradePanelOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-[var(--overlay-bg)]" onClick={closeTradePanel} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] rounded-t-xl border-t border-[var(--border)] max-h-[85vh] overflow-y-auto animate-[slide-in-from-bottom_0.25s_ease-out]">
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mt-2 mb-3" />
            <div className="px-4 pb-6">
              <TradePanel event={event} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
