import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketStore } from '../stores/marketStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { MarketStatus } from '../types'

const FILTERS: { label: string; value: 'ALL' | 'OPEN' | 'CLOSED' | 'SETTLED' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Settled', value: 'SETTLED' },
]

function statusBadge(status: MarketStatus) {
  const map: Record<MarketStatus, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    OPEN: { variant: 'success', label: 'Open' },
    CLOSED: { variant: 'warning', label: 'Closed' },
    RESOLVING: { variant: 'warning', label: 'Resolving' },
    SETTLED: { variant: 'neutral', label: 'Settled' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`
  return String(v)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function MarketsPage() {
  const navigate = useNavigate()
  const filterStatus = useMarketStore((s) => s.filterStatus)
  const setFilterStatus = useMarketStore((s) => s.setFilterStatus)
  const markets = useMarketStore((s) => s.markets)
  const searchQuery = useMarketStore((s) => s.searchQuery)
  const setSearchQuery = useMarketStore((s) => s.setSearchQuery)

  const filteredMarkets = useMemo(() => {
    let filtered = markets
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((m) =>
        filterStatus === 'CLOSED'
          ? m.status === 'CLOSED' || m.status === 'RESOLVING'
          : m.status === filterStatus,
      )
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      )
    }
    return filtered
  }, [markets, filterStatus, searchQuery])

  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Markets</h1>
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
                placeholder="Search markets..."
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
              if (searchOpen) {
                setSearchOpen(false)
                setSearchQuery('')
              } else {
                setSearchOpen(true)
              }
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

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
              filterStatus === f.value
                ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                : 'text-[#8A8A9A] hover:text-white hover:bg-[#252536]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Market cards grid */}
      {filteredMarkets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#8A8A9A] text-sm">No markets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMarkets.map((market) => (
            <Card
              key={market.id}
              hover
              onClick={() => navigate(`/market/${market.id}`)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-sm font-medium text-white line-clamp-2 flex-1">
                  {market.title}
                </h2>
                {statusBadge(market.status)}
              </div>
              <p className="text-xs text-[#8A8A9A] mb-3">{market.category}</p>
              <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-[#8A8A9A]">
                <span>
                  <span className="text-white">{market.lastPrice ?? '—'}¢</span>
                </span>
                <span>{formatVolume(market.volume)} vol</span>
                <span>{formatDate(market.expiresAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
