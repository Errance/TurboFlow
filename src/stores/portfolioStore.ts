import { create } from 'zustand'
import type { Position, Trade } from '../types'
import { positions as fixturePositions } from '../data/positions'
import { trades as fixtureTrades } from '../data/trades'

interface PortfolioState {
  positions: Position[]
  trades: Trade[]
  activeTab: 'positions' | 'orders' | 'activity' | 'trades'

  getPositionsByMarket: (marketId: string) => Position[]
  getTradesByMarket: (marketId: string) => Trade[]
  setActiveTab: (tab: PortfolioState['activeTab']) => void
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
}))
