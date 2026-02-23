import { create } from 'zustand'
import type { Position, Trade } from '../types'
import { positions as fixturePositions } from '../data/positions'
import { trades as fixtureTrades } from '../data/trades'

interface PortfolioState {
  positions: Position[]
  trades: Trade[]
  activeTab: 'positions' | 'orders' | 'activity' | 'trades' | 'parlays'

  getPositionsByMarket: (marketId: string) => Position[]
  getTradesByMarket: (marketId: string) => Trade[]
  setActiveTab: (tab: PortfolioState['activeTab']) => void
  addPosition: (position: Position) => void
  addTrade: (trade: Trade) => void
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  positions: [...fixturePositions],
  trades: [...fixtureTrades],
  activeTab: 'positions',

  getPositionsByMarket: (marketId) =>
    get().positions.filter((p) => p.marketId === marketId),

  getTradesByMarket: (marketId) =>
    get().trades.filter((t) => t.marketId === marketId),

  setActiveTab: (tab) => set({ activeTab: tab }),

  addPosition: (position) => {
    const existing = get().positions.find(
      (p) => p.marketId === position.marketId && p.side === position.side,
    )
    if (existing) {
      const totalQty = existing.quantity + position.quantity
      const newAvg = Math.round(
        (existing.avgPrice * existing.quantity + position.avgPrice * position.quantity) / totalQty,
      )
      set({
        positions: get().positions.map((p) =>
          p.id === existing.id
            ? { ...p, quantity: totalQty, avgPrice: newAvg, currentPrice: position.currentPrice }
            : p,
        ),
      })
    } else {
      set({ positions: [...get().positions, position] })
    }
  },

  addTrade: (trade) => set({ trades: [trade, ...get().trades] }),
}))
