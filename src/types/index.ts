// === Market ===

export type MarketStatus = 'OPEN' | 'CLOSED' | 'RESOLVING' | 'SETTLED'

export interface SettlementDetails {
  source: string
  settledAt: string
  evidence: string
}

export interface Market {
  id: string
  title: string
  description: string
  category: string
  resolutionSource: string
  expiresAt: string
  status: MarketStatus
  lastPrice: number | null
  volume: number
  settlementResult?: 'YES' | 'NO'
  rules?: string
  settlementDetails?: SettlementDetails
}

// === Orderbook ===

export interface OrderbookLevel {
  price: number
  quantity: number
}

export interface OrderbookSnapshot {
  marketId: string
  bids: OrderbookLevel[]
  asks: OrderbookLevel[]
  seq: number
}

export interface OrderbookDelta {
  marketId: string
  seq: number
  side: 'bid' | 'ask'
  price: number
  quantity: number
}

// === Order ===

export type OrderStatus = 'Pending' | 'Open' | 'PartialFill' | 'Filled' | 'Cancelled' | 'Rejected'
export type OrderSide = 'YES' | 'NO'
export type OrderType = 'market' | 'limit'

export interface Order {
  id: string
  marketId: string
  marketTitle: string
  side: OrderSide
  type: OrderType
  price: number
  quantity: number
  filledQuantity: number
  status: OrderStatus
  rejectReason?: string
  rejectCta?: { label: string; route: string }
  createdAt: string
  updatedAt: string
}

// === Position ===

export interface Position {
  id: string
  marketId: string
  marketTitle: string
  side: OrderSide
  quantity: number
  avgPrice: number
  currentPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  marketStatus: MarketStatus
  settlementResult?: 'YES' | 'NO'
  finalPnl?: number
}

// === Trade ===

export interface Trade {
  id: string
  marketId: string
  marketTitle: string
  side: OrderSide
  price: number
  quantity: number
  timestamp: string
}

// === Quick Order Scenario ===

export type ScenarioOutcome = 'filled' | 'partial_then_filled' | 'rejected'

export interface QuickOrderScenario {
  id: string
  marketId: string
  outcome: ScenarioOutcome
  estimatedAvgPrice: number
  estimatedLevels: number
  estimatedFee: number
  steps: ScenarioStep[]
}

export interface ScenarioStep {
  delay: number
  status: OrderStatus
  filledQuantity?: number
  rejectReason?: string
  rejectCta?: { label: string; route: string }
}
