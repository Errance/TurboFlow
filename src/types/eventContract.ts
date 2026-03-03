// ============================================================
// Events Contract (Now) — Independent type system
// Does NOT touch or depend on types/index.ts
// ============================================================

export type ECTimeIncrement = 60 | 300 | 900 // 1min / 5min / 15min (seconds)

export type ECDirection = 'higher' | 'lower'

export type ECAsset = 'BTC' | 'ETH'

export type ECBetStatus = 'active' | 'settling' | 'won' | 'lost'

export interface ECRound {
  id: string
  asset: ECAsset
  duration: ECTimeIncrement
  strikeHigher: number
  strikeLower: number
  basePrice: number
  startedAt: number
  endsAt: number
  higherPayout: number
  lowerPayout: number
}

export interface ECBet {
  id: string
  roundId: string
  asset: ECAsset
  direction: ECDirection
  amount: number
  payout: number
  strikePrice: number
  entryPrice: number
  duration: ECTimeIncrement
  status: ECBetStatus
  createdAt: number
  endsAt: number
  settlementPrice?: number
  pnl?: number
}

export interface ECEffectsSettings {
  settlementReveal: 'on' | 'minimal' | 'off'
  hypeMode: boolean
}

export interface ECStreak {
  count: number
  type: 'win' | 'lose' | null
}

// Strike offset percentages by time increment
export const EC_STRIKE_OFFSETS: Record<ECTimeIncrement, number> = {
  60: 0.0015,   // ±0.15%
  300: 0.004,   // ±0.4%
  900: 0.008,   // ±0.8%
}

// Base payout rates by time increment
export const EC_BASE_PAYOUTS: Record<ECTimeIncrement, number> = {
  60: 0.65,
  300: 0.72,
  900: 0.78,
}

export const EC_ASSETS: ECAsset[] = ['BTC', 'ETH']

export const EC_TIME_OPTIONS: { id: string; label: string; value: ECTimeIncrement }[] = [
  { id: '1min', label: '1min', value: 60 },
  { id: '5min', label: '5min', value: 300 },
  { id: '15min', label: '15min', value: 900 },
]

export const EC_MIN_BET = 5
export const EC_MAX_BET = 200

export const EC_INITIAL_BALANCE = 10000

export const EC_ASSET_DECIMALS: Record<ECAsset, number> = {
  BTC: 2,
  ETH: 2,
}
