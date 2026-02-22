// ============================================================
// V2 Event-centric types
// ============================================================

export type EventType = 'standard' | 'multi-option' | 'sports' | 'instant'
export type OutcomeModel = 'independent' | 'mutually-exclusive'

export type EventStatus = 'OPEN' | 'CLOSED' | 'RESOLVING' | 'SETTLED' | 'CANCELLED' | 'VOIDED'
export type EventSubStatus = 'normal' | 'paused' | 'disputed' | 'delayed' | 'emergency'

export type EventAction =
  | 'appeal'
  | 'view_dispute'
  | 'request_settle'
  | 'report_issue'
  | 'view_refund'
  | 'view_evidence'

export interface EventStatusInfo {
  status: EventStatus
  subStatus: EventSubStatus
  reason: string
  reasonDetail?: string
  actionAvailable?: EventAction[]
  updatedAt: string
}

export interface EventTimeline {
  openDate: string
  closeDate: string
  expectedSettleWindow?: string
  settledDate?: string
}

export interface IncentiveTag {
  type: 'volume_bonus' | 'liquidity_reward' | 'new_market'
  label: string
}

export interface TeamInfo {
  name: string
  abbreviation: string
  record?: string
  logoUrl?: string
}

export interface SportsMetadata {
  sport: string
  league: string
  subLeague?: string
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  gameTime: string
  status: 'scheduled' | 'live' | 'final'
  score?: { home: number; away: number }
}

export type ContractStatus = 'OPEN' | 'CLOSED' | 'RESOLVING' | 'SETTLED' | 'CANCELLED' | 'VOIDED'

export interface Contract {
  id: string
  eventId: string
  label: string
  type?: 'binary' | 'moneyline' | 'spread' | 'total'
  status: ContractStatus
  yesPrice: number       // 0.01–0.99 USDC
  noPrice: number
  probability: number    // display percentage 0–100
  change24h: number      // percentage points
  volume: number         // USDC
  expiresAt: string
  settlementResult?: 'YES' | 'NO'
  payoutPerShare: number // typically 1 USDC
}

export type AssetClass = 'crypto' | 'stocks' | 'commodities' | 'forex'

export interface InstantMarketMeta {
  asset: string
  assetIcon?: string
  assetClass: AssetClass
  currentPrice: number
  strikePrice: number
  direction: 'UP' | 'DOWN'
  durationSeconds: number
  startedAt: string
  endsAt: string
}

export interface HedgeHint {
  label: string
  asset: string
  action: string
}

export interface PredictionEvent {
  id: string
  type: EventType
  outcomeModel: OutcomeModel
  title: string
  description: string
  category: string
  tags: string[]
  status: EventStatus
  statusInfo: EventStatusInfo
  imageUrl?: string
  rulesMeasurement: string
  rulesClosing: string
  resolutionSource: string
  rulesDetail?: string
  timeline: EventTimeline
  contracts: Contract[]
  totalVolume: number    // USDC
  featured?: boolean
  incentive?: IncentiveTag
  sports?: SportsMetadata
  instant?: InstantMarketMeta
  summary?: string
  keyPoints?: string[]
  hedgeHints?: HedgeHint[]
}

// ============================================================
// Forecast (user-generated prediction card)
// ============================================================

export interface Forecast {
  id: string
  eventId: string
  contractId: string
  eventTitle: string
  contractLabel: string
  side: 'YES' | 'NO'
  price: number
  shares: number
  comment: string
  outcomeModel: OutcomeModel
  eventStatus: EventStatus
  createdAt: string
}

// ============================================================
// V1 backward-compatible types (used by CLOB / Portfolio / Orders)
// ============================================================

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

// === Strategy / Basket / Trench ===

export interface StrategyLeg {
  id: string
  contractId: string
  side: OrderSide
  weight: number // relative weight, usually normalized to 0..1 and sums to 1
  entryPrice?: number // used by copied instances to track entry reference
  note?: string
}

export interface StrategyTemplate {
  id: string
  title: string
  createdBy: string
  createdAt: string
  updatedAt: string
  basketId: string // deterministic signature: sorted(contractId:side)
  driverEventId?: string
  legs: StrategyLeg[]
  thesis?: string
  tags: string[]
  copyCount: number
}

export interface StrategyInstance {
  id: string
  templateId: string
  basketId: string
  userName: string
  notional: number
  legs: StrategyLeg[]
  createdAt: string
  updatedAt: string
}

export type TrenchStance = 'support' | 'oppose' | 'adjust'

export interface TrenchMessage {
  id: string
  basketId: string
  author: string
  body: string
  stance: TrenchStance
  votes: number
  createdAt: string
}
