import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventStore, CATEGORIES, type EventCategory } from '../stores/eventStore'
import type { PredictionEvent, Contract } from '../types'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const ALL_CATEGORIES: EventCategory[] = [...CATEGORIES, 'Sports']

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function statusBadgeVariant(status: PredictionEvent['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    OPEN: 'success',
    CLOSED: 'warning',
    RESOLVING: 'warning',
    SETTLED: 'neutral',
    CANCELLED: 'danger',
    VOIDED: 'neutral',
  }
  return map[status] ?? 'neutral'
}

function ProbabilityButton({
  label,
  probability,
  side,
  variant,
  onClick,
}: {
  label: string
  probability: number
  side: 'YES' | 'NO'
  variant: 'yes' | 'no'
  onClick: (e: React.MouseEvent) => void
}) {
  const base =
    variant === 'yes'
      ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20'
      : 'bg-[#E85A7E]/10 text-[#E85A7E] hover:bg-[#E85A7E]/20'

  return (
    <button
      onClick={onClick}
      className={`${base} px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 min-h-[36px] min-w-[52px] whitespace-nowrap`}
    >
      {label} {probability}%
    </button>
  )
}

function ContractRow({
  contract,
  onYes,
  onNo,
}: {
  contract: Contract
  onYes: (e: React.MouseEvent) => void
  onNo: (e: React.MouseEvent) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-[#8A8A9A] truncate flex-1">{contract.label}</span>
      <div className="flex gap-1.5">
        <ProbabilityButton
          label="Yes"
          probability={contract.probability}
          side="YES"
          variant="yes"
          onClick={onYes}
        />
        <ProbabilityButton
          label="No"
          probability={Math.round((1 - contract.yesPrice) * 100)}
          side="NO"
          variant="no"
          onClick={onNo}
        />
      </div>
    </div>
  )
}

function EventCard({ event }: { event: PredictionEvent }) {
  const navigate = useNavigate()
  const openTradePanel = useEventStore((s) => s.openTradePanel)

  const displayContracts = event.contracts.slice(0, event.type === 'multi-option' ? 3 : 2)
  const hasMore = event.contracts.length > displayContracts.length

  const handleContractTrade = (contractId: string, side: 'YES' | 'NO') => (e: React.MouseEvent) => {
    e.stopPropagation()
    openTradePanel(contractId, side)
  }

  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'

  return (
    <Card hover onClick={() => navigate(`/event/${event.id}`)}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h2 className="text-sm font-medium text-white line-clamp-2 flex-1">{event.title}</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {event.incentive && (
            <Badge variant="info" className="text-[10px]">
              {event.incentive.label}
            </Badge>
          )}
          <Badge variant={statusBadgeVariant(event.status)}>
            {event.statusInfo.subStatus === 'paused' ? 'Paused' : event.status === 'RESOLVING' ? 'Resolving' : event.status === 'SETTLED' ? 'Settled' : event.status === 'CANCELLED' ? 'Cancelled' : 'Open'}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[#8A8A9A]">{event.category}</span>
        {event.outcomeModel === 'mutually-exclusive' && (
          <span className="text-[10px] text-[#8A8A9A] bg-[#252536] px-1.5 py-0.5 rounded">
            Winner Takes All
          </span>
        )}
      </div>

      {/* Contract rows */}
      <div className="space-y-0.5">
        {displayContracts.map((contract) => (
          <ContractRow
            key={contract.id}
            contract={contract}
            onYes={isDisabled ? (e: React.MouseEvent) => e.stopPropagation() : handleContractTrade(contract.id, 'YES')}
            onNo={isDisabled ? (e: React.MouseEvent) => e.stopPropagation() : handleContractTrade(contract.id, 'NO')}
          />
        ))}
      </div>

      {hasMore && (
        <p className="text-[10px] text-[#8A8A9A] mt-1">
          +{event.contracts.length - displayContracts.length} more contracts
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[#252536] text-xs text-[#8A8A9A] font-mono tabular-nums">
        <span>{formatVolume(event.totalVolume)} vol</span>
        <span>{event.contracts.length} contracts</span>
      </div>
    </Card>
  )
}

function FeaturedBanner({ events }: { events: PredictionEvent[] }) {
  const navigate = useNavigate()
  if (events.length === 0) return null
  const event = events[0]

  return (
    <div className="mb-6">
      <div
        className="bg-gradient-to-r from-[#2DD4BF]/10 to-[#161622] border border-[#2DD4BF]/20 rounded-xl p-4 md:p-6 cursor-pointer hover:border-[#2DD4BF]/40 transition-colors"
        onClick={() => navigate(`/event/${event.id}`)}
        role="button"
      >
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="info">Featured</Badge>
          {event.incentive && (
            <Badge variant="warning">{event.incentive.label}</Badge>
          )}
        </div>
        <h2 className="text-lg md:text-xl font-bold text-white mb-1">{event.title}</h2>
        <p className="text-sm text-[#8A8A9A] mb-3 line-clamp-2">{event.description}</p>
        <div className="flex items-center gap-4 text-xs text-[#8A8A9A]">
          <span className="font-mono">{formatVolume(event.totalVolume)} vol</span>
          <span>{event.contracts.length} contracts</span>
        </div>
      </div>
    </div>
  )
}

function SportsOperationalBanner() {
  const navigate = useNavigate()
  const events = useEventStore((s) => s.events)
  const sportsEvents = events.filter((e) => e.category === 'Sports')

  if (sportsEvents.length === 0) return null

  return (
    <div
      className="bg-[#161622] border border-[#252536] rounded-xl p-4 cursor-pointer hover:bg-[#252536] transition-colors mb-6"
      onClick={() => navigate('/sports')}
      role="button"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">Sports</span>
            <Badge variant="success">{sportsEvents.length} live events</Badge>
          </div>
          <p className="text-xs text-[#8A8A9A]">NBA, Tennis, Esports — view all matches</p>
        </div>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#8A8A9A]">
          <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const selectedCategory = useEventStore((s) => s.selectedCategory)
  const setSelectedCategory = useEventStore((s) => s.setSelectedCategory)
  const searchQuery = useEventStore((s) => s.searchQuery)
  const setSearchQuery = useEventStore((s) => s.setSearchQuery)
  const allEvents = useEventStore((s) => s.events)
  const navigate = useNavigate()

  const filteredEvents = useMemo(() => {
    let filtered = allEvents.filter((e) => e.category !== 'Sports')
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((e) => e.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return filtered
  }, [allEvents, selectedCategory, searchQuery])

  const featuredEvents = useMemo(() => allEvents.filter((e) => e.featured), [allEvents])

  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  const handleCategoryChange = (cat: EventCategory) => {
    if (cat === 'Sports') {
      navigate('/sports')
      return
    }
    setSelectedCategory(cat)
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Explore</h1>
        <div className="flex items-center gap-2">
          {searchOpen && (
            <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-1.5 animate-[fadeScaleIn_0.15s_ease-out]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A9A" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none w-40 md:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#8A8A9A] hover:text-white min-w-[24px] min-h-[24px] flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => {
              if (searchOpen) { setSearchOpen(false); setSearchQuery('') }
              else setSearchOpen(true)
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8A8A9A] hover:text-white transition-colors rounded-lg hover:bg-[#252536]"
            aria-label={searchOpen ? 'Close search' : 'Search'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {searchOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap ${
              selectedCategory === cat && cat !== 'Sports'
                ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
            }`}
          >
            {cat}
            {cat === 'Sports' && (
              <span className="ml-1 text-[10px]">→</span>
            )}
          </button>
        ))}
      </div>

      {/* Featured banner */}
      <FeaturedBanner events={featuredEvents} />

      {/* Sports operational banner */}
      <SportsOperationalBanner />

      {/* Event cards grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#8A8A9A] text-sm">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
