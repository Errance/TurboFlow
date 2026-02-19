import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEventStore } from '../stores/eventStore'
import type { PredictionEvent, Contract, EventStatusInfo } from '../types'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SideDrawer from '../components/ui/SideDrawer'
import TradePanel from '../components/TradePanel'
import DisputePanel from '../components/DisputePanel'
import RefundBanner from '../components/RefundBanner'

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── StatusBanner ────────────────────────────────────────────────

function StatusBanner({ statusInfo, onAction }: { statusInfo: EventStatusInfo; onAction?: (action: string) => void }) {
  const { status, subStatus, reason } = statusInfo
  if (status === 'OPEN' && subStatus === 'normal') return null

  const config: Record<string, { bg: string; border: string; text: string }> = {
    'OPEN-paused':      { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'CLOSED-normal':    { bg: 'bg-[#E85A7E]/10', border: 'border-[#E85A7E]/30', text: 'text-[#E85A7E]' },
    'RESOLVING-normal': { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'RESOLVING-disputed': { bg: 'bg-[#E85A7E]/10', border: 'border-[#E85A7E]/30', text: 'text-[#E85A7E]' },
    'RESOLVING-delayed': { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'SETTLED-normal':   { bg: 'bg-[#2DD4BF]/10', border: 'border-[#2DD4BF]/30', text: 'text-[#2DD4BF]' },
    'SETTLED-disputed': { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'CANCELLED-normal': { bg: 'bg-[#252536]', border: 'border-[#252536]', text: 'text-[#8A8A9A]' },
    'VOIDED-normal':    { bg: 'bg-[#252536]', border: 'border-[#252536]', text: 'text-[#8A8A9A]' },
  }

  const key = `${status}-${subStatus}`
  const style = config[key] ?? config['CLOSED-normal']

  const titleMap: Record<string, string> = {
    'OPEN-paused': 'Trading Paused',
    'CLOSED-normal': 'Market Closed — Awaiting Settlement',
    'RESOLVING-normal': 'Resolving',
    'RESOLVING-disputed': 'Settlement Disputed',
    'RESOLVING-delayed': 'Settlement Delayed',
    'SETTLED-normal': 'Settled',
    'SETTLED-disputed': 'Post-Settlement Dispute',
    'CANCELLED-normal': 'Market Cancelled',
    'VOIDED-normal': 'Market Voided — Full Refund',
  }

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl p-4 mb-4`}>
      <p className={`${style.text} text-sm font-medium mb-1`}>{titleMap[key] ?? status}</p>
      {reason && <p className="text-xs text-[#8A8A9A]">{reason}</p>}
      {statusInfo.actionAvailable && statusInfo.actionAvailable.length > 0 && (
        <div className="flex gap-2 mt-2">
          {statusInfo.actionAvailable.map((action) => (
            <Button key={action} variant="ghost" size="sm" onClick={() => onAction?.(action)}>
              {actionLabel(action)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    appeal: 'Submit Appeal',
    view_dispute: 'View Dispute',
    request_settle: 'Request Settlement',
    report_issue: 'Report Issue',
    view_refund: 'View Refund',
    view_evidence: 'View Evidence',
  }
  return map[action] ?? action
}

// ── RulesSummaryCard ────────────────────────────────────────────

function RulesSummaryCard({ event }: { event: PredictionEvent }) {
  return (
    <div className="bg-[#161622] border border-[#252536] rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-white mb-3">Rules Summary</h3>
      <div className="space-y-2">
        <div className="flex gap-2">
          <span className="text-xs text-[#8A8A9A] shrink-0 w-24">Measurement</span>
          <span className="text-xs text-white">{event.rulesMeasurement}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-[#8A8A9A] shrink-0 w-24">Closing</span>
          <span className="text-xs text-white">{event.rulesClosing}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-[#8A8A9A] shrink-0 w-24">Source</span>
          <span className="text-xs text-white">{event.resolutionSource}</span>
        </div>
      </div>
      {event.rulesDetail && (
        <button className="text-xs text-[#2DD4BF] mt-3 hover:underline">
          View Full Rules →
        </button>
      )}
    </div>
  )
}

// ── TimelinePayoutCard ──────────────────────────────────────────

function TimelinePayoutCard({ event }: { event: PredictionEvent }) {
  const { timeline } = event
  const stages = [
    { label: 'Opened', date: timeline.openDate, done: true },
    { label: 'Closes', date: timeline.closeDate, done: ['CLOSED', 'RESOLVING', 'SETTLED', 'CANCELLED', 'VOIDED'].includes(event.status) },
    { label: 'Settled', date: timeline.settledDate ?? null, done: event.status === 'SETTLED' },
  ]

  return (
    <div className="bg-[#161622] border border-[#252536] rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-white mb-3">Timeline & Payout</h3>

      {/* Timeline */}
      <div className="flex items-center gap-0 mb-4">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${stage.done ? 'bg-[#2DD4BF]' : 'bg-[#252536] border border-[#8A8A9A]'}`} />
              <span className="text-[10px] text-[#8A8A9A] mt-1">{stage.label}</span>
              {stage.date && (
                <span className="text-[10px] text-white font-mono">{formatDate(stage.date)}</span>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${stage.done ? 'bg-[#2DD4BF]' : 'bg-[#252536]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Settlement window */}
      {timeline.expectedSettleWindow && (
        <p className="text-xs text-[#8A8A9A] mb-3">
          Expected settlement: {timeline.expectedSettleWindow}
        </p>
      )}

      {/* Payout explanation */}
      <div className="bg-[#0B0B0F] rounded-lg p-3">
        <div className="flex justify-between text-xs">
          <span className="text-[#8A8A9A]">If you win</span>
          <span className="text-[#2DD4BF] font-medium">1 USDC per share</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-[#8A8A9A]">If you lose</span>
          <span className="text-[#E85A7E] font-medium">0 USDC per share</span>
        </div>
      </div>
    </div>
  )
}

// ── OutcomeModelHint ────────────────────────────────────────────

function OutcomeModelHint({ event }: { event: PredictionEvent }) {
  if (event.outcomeModel !== 'mutually-exclusive') return null
  return (
    <div className="bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2 mb-4">
      <p className="text-xs text-[#8A8A9A]">
        <span className="text-[#F59E0B] font-medium">Mutually exclusive: </span>
        These contracts represent competing outcomes — exactly one will resolve YES.
        Probabilities may not sum to exactly 100% due to bid-ask spreads.
      </p>
    </div>
  )
}

// ── ContractTable ───────────────────────────────────────────────

function ContractTableRow({
  contract,
  isSelected,
  onSelect,
  disabled,
}: {
  contract: Contract
  isSelected: boolean
  onSelect: (contractId: string, side: 'YES' | 'NO') => void
  disabled: boolean
}) {
  const navigate = useNavigate()
  const noProb = Math.round((1 - contract.yesPrice) * 100)

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[48px] transition-colors ${
        isSelected ? 'bg-[#2DD4BF]/5 border border-[#2DD4BF]/20' : 'hover:bg-[#252536]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{contract.label}</p>
        {contract.settlementResult && (
          <Badge variant={contract.settlementResult === 'YES' ? 'success' : 'danger'} className="mt-0.5">
            {contract.settlementResult}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-[#8A8A9A] font-mono tabular-nums shrink-0">
        <span className={contract.change24h > 0 ? 'text-[#2DD4BF]' : contract.change24h < 0 ? 'text-[#E85A7E]' : ''}>
          {contract.change24h > 0 ? '+' : ''}{contract.change24h.toFixed(1)}%
        </span>
        <span className="hidden md:inline">{formatVolume(contract.volume)}</span>
      </div>

      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => !disabled && onSelect(contract.id, 'YES')}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] min-w-[56px] transition-colors ${
            disabled
              ? 'bg-[#252536] text-[#8A8A9A] cursor-not-allowed'
              : 'bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20'
          }`}
        >
          Yes {contract.probability}%
        </button>
        <button
          onClick={() => !disabled && onSelect(contract.id, 'NO')}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] min-w-[56px] transition-colors ${
            disabled
              ? 'bg-[#252536] text-[#8A8A9A] cursor-not-allowed'
              : 'bg-[#E85A7E]/10 text-[#E85A7E] hover:bg-[#E85A7E]/20'
          }`}
        >
          No {noProb}%
        </button>
        {/* CLOB icon for discoverability */}
        <button
          onClick={() => navigate(`/contract/${contract.id}`)}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8A8A9A] hover:text-[#2DD4BF] rounded-lg hover:bg-[#252536] transition-colors"
          title="Advanced Trading (CLOB)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="5" width="5" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── SpreadTooltip ───────────────────────────────────────────────

function SpreadNote({ event }: { event: PredictionEvent }) {
  if (event.contracts.length < 2) return null
  const totalYes = event.contracts.reduce((sum, c) => sum + c.probability, 0)
  return (
    <p className="text-[10px] text-[#8A8A9A] px-3 mt-1">
      Sum of Yes probabilities: {totalYes}%
      {totalYes !== 100 && ' — difference reflects bid-ask spread'}
    </p>
  )
}

// ── Main Page ───────────────────────────────────────────────────

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const getEvent = useEventStore((s) => s.getEvent)
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const selectedContractId = useEventStore((s) => s.selectedContractId)
  const tradePanelOpen = useEventStore((s) => s.tradePanelOpen)
  const closeTradePanel = useEventStore((s) => s.closeTradePanel)

  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)

  const event = getEvent(eventId ?? '')

  if (!event) {
    return (
      <div className="px-4 md:px-6 py-12 text-center">
        <p className="text-[#8A8A9A]">Event not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          Back to Explore
        </Button>
      </div>
    )
  }

  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'
  const hasDispute = event.statusInfo.subStatus === 'disputed'
  const isRefundable = event.status === 'CANCELLED' || event.status === 'VOIDED'

  const handleSelectContract = (contractId: string, side: 'YES' | 'NO') => {
    openTradePanel(contractId, side)
  }

  const handleStatusAction = (action: string) => {
    if (action === 'view_dispute' || action === 'view_evidence') {
      setDisputeDrawerOpen(true)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row">
        {/* Left main area */}
        <div className="flex-1 px-4 md:px-6 py-6 md:pr-0">
          {/* Back + title */}
          <div className="flex items-start gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8A8A9A] hover:text-white rounded-lg hover:bg-[#252536] transition-colors shrink-0 -ml-2"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{event.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={event.status === 'OPEN' ? 'success' : event.status === 'CANCELLED' ? 'danger' : 'neutral'}>
                  {event.statusInfo.subStatus === 'paused' ? 'Paused' : event.status}
                </Badge>
                <span className="text-xs text-[#8A8A9A]">{event.category}</span>
                <span className="text-xs text-[#8A8A9A] font-mono">{formatVolume(event.totalVolume)} vol</span>
              </div>
            </div>
          </div>

          {/* Status banner */}
          <StatusBanner statusInfo={event.statusInfo} onAction={handleStatusAction} />

          {/* Refund banner for cancelled/voided */}
          {isRefundable && (
            <RefundBanner statusInfo={event.statusInfo} totalVolume={event.totalVolume} />
          )}

          {/* Rules summary */}
          <RulesSummaryCard event={event} />

          {/* Timeline & Payout */}
          <TimelinePayoutCard event={event} />

          {/* Outcome model hint */}
          <OutcomeModelHint event={event} />

          {/* Contract table */}
          <div className="bg-[#161622] border border-[#252536] rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-semibold text-white">Contracts</h3>
              <span className="text-xs text-[#8A8A9A]">{event.contracts.length} total</span>
            </div>
            <div className="space-y-1">
              {event.contracts.map((contract) => (
                <ContractTableRow
                  key={contract.id}
                  contract={contract}
                  isSelected={selectedContractId === contract.id}
                  onSelect={handleSelectContract}
                  disabled={isDisabled}
                />
              ))}
            </div>
            <SpreadNote event={event} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-6">
            <Button variant="ghost" size="sm">Request Settlement</Button>
            <Button variant="ghost" size="sm">Report Issue</Button>
            {hasDispute && (
              <Button variant="secondary" size="sm" onClick={() => setDisputeDrawerOpen(true)}>
                View Dispute Details
              </Button>
            )}
          </div>
        </div>

        {/* Right trade panel — desktop only */}
        <div className="hidden md:block w-[340px] shrink-0 sticky top-14 self-start py-6 px-4">
          <TradePanel event={event} />
        </div>
      </div>

      {/* Mobile trade panel — BottomSheet */}
      {tradePanelOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/60" onClick={closeTradePanel} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#161622] rounded-t-xl border-t border-[#252536] max-h-[85vh] overflow-y-auto animate-[slide-in-from-bottom_0.25s_ease-out]">
            <div className="w-10 h-1 bg-[#252536] rounded-full mx-auto mt-2 mb-3" />
            <div className="px-4 pb-6">
              <TradePanel event={event} />
            </div>
          </div>
        </div>
      )}

      {/* Dispute Detail Drawer */}
      <SideDrawer
        isOpen={disputeDrawerOpen}
        onClose={() => setDisputeDrawerOpen(false)}
        title="Dispute Details"
      >
        <DisputePanel statusInfo={event.statusInfo} onClose={() => setDisputeDrawerOpen(false)} />
      </SideDrawer>
    </div>
  )
}
