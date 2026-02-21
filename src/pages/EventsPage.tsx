import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventStore, CATEGORIES, type EventCategory } from '../stores/eventStore'
import type { PredictionEvent, Contract } from '../types'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import TradePanel from '../components/TradePanel'
import InstantMarketCard from '../components/InstantMarketCard'
import SportsGameCard from '../components/SportsGameCard'
import SportsSidebar, { type SportsTab } from '../components/SportsSidebar'
import { instantEvents } from '../data/events'

// ── Helpers ──────────────────────────────────────────────────────

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusBadgeVariant(status: PredictionEvent['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    OPEN: 'success', CLOSED: 'warning', RESOLVING: 'warning', SETTLED: 'neutral', CANCELLED: 'danger', VOIDED: 'neutral',
  }
  return map[status] ?? 'neutral'
}

// ── Shared sub-components ────────────────────────────────────────

function ProbabilityButton({ label, probability, variant, onClick, tooltip }: {
  label: string; probability: number; variant: 'yes' | 'no'; onClick: (e: React.MouseEvent) => void; tooltip?: string
}) {
  const base = variant === 'yes'
    ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20'
    : 'bg-[#E85A7E]/10 text-[#E85A7E] hover:bg-[#E85A7E]/20'
  return (
    <button onClick={onClick} title={tooltip}
      className={`${base} px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 min-h-[36px] min-w-[52px] whitespace-nowrap`}>
      {label} {probability}%
    </button>
  )
}

function ContractRow({ contract, onYes, onNo, isMutuallyExclusive }: {
  contract: Contract; onYes: (e: React.MouseEvent) => void; onNo: (e: React.MouseEvent) => void; isMutuallyExclusive?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-[#8A8A9A] truncate flex-1">{contract.label}</span>
      <div className="flex gap-1.5">
        <ProbabilityButton label="Yes" probability={contract.probability} variant="yes" onClick={onYes} />
        <ProbabilityButton label="No" probability={Math.round((1 - contract.yesPrice) * 100)} variant="no" onClick={onNo}
          tooltip={isMutuallyExclusive ? `Buy NO: Betting "${contract.label}" will NOT be the final result` : undefined} />
      </div>
    </div>
  )
}

// ── Large EventCard (Kalshi-style) ───────────────────────────────

function EventCard({ event }: { event: PredictionEvent }) {
  const navigate = useNavigate()
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const displayContracts = event.contracts.slice(0, event.type === 'multi-option' ? 4 : 2)
  const hasMore = event.contracts.length > displayContracts.length
  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'

  const handleContractTrade = (contractId: string, side: 'YES' | 'NO') => (e: React.MouseEvent) => {
    e.stopPropagation()
    openTradePanel(contractId, side)
  }

  return (
    <Card hover onClick={() => navigate(`/event/${event.id}`)}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-[#8A8A9A] bg-[#252536] px-1.5 py-0.5 rounded">{event.category}</span>
        {event.incentive && <Badge variant="info" className="text-[10px]">{event.incentive.label}</Badge>}
        {event.outcomeModel === 'mutually-exclusive' && (
          <span className="text-[10px] text-[#8A8A9A] bg-[#252536] px-1.5 py-0.5 rounded">Winner Takes All</span>
        )}
        <div className="ml-auto">
          <Badge variant={statusBadgeVariant(event.status)}>
            {event.statusInfo.subStatus === 'paused' ? 'Paused' : event.status === 'RESOLVING' ? 'Resolving' : event.status === 'SETTLED' ? 'Settled' : event.status === 'CANCELLED' ? 'Cancelled' : 'Open'}
          </Badge>
        </div>
      </div>

      {/* Title + description */}
      <h2 className="text-base font-semibold text-white line-clamp-2 mb-1">{event.title}</h2>
      <p className="text-xs text-[#8A8A9A] line-clamp-2 mb-3">{event.description}</p>

      {/* Contract rows */}
      <div className="space-y-0.5 mb-3">
        {displayContracts.map((contract) => (
          <ContractRow key={contract.id} contract={contract}
            onYes={isDisabled ? (e: React.MouseEvent) => e.stopPropagation() : handleContractTrade(contract.id, 'YES')}
            onNo={isDisabled ? (e: React.MouseEvent) => e.stopPropagation() : handleContractTrade(contract.id, 'NO')}
            isMutuallyExclusive={event.outcomeModel === 'mutually-exclusive'} />
        ))}
      </div>
      {hasMore && <p className="text-[10px] text-[#8A8A9A] mb-2">+{event.contracts.length - displayContracts.length} more contracts</p>}

      {/* Meta footer */}
      <div className="border-t border-[#252536] pt-2 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-[#8A8A9A]">
          <span>Closes {formatShortDate(event.timeline.closeDate)}</span>
          <span className="text-[#252536]">·</span>
          <span className="truncate">Source: {event.resolutionSource}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#8A8A9A] font-mono tabular-nums">
          <span>{formatVolume(event.totalVolume)} vol</span>
          <span>{event.contracts.length} contracts</span>
          <span className="ml-auto text-[10px] font-sans">1 USDC/share</span>
        </div>
      </div>
    </Card>
  )
}

// ── Compact row for sidebar lists ────────────────────────────────

function CompactEventRow({ event, badge }: { event: PredictionEvent; badge?: React.ReactNode }) {
  const navigate = useNavigate()
  const mainContract = event.contracts[0]
  if (!mainContract) return null
  return (
    <div onClick={() => navigate(`/event/${event.id}`)}
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[#1C1C28] cursor-pointer transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white font-medium line-clamp-1 group-hover:text-[#2DD4BF] transition-colors">{event.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#8A8A9A]">{event.category}</span>
          <span className="text-[10px] text-[#8A8A9A] font-mono">{formatVolume(event.totalVolume)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        <span className="text-xs font-medium text-[#2DD4BF] font-mono">{mainContract.probability}%</span>
      </div>
    </div>
  )
}

// ── Landing sections (All tab only) ─────────────────────────────

function FeaturedBanner({ events }: { events: PredictionEvent[] }) {
  const navigate = useNavigate()
  const allEvents = useEventStore((s) => s.events)
  const sportsEvts = allEvents.filter((e) => e.category === 'Sports')
  const liveCount = sportsEvts.filter((e) => e.sports?.status === 'live').length

  type Slide = { type: 'event'; event: PredictionEvent } | { type: 'sports' }
  const slides: Slide[] = [
    ...events.map((e) => ({ type: 'event' as const, event: e })),
    ...(sportsEvts.length > 0 ? [{ type: 'sports' as const }] : []),
  ]

  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (slides.length === 0) return null
  const slide = slides[current]

  return (
    <div className="mb-6 relative">
      {slide.type === 'event' ? (
        <div className="bg-gradient-to-r from-[#2DD4BF]/10 to-[#161622] border border-[#2DD4BF]/20 rounded-xl p-4 md:p-6 cursor-pointer hover:border-[#2DD4BF]/40 transition-colors"
          onClick={() => navigate(`/event/${slide.event.id}`)} role="button">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">Featured</Badge>
            {slide.event.incentive && <Badge variant="warning">{slide.event.incentive.label}</Badge>}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white mb-1">{slide.event.title}</h2>
          <p className="text-sm text-[#8A8A9A] mb-3 line-clamp-2">{slide.event.description}</p>
          <div className="flex items-center gap-4 text-xs text-[#8A8A9A]">
            <span className="font-mono">{formatVolume(slide.event.totalVolume)} vol</span>
            <span>{slide.event.contracts.length} contracts</span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#6366F1]/10 to-[#161622] border border-[#6366F1]/20 rounded-xl p-4 md:p-6 cursor-pointer hover:border-[#6366F1]/40 transition-colors"
          onClick={() => { useEventStore.getState().setSelectedCategory('Sports') }} role="button">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">Sports</Badge>
            {liveCount > 0 && <Badge variant="danger">{liveCount} LIVE</Badge>}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white mb-1">Sports Markets</h2>
          <p className="text-sm text-[#8A8A9A] mb-3">Football, Basketball, Esports, Tennis & more — {sportsEvts.length} events</p>
          <div className="flex items-center gap-4 text-xs text-[#8A8A9A]">
            <span className="font-mono">{formatVolume(sportsEvts.reduce((sum, e) => sum + e.totalVolume, 0))} total vol</span>
            <span>View all matches →</span>
          </div>
        </div>
      )}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-[#2DD4BF]' : 'bg-[#252536]'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function TrendingSidebar({ events }: { events: PredictionEvent[] }) {
  const trending = useMemo(() =>
    [...events].filter((e) => e.status === 'OPEN' && e.type !== 'instant').sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 8),
    [events])
  if (trending.length === 0) return null
  return (
    <div className="bg-[#161622] border border-[#252536] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-white">Trending</span>
        <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
      </div>
      <div className="divide-y divide-[#252536]">
        {trending.map((event, i) => (
          <CompactEventRow key={event.id} event={event} badge={<span className="text-[10px] text-[#8A8A9A] font-mono">#{i + 1}</span>} />
        ))}
      </div>
    </div>
  )
}

function TopMoversSidebar({ events }: { events: PredictionEvent[] }) {
  const navigate = useNavigate()
  const movers = useMemo(() =>
    [...events].filter((e) => e.status === 'OPEN' && e.type !== 'instant')
      .flatMap((e) => e.contracts.map((c) => ({ event: e, contract: c, absChange: Math.abs(c.change24h) })))
      .sort((a, b) => b.absChange - a.absChange).slice(0, 6),
    [events])
  if (movers.length === 0) return null
  return (
    <div className="bg-[#161622] border border-[#252536] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3"><span className="text-sm font-bold text-white">Top Movers (24h)</span></div>
      <div className="space-y-1">
        {movers.map(({ event, contract }) => (
          <div key={contract.id} onClick={() => navigate(`/event/${event.id}`)}
            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1C1C28] cursor-pointer transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium line-clamp-1">{contract.label}</p>
              <p className="text-[10px] text-[#8A8A9A] line-clamp-1">{event.title}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-mono font-medium text-white">{contract.probability}%</p>
              <p className={`text-[10px] font-mono ${contract.change24h >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                {contract.change24h >= 0 ? '+' : ''}{contract.change24h}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Generic category sidebar (tags + status) ─────────────────────

function CategorySidebar({ events, statusFilter, setStatusFilter, tagFilter, setTagFilter }: {
  events: PredictionEvent[]; statusFilter: string; setStatusFilter: (v: string) => void; tagFilter: string; setTagFilter: (v: string) => void
}) {
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((e) => e.tags.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [events])

  const statusOptions = ['All', 'Open', 'Resolving', 'Settled']

  return (
    <nav className="space-y-4">
      <div>
        <p className="text-[10px] text-[#8A8A9A] uppercase tracking-wider mb-2">Status</p>
        <div className="space-y-0.5">
          {statusOptions.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === s ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium' : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {tagCounts.length > 0 && (
        <div>
          <p className="text-[10px] text-[#8A8A9A] uppercase tracking-wider mb-2">Topics</p>
          <div className="space-y-0.5">
            <button onClick={() => setTagFilter('All')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                tagFilter === 'All' ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium' : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
              }`}>
              All topics
            </button>
            {tagCounts.map(([tag, count]) => (
              <button key={tag} onClick={() => setTagFilter(tag)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  tagFilter === tag ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium' : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
                }`}>
                <span className="truncate">{tag}</span>
                <span className="text-[10px] font-mono shrink-0 ml-2">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Live sidebar (asset class + status) ─────────────────────────

const ASSET_CLASS_LABELS: Record<string, string> = {
  All: 'All',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  forex: 'Forex',
}

function LiveSidebar({ allInstantEvents, assetClassFilter, setAssetClassFilter, liveStatusFilter, setLiveStatusFilter }: {
  allInstantEvents: PredictionEvent[]
  assetClassFilter: string; setAssetClassFilter: (v: string) => void
  liveStatusFilter: string; setLiveStatusFilter: (v: string) => void
}) {
  const classCounts = useMemo(() => {
    const c: Record<string, number> = {}
    allInstantEvents.forEach((e) => {
      const cls = e.instant?.assetClass
      if (cls) c[cls] = (c[cls] ?? 0) + 1
    })
    return c
  }, [allInstantEvents])

  const statusCounts = useMemo(() => {
    const c = { Active: 0, Settled: 0 }
    allInstantEvents.forEach((e) => {
      if (e.status === 'OPEN') c.Active++
      else c.Settled++
    })
    return c
  }, [allInstantEvents])

  const assetClasses = useMemo(() => {
    const classes = Object.keys(classCounts).sort()
    return ['All', ...classes]
  }, [classCounts])

  return (
    <nav className="space-y-4">
      <div>
        <p className="text-[10px] text-[#8A8A9A] uppercase tracking-wider mb-2">Asset Class</p>
        <div className="space-y-0.5">
          {assetClasses.map((cls) => (
            <button key={cls} onClick={() => setAssetClassFilter(cls)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                assetClassFilter === cls ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium' : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
              }`}>
              <span>{ASSET_CLASS_LABELS[cls] ?? cls}</span>
              {cls !== 'All' && <span className="text-[10px] font-mono shrink-0 ml-2">{classCounts[cls] ?? 0}</span>}
              {cls === 'All' && <span className="text-[10px] font-mono shrink-0 ml-2">{allInstantEvents.length}</span>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] text-[#8A8A9A] uppercase tracking-wider mb-2">Status</p>
        <div className="space-y-0.5">
          {['All', 'Active', 'Settled'].map((s) => (
            <button key={s} onClick={() => setLiveStatusFilter(s)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                liveStatusFilter === s ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium' : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
              }`}>
              <span>{s}</span>
              {s !== 'All' && <span className="text-[10px] font-mono shrink-0 ml-2">{statusCounts[s as keyof typeof statusCounts] ?? 0}</span>}
              {s === 'All' && <span className="text-[10px] font-mono shrink-0 ml-2">{allInstantEvents.length}</span>}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

// ── Main EventsPage ──────────────────────────────────────────────

export default function EventsPage() {
  const selectedCategory = useEventStore((s) => s.selectedCategory)
  const setSelectedCategory = useEventStore((s) => s.setSelectedCategory)
  const searchQuery = useEventStore((s) => s.searchQuery)
  const setSearchQuery = useEventStore((s) => s.setSearchQuery)
  const allEvents = useEventStore((s) => s.events)
  const tradePanelOpen = useEventStore((s) => s.tradePanelOpen)
  const closeTradePanel = useEventStore((s) => s.closeTradePanel)
  const getSelectedContract = useEventStore((s) => s.getSelectedContract)
  const navigate = useNavigate()

  const isLanding = selectedCategory === 'All'
  const isSports = selectedCategory === 'Sports'
  const isLive = selectedCategory === 'Live'

  // ── Search ──
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus() }, [searchOpen])

  // ── Category sidebar filters ──
  const [statusFilter, setStatusFilter] = useState('All')
  const [tagFilter, setTagFilter] = useState('All')

  // ── Live sidebar filters ──
  const [assetClassFilter, setAssetClassFilter] = useState('All')
  const [liveStatusFilter, setLiveStatusFilter] = useState('All')

  // ── Sports sidebar state ──
  const [sportsTab, setSportsTab] = useState<SportsTab>('upcoming')
  const [sportFilter, setSportFilter] = useState('All')
  const [leagueFilter, setLeagueFilter] = useState('All')
  const [expandedSport, setExpandedSport] = useState<string | null>(null)

  // ── Mobile filter panel ──
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Reset sidebar filters when category changes
  useEffect(() => {
    setStatusFilter('All')
    setTagFilter('All')
    setAssetClassFilter('All')
    setLiveStatusFilter('All')
    setSportFilter('All')
    setLeagueFilter('All')
    setExpandedSport(null)
    setSportsTab('upcoming')
    setMobileFilterOpen(false)
  }, [selectedCategory])

  // ── Derived data for category tabs ──
  // Base events for the category (before status/tag filters) — used by sidebar for stable counts
  const baseCategoryEvents = useMemo(() => {
    let filtered = allEvents.filter((e) => e.type !== 'instant' && e.type !== 'sports')
    if (selectedCategory !== 'All' && selectedCategory !== 'Sports' && selectedCategory !== 'Live') {
      filtered = filtered.filter((e) => e.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((e) =>
        e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q)))
    }
    return filtered
  }, [allEvents, selectedCategory, searchQuery])

  // Fully filtered events (including status/tag) — used by content area
  const categoryEvents = useMemo(() => {
    let filtered = baseCategoryEvents
    if (statusFilter !== 'All') {
      const statusMap: Record<string, string> = { Open: 'OPEN', Resolving: 'RESOLVING', Settled: 'SETTLED' }
      filtered = filtered.filter((e) => e.status === statusMap[statusFilter])
    }
    if (tagFilter !== 'All') {
      filtered = filtered.filter((e) => e.tags.includes(tagFilter))
    }
    return filtered
  }, [baseCategoryEvents, statusFilter, tagFilter])

  // ── Sports data ──
  const sportsEvents = useMemo(() => allEvents.filter((e) => e.category === 'Sports'), [allEvents])

  const sportsTabFiltered = useMemo(() => {
    if (sportsTab === 'live') return sportsEvents.filter((e) => e.sports?.status === 'live')
    if (sportsTab === 'results') return sportsEvents.filter((e) => e.status === 'SETTLED' || e.status === 'CANCELLED' || e.sports?.status === 'final')
    return sportsEvents.filter((e) => e.sports?.status === 'scheduled' && e.status === 'OPEN')
  }, [sportsEvents, sportsTab])

  const sportsFiltered = useMemo(() => {
    let f = sportsTabFiltered
    if (sportFilter !== 'All') f = f.filter((e) => e.sports?.sport === sportFilter)
    if (leagueFilter !== 'All') f = f.filter((e) => e.sports?.league === leagueFilter)
    return f
  }, [sportsTabFiltered, sportFilter, leagueFilter])

  const sportTypes = useMemo(() => {
    const set = new Set<string>()
    sportsEvents.forEach((e) => { if (e.sports) set.add(e.sports.sport) })
    return ['All', ...Array.from(set).sort()]
  }, [sportsEvents])

  const leaguesBySport = useMemo(() => {
    const map: Record<string, string[]> = {}
    sportsEvents.forEach((e) => {
      if (!e.sports) return
      if (!map[e.sports.sport]) map[e.sports.sport] = []
      if (!map[e.sports.sport].includes(e.sports.league)) map[e.sports.sport].push(e.sports.league)
    })
    for (const k of Object.keys(map)) map[k].sort()
    return map
  }, [sportsEvents])

  const eventCountBySport = useMemo(() => {
    const c: Record<string, number> = {}
    sportsTabFiltered.forEach((e) => { if (e.sports) c[e.sports.sport] = (c[e.sports.sport] ?? 0) + 1 })
    return c
  }, [sportsTabFiltered])

  const eventCountByLeague = useMemo(() => {
    const c: Record<string, number> = {}
    sportsTabFiltered.forEach((e) => { if (e.sports) c[`${e.sports.sport}:${e.sports.league}`] = (c[`${e.sports.sport}:${e.sports.league}`] ?? 0) + 1 })
    return c
  }, [sportsTabFiltered])

  const liveCountBySport = useMemo(() => {
    const c: Record<string, number> = {}
    sportsEvents.forEach((e) => { if (e.sports?.status === 'live') c[e.sports.sport] = (c[e.sports.sport] ?? 0) + 1 })
    return c
  }, [sportsEvents])

  // ── Live data ──
  const allInstantEvents = useMemo(() => instantEvents, [])

  const liveFilteredEvents = useMemo(() => {
    let f = allInstantEvents
    if (assetClassFilter !== 'All') f = f.filter((e) => e.instant?.assetClass === assetClassFilter)
    if (liveStatusFilter === 'Active') f = f.filter((e) => e.status === 'OPEN')
    else if (liveStatusFilter === 'Settled') f = f.filter((e) => e.status !== 'OPEN')
    return f
  }, [allInstantEvents, assetClassFilter, liveStatusFilter])

  // ── Landing helpers ──
  const featuredEvts = useMemo(() => allEvents.filter((e) => e.featured), [allEvents])
  const liveStripEvents = useMemo(() => allInstantEvents.filter((e) => e.status === 'OPEN').slice(0, 6), [allInstantEvents])

  // ── Sports sidebar callbacks ──
  const handleSportToggle = useCallback((sport: string) => {
    if (expandedSport === sport) { setExpandedSport(null) }
    else { setExpandedSport(sport); setSportFilter(sport); setLeagueFilter('All') }
  }, [expandedSport])

  const handleLeagueSelect = useCallback((sport: string, league: string) => {
    setSportFilter(sport); setLeagueFilter(league); setMobileFilterOpen(false)
  }, [])

  const handleSelectAll = useCallback(() => {
    setSportFilter('All'); setLeagueFilter('All'); setExpandedSport(null); setMobileFilterOpen(false)
  }, [])

  // ── Sports date grouping ──
  const sportsGroupedByDate = useMemo(() => {
    const groups: Record<string, PredictionEvent[]> = {}
    for (const event of sportsFiltered) {
      const dateKey = event.sports
        ? new Date(event.sports.gameTime).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
        : 'Unknown'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(event)
    }
    return Object.entries(groups)
  }, [sportsFiltered])

  // ── Render sidebar for current tab ──
  const renderSidebar = () => {
    if (isLanding) return null

    if (isSports) {
      return (
        <SportsSidebar
          sportFilter={sportFilter} leagueFilter={leagueFilter} sportTypes={sportTypes}
          leaguesBySport={leaguesBySport} expandedSport={expandedSport}
          onSportToggle={handleSportToggle} onLeagueSelect={handleLeagueSelect} onSelectAll={handleSelectAll}
          activeTab={sportsTab} setActiveTab={setSportsTab}
          eventCountBySport={eventCountBySport} eventCountByLeague={eventCountByLeague} liveCountBySport={liveCountBySport}
        />
      )
    }

    if (isLive) {
      return (
        <LiveSidebar allInstantEvents={allInstantEvents}
          assetClassFilter={assetClassFilter} setAssetClassFilter={setAssetClassFilter}
          liveStatusFilter={liveStatusFilter} setLiveStatusFilter={setLiveStatusFilter} />
      )
    }

    return (
      <CategorySidebar events={baseCategoryEvents}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        tagFilter={tagFilter} setTagFilter={setTagFilter} />
    )
  }

  // ── Render content for current tab ──
  const renderContent = () => {
    if (isSports) {
      // Mobile status tabs
      return (
        <>
          <div className="flex gap-1 mb-4 md:hidden">
            {(['upcoming', 'live', 'results'] as SportsTab[]).map((tab) => (
              <button key={tab} onClick={() => setSportsTab(tab)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                  sportsTab === tab ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]' : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
                }`}>
                {tab === 'upcoming' ? 'Upcoming' : tab === 'live' ? 'Live' : 'Results'}
              </button>
            ))}
          </div>
          {sportFilter !== 'All' && (
            <div className="flex items-center gap-1.5 mb-4 text-xs">
              <button onClick={handleSelectAll} className="text-[#8A8A9A] hover:text-white transition-colors">All</button>
              <span className="text-[#252536]">/</span>
              <span className={leagueFilter === 'All' ? 'text-[#2DD4BF]' : 'text-[#8A8A9A] hover:text-white cursor-pointer'}
                onClick={() => setLeagueFilter('All')}>{sportFilter}</span>
              {leagueFilter !== 'All' && (<><span className="text-[#252536]">/</span><span className="text-[#2DD4BF]">{leagueFilter}</span></>)}
            </div>
          )}
          {sportsFiltered.length === 0 ? (
            <div className="text-center py-16"><p className="text-[#8A8A9A] text-sm">No {sportsTab} games found</p></div>
          ) : (
            <div className="space-y-6">
              {sportsGroupedByDate.map(([date, events]) => (
                <div key={date}>
                  <h2 className="text-xs text-[#8A8A9A] font-medium uppercase tracking-wider mb-3 px-1">{date}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {events.map((event) => <SportsGameCard key={event.id} event={event} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )
    }

    if (isLive) {
      const activeEvents = liveFilteredEvents.filter((e) => e.status === 'OPEN')
      const settledEvents = liveFilteredEvents.filter((e) => e.status !== 'OPEN')

      const groupByClass = (evts: PredictionEvent[]) => {
        const groups: Record<string, PredictionEvent[]> = {}
        evts.forEach((e) => {
          const cls = e.instant?.assetClass ?? 'other'
          if (!groups[cls]) groups[cls] = []
          groups[cls].push(e)
        })
        const order = ['crypto', 'stocks', 'commodities', 'forex', 'other']
        return order.filter((k) => groups[k]?.length).map((k) => ({ key: k, label: ASSET_CLASS_LABELS[k] ?? k, events: groups[k] }))
      }

      return (
        <>
          {liveFilteredEvents.length === 0 ? (
            <div className="text-center py-16"><p className="text-[#8A8A9A] text-sm">No live predictions match your filters</p></div>
          ) : (
            <>
              {activeEvents.length > 0 && groupByClass(activeEvents).map((g) => (
                <div key={g.key} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs text-[#8A8A9A] uppercase tracking-wider font-medium">{g.label}</h3>
                    <span className="text-[10px] text-[#2DD4BF] bg-[#2DD4BF]/10 px-1.5 py-0.5 rounded-full font-mono">{g.events.length} active</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {g.events.map((e) => <InstantMarketCard key={e.id} event={e} />)}
                  </div>
                </div>
              ))}
              {settledEvents.length > 0 && (
                <>
                  <div className="border-t border-[#252536] pt-4 mb-3">
                    <h3 className="text-xs text-[#8A8A9A] uppercase tracking-wider">Recent Results</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                    {settledEvents.map((e) => <InstantMarketCard key={e.id} event={e} />)}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )
    }

    // Standard category
    return categoryEvents.length === 0
      ? <div className="text-center py-16"><p className="text-[#8A8A9A] text-sm">No events found</p></div>
      : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{categoryEvents.map((e) => <EventCard key={e.id} event={e} />)}</div>
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Explore</h1>
        <div className="flex items-center gap-2">
          {searchOpen && (
            <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-1.5 animate-[fadeScaleIn_0.15s_ease-out]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A9A" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..." className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none w-40 md:w-56" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#8A8A9A] hover:text-white min-w-[24px] min-h-[24px] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
          <button onClick={() => { if (searchOpen) { setSearchOpen(false); setSearchQuery('') } else setSearchOpen(true) }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8A8A9A] hover:text-white transition-colors rounded-lg hover:bg-[#252536]"
            aria-label={searchOpen ? 'Close search' : 'Search'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {searchOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>}
            </svg>
          </button>
          {/* Mobile filter toggle (non-landing) */}
          {!isLanding && (
            <button onClick={() => setMobileFilterOpen(true)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8A8A9A] hover:text-white rounded-lg hover:bg-[#252536] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M5 10h10M7 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === cat ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]' : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
            }`}>
            {cat === 'Live' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>}
            {cat}
          </button>
        ))}
      </div>

      {/* ═══ ALL TAB: Landing layout ═══ */}
      {isLanding && (
        <>
          <FeaturedBanner events={featuredEvts} />

          {/* Live Predictions strip */}
          {liveStripEvents.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-[#E85A7E] animate-pulse" />Live Predictions
                </span>
                <button onClick={() => setSelectedCategory('Live')} className="text-xs text-[#2DD4BF] hover:underline">
                  View all live →
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {liveStripEvents.map((event) => <InstantMarketCard key={event.id} event={event} />)}
              </div>
            </div>
          )}

          {/* Main + sidebar */}
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {categoryEvents.length === 0
                ? <div className="text-center py-16"><p className="text-[#8A8A9A] text-sm">No events found</p></div>
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{categoryEvents.map((e) => <EventCard key={e.id} event={e} />)}</div>}
            </div>
            <div className="hidden lg:flex flex-col gap-4 w-[300px] shrink-0">
              <TrendingSidebar events={allEvents} />
              <TopMoversSidebar events={allEvents} />
            </div>
          </div>

          {/* Mobile: trending + movers */}
          <div className="lg:hidden mt-6 space-y-4">
            <TrendingSidebar events={allEvents} />
            <TopMoversSidebar events={allEvents} />
          </div>
        </>
      )}

      {/* ═══ NON-ALL TAB: Sidebar + Content layout ═══ */}
      {!isLanding && (
        <div className="flex gap-6">
          <aside className="hidden md:block w-56 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
            {renderSidebar()}
          </aside>
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      )}

      {/* Mobile filter slide-over (non-landing) */}
      {mobileFilterOpen && !isLanding && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 z-50 bg-[#0B0B0F] border-r border-[#252536] overflow-y-auto animate-[slide-in-from-left_0.25s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-[#252536]">
              <span className="text-sm font-semibold text-white">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8A8A9A] hover:text-white">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="p-4">{renderSidebar()}</div>
          </div>
        </div>
      )}

      {/* Quick trade overlay */}
      {tradePanelOpen && (() => {
        const selected = getSelectedContract()
        if (!selected) return null
        return (
          <>
            {/* Desktop: centered popup */}
            <div className="hidden md:flex fixed inset-0 z-40 items-center justify-center">
              <div className="fixed inset-0 bg-black/60" onClick={closeTradePanel} />
              <div className="relative z-50 w-[380px] max-h-[85vh] overflow-y-auto bg-[#161622] border border-[#252536] rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between px-4 pt-3 pb-0">
                  <span className="text-[10px] text-[#8A8A9A] uppercase tracking-wider">Quick Trade</span>
                  <button onClick={closeTradePanel} className="min-w-[32px] min-h-[32px] flex items-center justify-center text-[#8A8A9A] hover:text-white rounded-lg hover:bg-[#252536]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
                <div className="px-4 pb-4"><TradePanel event={selected.event} context="list" /></div>
              </div>
            </div>
            {/* Mobile: BottomSheet */}
            <div className="md:hidden fixed inset-0 z-40">
              <div className="fixed inset-0 bg-black/60" onClick={closeTradePanel} />
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#161622] rounded-t-xl border-t border-[#252536] max-h-[85vh] overflow-y-auto animate-[slide-in-from-bottom_0.25s_ease-out]">
                <div className="w-10 h-1 bg-[#252536] rounded-full mx-auto mt-2 mb-3" />
                <div className="px-4 pb-6"><TradePanel event={selected.event} context="list" /></div>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
