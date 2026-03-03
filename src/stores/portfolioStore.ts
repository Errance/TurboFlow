import { create } from 'zustand'
import type { OrderAction, OrderSide, Position, Trade } from '../types'
import { positions as fixturePositions } from '../data/positions'
import { trades as fixtureTrades } from '../data/trades'

interface ExecuteTradeParams {
  contractId: string
  marketTitle: string
  side: OrderSide
  action?: OrderAction
  /** USDC decimal */
  price: number
  quantity: number
  fee?: number
  parlayId?: string
}

interface PortfolioState {
  positions: Position[]
  trades: Trade[]
  activeTab: 'positions' | 'orders' | 'history' | 'events'

  getPositionsByMarket: (marketId: string) => Position[]
  getTradesByMarket: (marketId: string) => Trade[]
  setActiveTab: (tab: PortfolioState['activeTab']) => void
  addPosition: (position: Position) => void
  reducePosition: (contractId: string, side: OrderSide, quantity: number, parlayId?: string) => void
  addTrade: (trade: Trade) => void
  executeTrade: (params: ExecuteTradeParams) => void
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
    const matchKey = position.contractId ?? position.marketId
    const existing = get().positions.find(
      (p) =>
        (p.contractId ?? p.marketId) === matchKey &&
        p.side === position.side &&
        p.parlayId === position.parlayId,
    )
    if (existing) {
      const totalQty = existing.quantity + position.quantity
      const newAvg = Math.round(
        ((existing.avgPrice * existing.quantity + position.avgPrice * position.quantity) / totalQty) * 100,
      ) / 100
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

  reducePosition: (contractId, side, quantity, parlayId) => {
    const matchKey = contractId
    const existing = get().positions.find(
      (p) =>
        (p.contractId ?? p.marketId) === matchKey &&
        p.side === side &&
        p.parlayId === parlayId,
    )
    if (!existing) return

    if (quantity >= existing.quantity) {
      set({ positions: get().positions.filter((p) => p.id !== existing.id) })
    } else {
      set({
        positions: get().positions.map((p) =>
          p.id === existing.id
            ? { ...p, quantity: p.quantity - quantity }
            : p,
        ),
      })
    }
  },

  addTrade: (trade) => set({ trades: [trade, ...get().trades] }),

  executeTrade: ({ contractId, marketTitle, side, action = 'BUY', price, quantity, fee = 0, parlayId }) => {
    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    get().addTrade({
      id: tradeId,
      marketId: contractId,
      contractId,
      marketTitle,
      side,
      action,
      price,
      quantity,
      fee,
      timestamp: new Date().toISOString(),
    })

    if (action === 'SELL') {
      get().reducePosition(contractId, side, quantity, parlayId)
    } else {
      get().addPosition({
        id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        marketId: contractId,
        contractId,
        marketTitle,
        side,
        quantity,
        avgPrice: price,
        currentPrice: price,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        marketStatus: 'OPEN',
        ...(parlayId ? { parlayId } : {}),
      })
    }
  },
}))
