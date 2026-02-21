import { create } from 'zustand'
import type { PredictionEvent, Contract } from '../types'
import { events as fixtureEvents, getContractById } from '../data/events'

const CATEGORIES = ['All', 'Live', 'Politics', 'Economics', 'Crypto', 'Finance', 'Tech', 'Culture', 'Sports'] as const

export type EventCategory = (typeof CATEGORIES)[number]

interface EventState {
  events: PredictionEvent[]
  selectedCategory: EventCategory
  searchQuery: string
  selectedContractId: string | null
  selectedSide: 'YES' | 'NO' | null
  tradePanelOpen: boolean

  getEvent: (id: string) => PredictionEvent | undefined
  getFilteredEvents: () => PredictionEvent[]
  getSportsEvents: () => PredictionEvent[]
  getFeaturedEvents: () => PredictionEvent[]
  getSelectedContract: () => { event: PredictionEvent; contract: Contract } | undefined
  setSelectedCategory: (category: EventCategory) => void
  setSearchQuery: (query: string) => void
  openTradePanel: (contractId: string, side: 'YES' | 'NO') => void
  closeTradePanel: () => void
}

export const useEventStore = create<EventState>((set, get) => ({
  events: fixtureEvents,
  selectedCategory: 'All',
  searchQuery: '',
  selectedContractId: null,
  selectedSide: null,
  tradePanelOpen: false,

  getEvent: (id) => get().events.find((e) => e.id === id),

  getFilteredEvents: () => {
    const { events, selectedCategory, searchQuery } = get()
    let filtered: PredictionEvent[]

    if (selectedCategory === 'All') {
      filtered = events.filter((e) => e.type !== 'sports' && e.type !== 'instant')
    } else if (selectedCategory === 'Live') {
      filtered = events.filter((e) => e.type === 'instant')
    } else if (selectedCategory === 'Sports') {
      filtered = events.filter((e) => e.category === 'Sports')
    } else {
      filtered = events.filter((e) => e.category === selectedCategory && e.type !== 'instant')
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
  },

  getSportsEvents: () => get().events.filter((e) => e.category === 'Sports'),

  getFeaturedEvents: () => get().events.filter((e) => e.featured),

  getSelectedContract: () => {
    const { selectedContractId } = get()
    if (!selectedContractId) return undefined
    return getContractById(selectedContractId)
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  openTradePanel: (contractId, side) =>
    set({ selectedContractId: contractId, selectedSide: side, tradePanelOpen: true }),

  closeTradePanel: () =>
    set({ selectedContractId: null, selectedSide: null, tradePanelOpen: false }),
}))

export { CATEGORIES }
