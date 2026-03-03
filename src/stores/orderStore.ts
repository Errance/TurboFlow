import { create } from 'zustand'
import type { Order, OrderAction, OrderSide, QuickOrderScenario, ScenarioStep } from '../types'
import { MVP_FEE_RATE } from '../types'
import { orders as fixtureOrders } from '../data/orders'
import { quickOrderScenarios } from '../data/scenarios'
import { usePortfolioStore } from './portfolioStore'

interface MarketOrderParams {
  contractId: string
  marketTitle: string
  side: OrderSide
  action?: OrderAction
  price: number
  quantity: number
}

interface OrderState {
  orders: Order[]
  activeScenario: QuickOrderScenario | null
  scenarioStepIndex: number

  getOpenOrders: () => Order[]
  getOrdersByMarket: (marketId: string) => Order[]
  getOrdersByStatus: (status: Order['status']) => Order[]

  placeMarketOrder: (params: MarketOrderParams) => void
  placeQuickOrder: (
    marketId: string,
    marketTitle: string,
    side: OrderSide,
    quantity: number,
    contractId?: string,
    scenarioId?: string,
  ) => void
  placeLimitOrder: (
    marketId: string,
    marketTitle: string,
    side: OrderSide,
    price: number,
    quantity: number,
    contractId?: string,
    action?: OrderAction,
  ) => void
  simulateFillOrder: (orderId: string) => void
  cancelOrder: (orderId: string) => void
  cancelAllOrders: (marketId?: string) => void
}

let scenarioTimers: ReturnType<typeof setTimeout>[] = []

function clearScenarioTimers() {
  scenarioTimers.forEach(clearTimeout)
  scenarioTimers = []
}

function computeFee(price: number, quantity: number): number {
  return Math.round(price * quantity * MVP_FEE_RATE * 100) / 100
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [...fixtureOrders],
  activeScenario: null,
  scenarioStepIndex: 0,

  getOpenOrders: () => get().orders.filter((o) => o.status === 'Open' || o.status === 'PartialFill'),

  getOrdersByMarket: (marketId) => get().orders.filter((o) => o.marketId === marketId),

  getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),

  placeMarketOrder: ({ contractId, marketTitle, side, action = 'BUY', price, quantity }) => {
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()
    const fee = computeFee(price, quantity)

    const newOrder: Order = {
      id: orderId,
      marketId: contractId,
      contractId,
      marketTitle,
      side,
      action,
      type: 'market',
      price,
      quantity,
      filledQuantity: quantity,
      fee,
      timeInForce: 'GTC',
      status: 'Filled',
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ orders: [newOrder, ...state.orders] }))

    usePortfolioStore.getState().executeTrade({ contractId, marketTitle, side, action, price, quantity, fee })
  },

  placeQuickOrder: (marketId, marketTitle, side, quantity, contractId, scenarioId) => {
    clearScenarioTimers()

    const scenario =
      quickOrderScenarios.find((s) => s.id === scenarioId) ??
      quickOrderScenarios.find((s) => s.marketId === marketId) ??
      quickOrderScenarios[0]

    const orderId = `ord-${Date.now()}`
    const now = new Date().toISOString()
    const fee = computeFee(scenario.estimatedAvgPrice, quantity)

    const newOrder: Order = {
      id: orderId,
      marketId,
      contractId: contractId ?? marketId,
      marketTitle,
      side,
      action: 'BUY',
      type: 'market',
      price: scenario.estimatedAvgPrice,
      quantity,
      filledQuantity: 0,
      fee,
      timeInForce: 'GTC',
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      orders: [newOrder, ...state.orders],
      activeScenario: scenario,
      scenarioStepIndex: 0,
    }))

    let cumulativeDelay = 0
    scenario.steps.forEach((step: ScenarioStep, i: number) => {
      cumulativeDelay += step.delay
      const timer = setTimeout(() => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: step.status,
                  filledQuantity: step.filledQuantity ?? o.filledQuantity,
                  rejectReason: step.rejectReason,
                  rejectCta: step.rejectCta,
                  updatedAt: new Date().toISOString(),
                }
              : o,
          ),
          scenarioStepIndex: i + 1,
        }))

        if (step.status === 'Filled') {
          usePortfolioStore.getState().executeTrade({
            contractId: contractId ?? marketId,
            marketTitle,
            side,
            action: 'BUY',
            price: scenario.estimatedAvgPrice,
            quantity: step.filledQuantity ?? quantity,
            fee,
          })
        }
      }, cumulativeDelay)
      scenarioTimers.push(timer)
    })
  },

  placeLimitOrder: (marketId, marketTitle, side, price, quantity, contractId, action = 'BUY') => {
    const orderId = `ord-${Date.now()}`
    const now = new Date().toISOString()
    const fee = computeFee(price, quantity)

    const newOrder: Order = {
      id: orderId,
      marketId,
      contractId: contractId ?? marketId,
      marketTitle,
      side,
      action,
      type: 'limit',
      price,
      quantity,
      filledQuantity: 0,
      fee,
      timeInForce: 'GTC',
      status: 'Open',
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      orders: [newOrder, ...state.orders],
    }))
  },

  simulateFillOrder: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId)
    if (!order || (order.status !== 'Open' && order.status !== 'PartialFill')) return

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'Filled' as const, filledQuantity: order.quantity, updatedAt: new Date().toISOString() }
          : o,
      ),
    }))

    usePortfolioStore.getState().executeTrade({
      contractId: order.contractId ?? order.marketId,
      marketTitle: order.marketTitle,
      side: order.side,
      action: order.action,
      price: order.price,
      quantity: order.quantity,
      fee: order.fee,
    })
  },

  cancelOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId && (o.status === 'Open' || o.status === 'PartialFill')
          ? { ...o, status: 'Cancelled' as const, updatedAt: new Date().toISOString() }
          : o,
      ),
    }))
  },

  cancelAllOrders: (marketId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        (o.status === 'Open' || o.status === 'PartialFill') &&
        (!marketId || o.marketId === marketId)
          ? { ...o, status: 'Cancelled' as const, updatedAt: new Date().toISOString() }
          : o,
      ),
    }))
  },
}))
