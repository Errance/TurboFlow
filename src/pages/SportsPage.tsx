import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventStore } from '../stores/eventStore'
import type { PredictionEvent, Contract } from '../types'
import Badge from '../components/ui/Badge'

type SportsTab = 'upcoming' | 'live' | 'results'

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

function formatDateGroup(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  })
}

function getContractsByType(contracts: Contract[]) {
  const moneyline = contracts.filter((c) => c.type === 'moneyline')
  const spread = contracts.filter((c) => c.type === 'spread')
  const total = contracts.filter((c) => c.type === 'total')
  return { moneyline, spread, total }
}

function PriceButton({
  label,
  probability,
  variant,
  onClick,
  disabled,
}: {
  label: string
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
      className={`${disabled ? 'bg-[#252536] text-[#8A8A9A] cursor-not-allowed' : base} px-2 py-1.5 rounded-lg text-xs font-medium font-mono tabular-nums transition-colors min-h-[36px] min-w-[48px]`}
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
      <span className="text-[10px] text-[#8A8A9A] w-16 shrink-0 uppercase tracking-wider">{label}</span>
      <div className="flex gap-1.5 flex-1 justify-end">
        {contracts.map((c) => (
          <div key={c.id} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-[#8A8A9A] truncate max-w-[60px]">{c.label.split(' ').slice(-1)[0]}</span>
            <PriceButton
              label={c.label}
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

function SportsGameCard({ event }: { event: PredictionEvent }) {
  const navigate = useNavigate()
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const { sports } = event
  if (!sports) return null

  const { moneyline, spread, total } = getContractsByType(event.contracts)
  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'
  const isCancelled = event.status === 'CANCELLED'

  const handleTrade = (contractId: string, side: 'YES' | 'NO') => {
    openTradePanel(contractId, side)
    navigate(`/sports/${event.id}`)
  }

  return (
    <div
      className={`bg-[#161622] border rounded-xl p-4 transition-colors cursor-pointer ${
        isCancelled ? 'border-[#252536] opacity-60' : 'border-[#252536] hover:border-[#2DD4BF]/20'
      }`}
      onClick={() => navigate(`/sports/${event.id}`)}
    >
      {/* Header: time + volume + league */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {sports.status === 'live' && (
            <Badge variant="danger">LIVE</Badge>
          )}
          {isCancelled && (
            <Badge variant="neutral">Cancelled</Badge>
          )}
          <span className="text-xs text-[#8A8A9A]">
            {sports.status === 'scheduled' ? formatGameTime(sports.gameTime) : sports.league}
          </span>
        </div>
        <span className="text-xs text-[#8A8A9A] font-mono">{formatVolume(event.totalVolume)}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-medium text-white">{sports.awayTeam.name}</span>
            {sports.awayTeam.record && (
              <span className="text-[10px] text-[#8A8A9A]">({sports.awayTeam.record})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{sports.homeTeam.name}</span>
            {sports.homeTeam.record && (
              <span className="text-[10px] text-[#8A8A9A]">({sports.homeTeam.record})</span>
            )}
          </div>
        </div>
        {sports.score && (
          <div className="text-right">
            <div className="text-sm font-mono font-medium text-white mb-1.5">{sports.score.away ?? '-'}</div>
            <div className="text-sm font-mono font-medium text-white">{sports.score.home ?? '-'}</div>
          </div>
        )}
      </div>

      {/* Betting lines */}
      {!isCancelled && (
        <div className="border-t border-[#252536] pt-2 space-y-0.5">
          <BettingLine label="ML" contracts={moneyline} onTrade={handleTrade} disabled={isDisabled} />
          <BettingLine label="Spread" contracts={spread} onTrade={handleTrade} disabled={isDisabled} />
          <BettingLine label="Total" contracts={total} onTrade={handleTrade} disabled={isDisabled} />
        </div>
      )}

      {/* Cancelled reason */}
      {isCancelled && event.statusInfo.reason && (
        <div className="border-t border-[#252536] pt-2">
          <p className="text-xs text-[#8A8A9A]">{event.statusInfo.reason}</p>
        </div>
      )}

      {/* Game view CTA */}
      <div className="flex justify-end mt-2">
        <span className="text-[10px] text-[#2DD4BF]">Game View →</span>
      </div>
    </div>
  )
}

export default function SportsPage() {
  const navigate = useNavigate()
  const allEvents = useEventStore((s) => s.events)
  const sportsEvents = useMemo(() => allEvents.filter((e) => e.category === 'Sports'), [allEvents])

  const [activeTab, setActiveTab] = useState<SportsTab>('upcoming')
  const [sportFilter, setSportFilter] = useState<string>('All')

  const sports = useMemo(() => {
    const set = new Set<string>()
    sportsEvents.forEach((e) => {
      if (e.sports) set.add(e.sports.sport)
    })
    return ['All', ...Array.from(set)]
  }, [sportsEvents])

  const filteredEvents = useMemo(() => {
    let filtered = sportsEvents

    if (activeTab === 'live') {
      filtered = filtered.filter((e) => e.sports?.status === 'live')
    } else if (activeTab === 'results') {
      filtered = filtered.filter(
        (e) => e.status === 'SETTLED' || e.status === 'CANCELLED' || e.sports?.status === 'final',
      )
    } else {
      filtered = filtered.filter(
        (e) => e.sports?.status === 'scheduled' && e.status === 'OPEN',
      )
    }

    if (sportFilter !== 'All') {
      filtered = filtered.filter((e) => e.sports?.sport === sportFilter)
    }

    return filtered
  }, [sportsEvents, activeTab, sportFilter])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, PredictionEvent[]> = {}
    for (const event of filteredEvents) {
      const dateKey = event.sports
        ? formatDateGroup(event.sports.gameTime)
        : 'Unknown'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(event)
    }
    return Object.entries(groups)
  }, [filteredEvents])

  const tabs: { id: SportsTab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'live', label: 'Live' },
    { id: 'results', label: 'Results' },
  ]

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/')}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8A8A9A] hover:text-white rounded-lg hover:bg-[#252536] transition-colors -ml-2"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Sports</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
              activeTab === tab.id
                ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sport category filter */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {sports.map((sport) => (
          <button
            key={sport}
            onClick={() => setSportFilter(sport)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              sportFilter === sport
                ? 'bg-[#252536] text-white'
                : 'text-[#8A8A9A] hover:text-white border border-[#252536]'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Game list grouped by date */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#8A8A9A] text-sm">No {activeTab} games found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(([date, events]) => (
            <div key={date}>
              <h2 className="text-xs text-[#8A8A9A] font-medium uppercase tracking-wider mb-3 px-1">
                {date}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {events.map((event) => (
                  <SportsGameCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
