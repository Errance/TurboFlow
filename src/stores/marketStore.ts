import { create } from 'zustand'
import type { Market } from '../types'
import { markets as fixtureMarkets } from '../data/markets'

interface MarketState {
  markets: Market[]
  selectedMarketId: string | null
  filterStatus: 'ALL' | 'OPEN' | 'CLOSED' | 'SETTLED'
  searchQuery: string

  getMarket: (id: string) => Market | undefined
  getFilteredMarkets: () => Market[]
  setSelectedMarket: (id: string | null) => void
  setFilterStatus: (status: MarketState['filterStatus']) => void
  setSearchQuery: (query: string) => void
}

export const useMarketStore = create<MarketState>((set, get) => ({
  markets: fixtureMarkets,
  selectedMarketId: null,
  filterStatus: 'ALL',
  searchQuery: '',

  getMarket: (id) => get().markets.find((m) => m.id === id),

  getFilteredMarkets: () => {
    const { markets, filterStatus, searchQuery } = get()
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
  },

  setSelectedMarket: (id) => set({ selectedMarketId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
