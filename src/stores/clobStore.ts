import { create } from 'zustand'
import type {
  BinaryMarket, NegRiskEvent, ClobMarket, ClobMatchSummary,
  Position, TradingOrder, TradeRecord, BalanceState, TradingSelection,
  CreateOrderRequest, CreateOrderResponse, Execution,
  OrderSide, OrderBookLevel,
} from '../data/clob/types'
import { clobMatches } from '../data/clob/mockData'

interface ClobState {
  matches: ClobMatchSummary[]
  balance: BalanceState
  positions: Map<string, Position>
  orders: Map<string, TradingOrder>
  trades: TradeRecord[]
  selection: TradingSelection | null
  simulationTimer: ReturnType<typeof setInterval> | null

  setSelection: (sel: TradingSelection | null) => void
  placeOrder: (req: CreateOrderRequest) => CreateOrderResponse | null
  cancelOrder: (orderId: string) => number
  closePosition: (positionId: string) => void
  settleMarket: (marketId: string, result: 'yes' | 'no') => void
  voidMarket: (marketId: string) => void

  getMarket: (marketId: string) => BinaryMarket | undefined
  getOutcome: (eventId: string, outcomeId: string) => { event: NegRiskEvent; outcome: NegRiskEvent['outcomes'][0] } | undefined
  findMarketInMatches: (marketId: string) => ClobMarket | undefined

  startSimulation: () => void
  stopSimulation: () => void
}

let _oid = 0
const oid = () => `ord-${++_oid}-${Date.now().toString(36)}`
const pid = () => `pos-${++_oid}-${Date.now().toString(36)}`
const tid = () => `trd-${++_oid}-${Date.now().toString(36)}`

function matchEngine(
  book: { bids: OrderBookLevel[]; asks: OrderBookLevel[] },
  side: OrderSide,
  type: 'market' | 'limit',
  price: number,
  shares: number,
): { executions: Execution[]; remainingShares: number } {
  const executions: Execution[] = []
  let remaining = shares
  const levels = side === 'yes' ? [...book.asks] : [...book.bids]

  for (let i = 0; i < levels.length && remaining > 0; i++) {
    const level = levels[i]
    if (type === 'limit') {
      if (side === 'yes' && level.price > price) break
      if (side === 'no' && level.price < price) break
    }

    const fillQty = Math.min(remaining, level.quantity)
    executions.push({ price: level.price, shares: fillQty })
    remaining -= fillQty
    level.quantity -= fillQty
  }

  if (side === 'yes') {
    book.asks = levels.filter(l => l.quantity > 0)
  } else {
    book.bids = levels.filter(l => l.quantity > 0)
  }

  return { executions, remainingShares: remaining }
}

export const useClobStore = create<ClobState>((set, get) => ({
  matches: clobMatches,
  balance: { available: 10000, inPositions: 0, inOrders: 0 },
  positions: new Map(),
  orders: new Map(),
  trades: [],
  selection: null,
  simulationTimer: null,

  setSelection: (sel) => set({ selection: sel }),

  findMarketInMatches: (marketId) => {
    for (const match of get().matches) {
      for (const tab of match.tabs) {
        for (const m of tab.markets) {
          if (m.type === 'binary' && m.id === marketId) return m
          if (m.type === 'negRisk') {
            if (m.id === marketId) return m
            for (const o of m.outcomes) {
              if (o.id === marketId) return m
            }
          }
        }
      }
    }
    return undefined
  },

  getMarket: (marketId) => {
    for (const match of get().matches) {
      for (const tab of match.tabs) {
        for (const m of tab.markets) {
          if (m.type === 'binary' && m.id === marketId) return m
        }
      }
    }
    return undefined
  },

  getOutcome: (eventId, outcomeId) => {
    for (const match of get().matches) {
      for (const tab of match.tabs) {
        for (const m of tab.markets) {
          if (m.type === 'negRisk' && m.id === eventId) {
            const outcome = m.outcomes.find(o => o.id === outcomeId)
            if (outcome) return { event: m, outcome }
          }
        }
      }
    }
    return undefined
  },

  placeOrder: (req) => {
    const state = get()
    const { side, type: orderType } = req

    let book: { bids: OrderBookLevel[]; asks: OrderBookLevel[] } | null = null
    let currentPrice = 50
    let question = ''
    let outcomeLabel: string | undefined

    if (req.outcomeId) {
      for (const match of state.matches) {
        for (const tab of match.tabs) {
          for (const m of tab.markets) {
            if (m.type === 'negRisk') {
              const o = m.outcomes.find(oo => oo.id === req.outcomeId)
              if (o) {
                book = o.orderBook
                currentPrice = side === 'yes' ? o.yesPrice : o.noPrice
                question = m.title
                outcomeLabel = o.label
              }
            }
          }
        }
      }
    } else {
      const market = state.getMarket(req.marketId)
      if (market) {
        book = market.orderBook
        currentPrice = side === 'yes' ? market.yesPrice : market.noPrice
        question = market.question
      }
    }

    if (!book) return null

    const price = orderType === 'market' ? (side === 'yes' ? 99 : 1) : (req.price ?? currentPrice)
    const shares = req.shares ?? (req.total ? Math.floor((req.total / price) * 100) : 10)
    const cost = Math.round(shares * price / 100 * 100) / 100

    if (cost > state.balance.available) return null

    const { executions, remainingShares } = matchEngine(book, side, orderType, price, shares)

    const filledShares = shares - remainingShares
    const avgFill = executions.length > 0
      ? Math.round(executions.reduce((s, e) => s + e.price * e.shares, 0) / filledShares)
      : 0

    const order: TradingOrder = {
      id: oid(),
      marketId: req.marketId,
      marketQuestion: question,
      outcomeId: req.outcomeId,
      outcomeLabel,
      side,
      type: orderType,
      price,
      shares,
      filledShares,
      avgFillPrice: avgFill,
      status: filledShares === shares ? 'filled' : remainingShares > 0 && filledShares > 0 ? 'partial' : remainingShares === shares ? 'open' : 'filled',
      createdAt: Date.now(),
    }

    const newTrades: TradeRecord[] = executions.map(e => ({
      id: tid(),
      orderId: order.id,
      marketId: req.marketId,
      marketQuestion: question,
      outcomeId: req.outcomeId,
      outcomeLabel,
      side,
      price: e.price,
      shares: e.shares,
      total: Math.round(e.price * e.shares) / 100,
      timestamp: Date.now(),
    }))

    const actualCost = executions.reduce((s, e) => s + e.price * e.shares, 0) / 100
    const frozenForLimit = remainingShares > 0 && orderType === 'limit'
      ? Math.round(remainingShares * price) / 100
      : 0

    let position: Position | undefined
    if (filledShares > 0) {
      const posKey = `${req.marketId}-${req.outcomeId ?? 'main'}-${side}`
      const existing = state.positions.get(posKey)
      if (existing) {
        const newTotalCost = existing.totalCost + actualCost
        const newShares = existing.shares + filledShares
        position = {
          ...existing,
          shares: newShares,
          avgPrice: Math.round(newTotalCost / newShares * 100),
          totalCost: newTotalCost,
          currentPrice: avgFill,
          unrealizedPnl: Math.round((100 - newTotalCost / newShares * 100) * newShares) / 100,
          unrealizedPnlPercent: Math.round(((100 - newTotalCost / newShares * 100) / (newTotalCost / newShares * 100)) * 100),
        }
      } else {
        position = {
          id: pid(),
          marketId: req.marketId,
          marketQuestion: question,
          outcomeId: req.outcomeId,
          outcomeLabel,
          side,
          shares: filledShares,
          avgPrice: avgFill,
          totalCost: actualCost,
          currentPrice: avgFill,
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          status: 'open',
        }
      }
      const posMap = new Map(state.positions)
      posMap.set(posKey, position)
      set({ positions: posMap })
    }

    const ordersMap = new Map(state.orders)
    if (order.status === 'open' || order.status === 'partial') {
      ordersMap.set(order.id, order)
    }

    set({
      orders: ordersMap,
      trades: [...state.trades, ...newTrades],
      balance: {
        available: state.balance.available - actualCost - frozenForLimit,
        inPositions: state.balance.inPositions + actualCost,
        inOrders: state.balance.inOrders + frozenForLimit,
      },
    })

    if (req.outcomeId) {
      updateYesNoPrice(req.marketId, req.outcomeId)
    } else {
      const market = get().getMarket(req.marketId)
      if (market) {
        const midBid = market.orderBook.bids[0]?.price ?? market.yesPrice
        const midAsk = market.orderBook.asks[0]?.price ?? market.yesPrice
        market.yesPrice = Math.round((midBid + midAsk) / 2)
        market.noPrice = 100 - market.yesPrice
        market.lastTradePrice = avgFill || market.yesPrice
        set({ matches: [...get().matches] })
      }
    }

    return { order, executions, position }
  },

  cancelOrder: (orderId) => {
    const state = get()
    const order = state.orders.get(orderId)
    if (!order || order.status === 'filled' || order.status === 'cancelled') return 0

    const remaining = order.shares - order.filledShares
    const refund = Math.round(remaining * order.price) / 100

    order.status = 'cancelled'
    const ordersMap = new Map(state.orders)
    ordersMap.set(orderId, { ...order })

    set({
      orders: ordersMap,
      balance: {
        ...state.balance,
        available: state.balance.available + refund,
        inOrders: state.balance.inOrders - refund,
      },
    })

    return refund
  },

  closePosition: (positionId) => {
    const state = get()
    let posKey: string | null = null
    let pos: Position | null = null

    for (const [key, p] of state.positions) {
      if (p.id === positionId) {
        posKey = key
        pos = p
        break
      }
    }
    if (!pos || !posKey) return

    const sellPrice = pos.currentPrice
    const proceeds = Math.round(pos.shares * sellPrice) / 100
    const pnl = proceeds - pos.totalCost

    const closedPos: Position = {
      ...pos,
      status: 'closed',
      finalPnl: Math.round(pnl * 100) / 100,
    }

    const posMap = new Map(state.positions)
    posMap.set(posKey, closedPos)

    set({
      positions: posMap,
      balance: {
        available: state.balance.available + proceeds,
        inPositions: state.balance.inPositions - pos.totalCost,
        inOrders: state.balance.inOrders,
      },
    })
  },

  settleMarket: (marketId, result) => {
    const state = get()

    for (const match of state.matches) {
      for (const tab of match.tabs) {
        for (const m of tab.markets) {
          if (m.type === 'binary' && m.id === marketId) {
            m.status = 'settled'
            m.settlementResult = result
          }
        }
      }
    }

    const posMap = new Map(state.positions)
    let balanceChange = 0

    for (const [key, pos] of posMap) {
      if (pos.marketId === marketId && pos.status === 'open') {
        const won = (pos.side === 'yes' && result === 'yes') || (pos.side === 'no' && result === 'no')
        const payout = won ? pos.shares : 0
        const pnl = payout - pos.totalCost

        posMap.set(key, {
          ...pos,
          status: 'settled',
          settlementResult: result,
          finalPnl: Math.round(pnl * 100) / 100,
        })
        balanceChange += Math.max(0, payout)
      }
    }

    set({
      matches: [...state.matches],
      positions: posMap,
      balance: {
        ...state.balance,
        available: state.balance.available + balanceChange,
        inPositions: Math.max(0, state.balance.inPositions - balanceChange),
      },
    })
  },

  voidMarket: (marketId) => {
    const state = get()

    for (const match of state.matches) {
      for (const tab of match.tabs) {
        for (const m of tab.markets) {
          if (m.type === 'binary' && m.id === marketId) {
            m.status = 'voided'
          }
        }
      }
    }

    const posMap = new Map(state.positions)
    let refundTotal = 0

    for (const [key, pos] of posMap) {
      if (pos.marketId === marketId && pos.status === 'open') {
        refundTotal += pos.totalCost
        posMap.set(key, {
          ...pos,
          status: 'settled',
          settlementResult: 'void',
          finalPnl: 0,
        })
      }
    }

    set({
      matches: [...state.matches],
      positions: posMap,
      balance: {
        ...state.balance,
        available: state.balance.available + refundTotal,
        inPositions: Math.max(0, state.balance.inPositions - refundTotal),
      },
    })
  },

  startSimulation: () => {
    const existing = get().simulationTimer
    if (existing) clearInterval(existing)

    const timer = setInterval(() => {
      const state = get()
      const allMarkets: (BinaryMarket | { orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }; yesPrice: number })[] = []

      for (const match of state.matches) {
        for (const tab of match.tabs) {
          for (const m of tab.markets) {
            if (m.status !== 'open') continue
            if (m.type === 'binary') {
              allMarkets.push(m)
            } else {
              for (const o of m.outcomes) {
                allMarkets.push(o)
              }
            }
          }
        }
      }

      if (allMarkets.length === 0) return

      const count = Math.min(3, allMarkets.length)
      for (let i = 0; i < count; i++) {
        const target = allMarkets[Math.floor(Math.random() * allMarkets.length)]
        const book = target.orderBook
        const isBid = Math.random() > 0.5
        const spread = Math.floor(Math.random() * 3) + 1
        const price = isBid
          ? Math.max(1, target.yesPrice - spread)
          : Math.min(99, target.yesPrice + spread)
        const qty = Math.floor(20 + Math.random() * 200)

        if (isBid) {
          const existing = book.bids.find(l => l.price === price)
          if (existing) existing.quantity += qty
          else book.bids.push({ price, quantity: qty })
          book.bids.sort((a, b) => b.price - a.price)
          if (book.bids.length > 8) book.bids.length = 8
        } else {
          const existing = book.asks.find(l => l.price === price)
          if (existing) existing.quantity += qty
          else book.asks.push({ price, quantity: qty })
          book.asks.sort((a, b) => a.price - b.price)
          if (book.asks.length > 8) book.asks.length = 8
        }
      }

      set({ matches: [...state.matches] })
    }, 3000 + Math.random() * 2000)

    set({ simulationTimer: timer })
  },

  stopSimulation: () => {
    const timer = get().simulationTimer
    if (timer) clearInterval(timer)
    set({ simulationTimer: null })
  },
}))

function updateYesNoPrice(eventId: string, outcomeId: string) {
  const state = useClobStore.getState()
  for (const match of state.matches) {
    for (const tab of match.tabs) {
      for (const m of tab.markets) {
        if (m.type === 'negRisk' && m.id === eventId) {
          const o = m.outcomes.find(oo => oo.id === outcomeId)
          if (o) {
            const midBid = o.orderBook.bids[0]?.price ?? o.yesPrice
            const midAsk = o.orderBook.asks[0]?.price ?? o.yesPrice
            o.yesPrice = Math.round((midBid + midAsk) / 2)
            o.noPrice = 100 - o.yesPrice
            o.lastTradePrice = o.yesPrice
          }
          useClobStore.setState({ matches: [...state.matches] })
          return
        }
      }
    }
  }
}
