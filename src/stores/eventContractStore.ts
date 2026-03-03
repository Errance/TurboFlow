import { create } from 'zustand'
import type {
  ECAsset,
  ECBet,
  ECBetStatus,
  ECDirection,
  ECEffectsSettings,
  ECGlobalBet,
  ECGlobalSettlement,
  ECLeaderboardEntry,
  ECStreak,
  ECTimeIncrement,
} from '../types/eventContract'
import {
  EC_BASE_PAYOUTS,
  EC_INITIAL_BALANCE,
  EC_STRIKE_OFFSETS,
} from '../types/eventContract'
import { subscribe as subscribePriceEngine } from '../data/ecPriceEngine'
import {
  startMockEngine,
  stopMockEngine,
  onGlobalFeed,
  onGlobalSettlement,
  onLeaderboardUpdate,
  getLeaderboard,
} from '../data/ecMockPlayers'

const EC_DEMO_DURATION = 20 // seconds — all bets use this for demo; swap back to real durations later

interface EventContractState {
  currentAsset: ECAsset
  currentDuration: ECTimeIncrement
  currentPrices: Record<ECAsset, number>
  balance: number

  activeBets: ECBet[]
  settledBets: ECBet[]

  streak: ECStreak
  effects: ECEffectsSettings

  pendingReveal: ECBet | null
  revealQueue: ECBet[]

  // Whether we've shown the one-time "customize effects" hint
  effectsHintShown: boolean

  // Global social data
  globalFeed: ECGlobalBet[]
  globalSettlements: ECGlobalSettlement[]
  leaderboard: ECLeaderboardEntry[]

  // Timers for active bets
  _timers: Map<string, ReturnType<typeof setTimeout>>
  _priceUnsubs: (() => void)[]
  _mockUnsubs: (() => void)[]

  // Actions
  setAsset: (asset: ECAsset) => void
  setDuration: (d: ECTimeIncrement) => void
  placeBet: (direction: ECDirection, amount: number) => ECBet | null
  settleBet: (betId: string) => void
  processRevealQueue: () => void
  dismissReveal: () => void
  updateEffects: (settings: Partial<ECEffectsSettings>) => void
  markEffectsHintShown: () => void
  initPriceFeed: () => void
  initMockEngine: () => void
  dispose: () => void

  // Derived helpers
  getEstimatedPnl: (betId: string) => number
  getSortedActiveBets: () => ECBet[]
  getCurrentOdds: (duration?: ECTimeIncrement) => { higher: number; lower: number }
}

function calcOdds(
  currentPrice: number,
  baseOffset: number,
  basePayout: number,
): { higher: number; lower: number; strikeHigher: number; strikeLower: number } {
  const strikeHigher = currentPrice * (1 + baseOffset)
  const strikeLower = currentPrice * (1 - baseOffset)

  // Slightly adjust payout based on price drift from midpoint
  const drift = (Math.random() - 0.5) * 0.04
  const higher = Math.max(0.3, Math.min(0.95, basePayout + drift))
  const lower = Math.max(0.3, Math.min(0.95, basePayout - drift))

  return { higher, lower, strikeHigher, strikeLower }
}

let nextBetId = 1

export const useEventContractStore = create<EventContractState>((set, get) => ({
  currentAsset: 'BTC',
  currentDuration: 300,
  currentPrices: { BTC: 87000, ETH: 2050 },
  balance: EC_INITIAL_BALANCE,

  activeBets: [],
  settledBets: [],

  streak: { count: 0, type: null },
  effects: { settlementReveal: 'on', hypeMode: true },

  pendingReveal: null,
  revealQueue: [],

  effectsHintShown: false,

  globalFeed: [],
  globalSettlements: [],
  leaderboard: getLeaderboard(),

  _timers: new Map(),
  _priceUnsubs: [],
  _mockUnsubs: [],

  setAsset: (asset) => set({ currentAsset: asset }),

  setDuration: (d) => set({ currentDuration: d }),

  placeBet: (direction, amount) => {
    const state = get()
    if (amount < 5 || amount > 200 || amount > state.balance) return null

    const price = state.currentPrices[state.currentAsset]
    const offset = EC_STRIKE_OFFSETS[state.currentDuration]
    const basePayout = EC_BASE_PAYOUTS[state.currentDuration]
    const odds = calcOdds(price, offset, basePayout)

    const now = Date.now()
    const bet: ECBet = {
      id: `ecbet-${nextBetId++}`,
      roundId: `round-${now}`,
      asset: state.currentAsset,
      direction,
      amount,
      payout: direction === 'higher' ? odds.higher : odds.lower,
      strikePrice: direction === 'higher' ? odds.strikeHigher : odds.strikeLower,
      entryPrice: price,
      duration: state.currentDuration,
      status: 'active',
      createdAt: now,
      endsAt: now + EC_DEMO_DURATION * 1000,
    }

    const timer = setTimeout(() => {
      get().settleBet(bet.id)
    }, EC_DEMO_DURATION * 1000)

    set((s) => {
      s._timers.set(bet.id, timer)
      return {
        activeBets: [...s.activeBets, bet],
        balance: s.balance - amount,
      }
    })

    return bet
  },

  settleBet: (betId) => {
    const state = get()
    const bet = state.activeBets.find((b) => b.id === betId)
    if (!bet || bet.status !== 'active') return

    const settlementPrice = state.currentPrices[bet.asset]

    let won: boolean
    if (bet.direction === 'higher') {
      won = settlementPrice > bet.strikePrice
    } else {
      won = settlementPrice < bet.strikePrice
    }

    const pnl = won ? bet.amount * bet.payout : -bet.amount
    const newStatus: ECBetStatus = won ? 'won' : 'lost'

    const settledBet: ECBet = {
      ...bet,
      status: newStatus,
      settlementPrice,
      pnl,
    }

    // Update streak
    const prevStreak = state.streak
    let newStreak: ECStreak
    if (won) {
      if (prevStreak.type === 'win') {
        newStreak = { count: prevStreak.count + 1, type: 'win' }
      } else {
        newStreak = { count: 1, type: 'win' }
      }
    } else {
      if (prevStreak.type === 'lose') {
        newStreak = { count: prevStreak.count + 1, type: 'lose' }
      } else {
        newStreak = { count: 1, type: 'lose' }
      }
    }

    // Check for comeback (win after 3+ losses)
    const isComeback = won && prevStreak.type === 'lose' && prevStreak.count >= 3

    // Tag the bet for ceremony if applicable
    const taggedBet = {
      ...settledBet,
      _ceremony: (newStreak.type === 'win' && newStreak.count >= 3)
        ? 'streak' as const
        : isComeback
          ? 'comeback' as const
          : undefined,
      _streakCount: newStreak.count,
    }

    state._timers.delete(betId)

    const newBalance = won ? state.balance + bet.amount + pnl : state.balance

    set((s) => ({
      activeBets: s.activeBets.filter((b) => b.id !== betId),
      settledBets: [taggedBet, ...s.settledBets],
      revealQueue: [...s.revealQueue, taggedBet],
      streak: newStreak,
      balance: newBalance,
    }))

    // Auto-process reveal queue if nothing is currently showing
    if (!get().pendingReveal) {
      get().processRevealQueue()
    }
  },

  processRevealQueue: () => {
    const state = get()
    if (state.revealQueue.length === 0) {
      set({ pendingReveal: null })
      return
    }

    const [next, ...rest] = state.revealQueue
    set({ pendingReveal: next, revealQueue: rest })
  },

  dismissReveal: () => {
    set({ pendingReveal: null })
    // Small delay to allow animation out before next reveal in
    setTimeout(() => {
      get().processRevealQueue()
    }, 100)
  },

  updateEffects: (settings) =>
    set((s) => ({ effects: { ...s.effects, ...settings } })),

  markEffectsHintShown: () => set({ effectsHintShown: true }),

  initPriceFeed: () => {
    const unsub1 = subscribePriceEngine('BTC', (price) => {
      set((s) => ({ currentPrices: { ...s.currentPrices, BTC: price } }))
    })
    const unsub2 = subscribePriceEngine('ETH', (price) => {
      set((s) => ({ currentPrices: { ...s.currentPrices, ETH: price } }))
    })
    set({ _priceUnsubs: [unsub1, unsub2] })
  },

  initMockEngine: () => {
    const MAX_FEED = 50
    const SETTLEMENT_TTL = 5000

    const unsubFeed = onGlobalFeed((bet) => {
      set((s) => {
        const existing = s.globalFeed.findIndex((b) => b.id === bet.id)
        if (existing >= 0) {
          const updated = [...s.globalFeed]
          updated[existing] = bet
          return { globalFeed: updated }
        }
        return { globalFeed: [bet, ...s.globalFeed].slice(0, MAX_FEED) }
      })
    })

    const unsubSettlement = onGlobalSettlement((settlement) => {
      set((s) => ({
        globalSettlements: [...s.globalSettlements, settlement].slice(-6),
      }))
      setTimeout(() => {
        set((s) => ({
          globalSettlements: s.globalSettlements.filter((gs) => gs.id !== settlement.id),
        }))
      }, SETTLEMENT_TTL)
    })

    const unsubLeaderboard = onLeaderboardUpdate((lb) => {
      set({ leaderboard: lb })
    })

    set({ _mockUnsubs: [unsubFeed, unsubSettlement, unsubLeaderboard] })
    startMockEngine()
  },

  dispose: () => {
    const state = get()
    for (const unsub of state._priceUnsubs) unsub()
    for (const unsub of state._mockUnsubs) unsub()
    for (const timer of state._timers.values()) clearTimeout(timer)
    stopMockEngine()
    set({ _priceUnsubs: [], _mockUnsubs: [], _timers: new Map() })
  },

  // Derived
  getEstimatedPnl: (betId) => {
    const state = get()
    const bet = state.activeBets.find((b) => b.id === betId)
    if (!bet) return 0

    const currentPrice = state.currentPrices[bet.asset]
    let winning: boolean
    if (bet.direction === 'higher') {
      winning = currentPrice > bet.strikePrice
    } else {
      winning = currentPrice < bet.strikePrice
    }
    return winning ? bet.amount * bet.payout : -bet.amount
  },

  getSortedActiveBets: () => {
    const state = get()
    const now = Date.now()
    return [...state.activeBets].sort((a, b) => {
      const remainA = a.endsAt - now
      const remainB = b.endsAt - now
      const aUrgent = remainA <= 5000
      const bUrgent = remainB <= 5000
      if (aUrgent && !bUrgent) return -1
      if (!aUrgent && bUrgent) return 1
      return remainA - remainB
    })
  },

  getCurrentOdds: (duration) => {
    const state = get()
    const d = duration ?? state.currentDuration
    const price = state.currentPrices[state.currentAsset]
    const offset = EC_STRIKE_OFFSETS[d]
    const basePayout = EC_BASE_PAYOUTS[d]
    const odds = calcOdds(price, offset, basePayout)
    return { higher: odds.higher, lower: odds.lower }
  },
}))
