// ============ 市场数据模型 ============

export type MarketStatus = 'open' | 'suspended' | 'settled' | 'voided'

export interface OrderBookLevel {
  price: number   // 1-99 (¢)
  quantity: number // shares
}

export interface OrderBook {
  bids: OrderBookLevel[] // sorted desc by price
  asks: OrderBookLevel[] // sorted asc by price
}

export interface BinaryMarket {
  type: 'binary'
  id: string
  question: string
  groupTitle: string
  yesPrice: number   // 1-99 (¢)
  noPrice: number     // 100 - yesPrice
  volume: number
  volume24h: number
  lastTradePrice: number
  orderBook: OrderBook
  status: MarketStatus
  settlementResult?: 'yes' | 'no' | 'void'
}

export interface Outcome {
  id: string
  label: string
  yesPrice: number
  noPrice: number
  volume: number
  volume24h: number
  lastTradePrice: number
  orderBook: OrderBook
}

export interface NegRiskEvent {
  type: 'negRisk'
  id: string
  title: string
  groupTitle: string
  outcomes: Outcome[]
  status: MarketStatus
  settlementResult?: { winningOutcomeId: string } | 'void'
}

export type ClobMarket = BinaryMarket | NegRiskEvent

// ============ Tab / 比赛 ============

export interface ClobTab {
  id: string
  label: string
  markets: ClobMarket[]
}

export interface ClobMatchSummary {
  id: string
  league: string
  leagueId: string
  homeTeam: { name: string; shortName: string }
  awayTeam: { name: string; shortName: string }
  date: string
  time: string
  status: 'scheduled' | 'live' | 'finished' | 'interrupted' | 'abandoned' | 'postponed' | 'cancelled' | 'corrected'
  score?: { home: number; away: number }
  currentMinute?: number
  moneyline: { home: number; draw: number; away: number }
  totalLine: { line: number; overPrice: number; underPrice: number }
  asianLine: { line: string; homePrice: number; awayPrice: number }
  marketCount: number
  tabs: ClobTab[]
  // pass-through from old match
  referee?: string
  venue?: string
  homeLineup?: unknown
  awayLineup?: unknown
  events?: unknown
  headToHead?: unknown
  stats?: unknown
}

// ============ 交易模型 ============

export type OrderSide = 'yes' | 'no'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'open' | 'filled' | 'partial' | 'cancelled'

export interface TradingOrder {
  id: string
  marketId: string
  marketQuestion: string
  outcomeId?: string
  outcomeLabel?: string
  side: OrderSide
  type: OrderType
  price: number        // limit price (¢), 0 for market
  shares: number       // requested
  filledShares: number
  avgFillPrice: number
  status: OrderStatus
  createdAt: number    // timestamp
}

export interface Execution {
  price: number
  shares: number
}

export interface Position {
  id: string
  marketId: string
  marketQuestion: string
  outcomeId?: string
  outcomeLabel?: string
  side: OrderSide
  shares: number
  avgPrice: number
  totalCost: number
  currentPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  status: 'open' | 'closed' | 'settled'
  settlementResult?: 'yes' | 'no' | 'void'
  finalPnl?: number
}

export interface TradeRecord {
  id: string
  orderId: string
  marketId: string
  marketQuestion: string
  outcomeId?: string
  outcomeLabel?: string
  side: OrderSide
  price: number
  shares: number
  total: number
  timestamp: number
}

export interface BalanceState {
  available: number   // USDC
  inPositions: number
  inOrders: number
}

// ============ API Request/Response ============

export interface CreateOrderRequest {
  marketId: string
  outcomeId?: string
  side: OrderSide
  type: OrderType
  price?: number   // required for limit
  shares?: number  // required for limit
  total?: number   // alternative: spend this much
}

export interface CreateOrderResponse {
  order: TradingOrder
  executions: Execution[]
  position?: Position
}

export interface CancelOrderResponse {
  orderId: string
  refunded: number
}

export interface ClosePositionResponse {
  positionId: string
  executions: Execution[]
  realizedPnl: number
}

// ============ 选中状态 ============

export interface TradingSelection {
  marketId: string
  outcomeId?: string
  question: string
  outcomeLabel?: string
  side: OrderSide
  currentYesPrice: number
  currentNoPrice: number
}
