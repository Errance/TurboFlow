import { create } from 'zustand'
import type { OrderbookLevel } from '../types'
import { orderbookSnapshots, orderbookDeltas } from '../data/orderbooks'

interface OrderbookState {
  bids: OrderbookLevel[]
  asks: OrderbookLevel[]
  lastSeq: number
  currentMarketId: string | null
  deltaIndex: number
  isRunning: boolean

  loadSnapshot: (marketId: string) => void
  applyNextDelta: () => void
  startDeltaStream: (marketId: string) => void
  stopDeltaStream: () => void
  simulateReconnect: () => void
}

let deltaTimer: ReturnType<typeof setInterval> | null = null

export const useOrderbookStore = create<OrderbookState>((set, get) => ({
  bids: [],
  asks: [],
  lastSeq: 0,
  currentMarketId: null,
  deltaIndex: 0,
  isRunning: false,

  loadSnapshot: (marketId) => {
    const snapshot = orderbookSnapshots[marketId]
    if (!snapshot) {
      set({ bids: [], asks: [], lastSeq: 0, currentMarketId: marketId, deltaIndex: 0 })
      return
    }
    set({
      bids: [...snapshot.bids],
      asks: [...snapshot.asks],
      lastSeq: snapshot.seq,
      currentMarketId: marketId,
      deltaIndex: 0,
    })
  },

  applyNextDelta: () => {
    const { currentMarketId, deltaIndex, bids, asks } = get()
    if (!currentMarketId) return

    const deltas = orderbookDeltas[currentMarketId]
    if (!deltas || deltaIndex >= deltas.length) {
      set({ deltaIndex: 0 })
      return
    }

    const delta = deltas[deltaIndex]
    const jitter = 1 + (Math.random() - 0.5) * 0.1

    if (delta.side === 'bid') {
      const newBids = applyLevelUpdate(bids, delta.price, Math.round(delta.quantity * jitter))
      set({ bids: newBids, lastSeq: delta.seq, deltaIndex: deltaIndex + 1 })
    } else {
      const newAsks = applyLevelUpdate(asks, delta.price, Math.round(delta.quantity * jitter))
      set({ asks: newAsks, lastSeq: delta.seq, deltaIndex: deltaIndex + 1 })
    }
  },

  startDeltaStream: (marketId) => {
    const state = get()
    if (state.isRunning) state.stopDeltaStream()

    get().loadSnapshot(marketId)
    set({ isRunning: true })

    deltaTimer = setInterval(() => {
      get().applyNextDelta()
    }, 3000 + Math.random() * 2000)
  },

  stopDeltaStream: () => {
    if (deltaTimer) {
      clearInterval(deltaTimer)
      deltaTimer = null
    }
    set({ isRunning: false })
  },

  simulateReconnect: () => {
    const { currentMarketId } = get()
    if (!currentMarketId) return
    get().stopDeltaStream()
    get().startDeltaStream(currentMarketId)
  },
}))

function applyLevelUpdate(
  levels: OrderbookLevel[],
  price: number,
  quantity: number,
): OrderbookLevel[] {
  const updated = levels.map((l) =>
    l.price === price ? { ...l, quantity } : l,
  )
  if (!updated.some((l) => l.price === price)) {
    updated.push({ price, quantity })
  }
  return updated.filter((l) => l.quantity > 0).sort((a, b) => b.price - a.price)
}
