/**
 * 我的投注（MyBets）store。
 *
 * 责任：
 * - 持有历史 + 进行中注单
 * - add / update / remove / cashout / correct 原子操作
 * - 按状态、日期范围筛选与分页
 * - CSV 导出
 * - 注入 seed：把现有 mockData.myBets 迁移到新 schema（补齐 status/placedAt/betCode/...）
 *
 * 持久化 key：tf_mybets
 *
 * Cash Out 与结算动作和 walletStore 解耦：调用者负责同步 credit / deduct，
 * 这样 store 责任单一，便于 Phase 3/5 的集成测试单点注入。
 */

import { create } from 'zustand'
import type { BetType, MyBetItem, MyBetLeg, MyBetStatus, SettlementResult } from '../data/soccer/types'
import { myBets as seedBets } from '../data/soccer/mockData'
import { attachPersist, loadState } from './persist'
import { useSoccerBetSlipStore } from './soccerBetSlipStore'
import { getOdds, makeSelectionKey } from '../services/oddsRegistry'
import { useWalletStore } from './walletStore'

const STORAGE_KEY = 'tf_mybets'

interface MyBetsState {
  bets: MyBetItem[]
  add: (bet: MyBetItem) => void
  update: (id: string, patch: Partial<MyBetItem>) => void
  remove: (id: string) => void
  cashout: (id: string, price: number) => boolean
  settle: (id: string, result: SettlementResult) => boolean
  /** 返回 CSV 文本（由调用方触发下载） */
  exportCsv: () => string
  /** 把指定注单的 legs 推回投注单（重投） */
  duplicateToSlip: (id: string) => boolean

  // --- selectors ---
  selectByStatus: (status: MyBetStatus | 'all' | 'unsettled' | 'settled_any') => MyBetItem[]
  selectByDateRange: (fromIsoOrNull: string | null, toIsoOrNull: string | null) => MyBetItem[]
  paginate: (list: MyBetItem[], offset: number, limit: number) => MyBetItem[]
}

const UNSETTLED_STATUSES = new Set<MyBetStatus>(['pending', 'placed', 'live'])

function stakeOf(bet: MyBetItem): number {
  return bet.stake ?? bet.amount ?? 0
}

function payoutForResult(bet: MyBetItem, result: SettlementResult): number {
  const stake = stakeOf(bet)
  const fullReturn = bet.potentialReturn ?? stake * bet.odds
  const profit = Math.max(0, fullReturn - stake)
  if (result === 'win') return fullReturn
  if (result === 'push' || result === 'void') return stake
  if (result === 'half_win') return stake + profit / 2
  if (result === 'half_loss') return stake / 2
  if (result === 'dead_heat') return fullReturn / 2
  return 0
}

/**
 * 把旧 schema（amount/payout/result）迁移到新 schema，并追加若干特殊状态示例：
 * - 1 条 live 串单含 1 腿 push：展示重算赔率
 * - 1 条 placed：可 Cash Out
 *
 * placedAt 全部分散在过去 72h 内，便于"今天 / 7 天 / 30 天"筛选演示。
 */
function migrateSeed(): MyBetItem[] {
  const now = Date.now()
  const migrated: MyBetItem[] = seedBets.map((b, idx) => {
    const placedAt = new Date(now - (idx + 1) * 1000 * 60 * 60 * 6).toISOString()
    const settledAt = new Date(now - (idx + 1) * 1000 * 60 * 60 * 3).toISOString()
    const leg: MyBetLeg = {
      id: `${b.id}-leg-1`,
      matchId: 'seed',
      matchLabel: b.matchLabel,
      marketTitle: b.marketTitle,
      selection: b.selection,
      oddsAtPlacement: b.odds,
      status: 'settled',
      result: b.result,
    }
    return {
      ...b,
      status: 'settled',
      settlementResult: b.result,
      placedAt,
      settledAt,
      betCode: `TF-SEED-${String(idx + 1).padStart(4, '0')}`,
      betType: 'multi_single',
      legs: [leg],
      stake: b.amount,
      currency: 'USDT',
      potentialReturn: b.amount * b.odds,
      potentialProfit: b.amount * b.odds - b.amount,
    }
  })

  // live 串单含 1 腿 push（重算后赔率从 2.1 * 1.9 * 1.8 = 7.18 变为 2.1 * 1.0 * 1.8 = 3.78）
  const pushLive: MyBetItem = {
    id: 'seed-live-push',
    matchLabel: '3 腿串关',
    marketTitle: '串关注单',
    selection: '利物浦 / 退本腿 / 阿森纳',
    odds: 7.18,
    amount: 50,
    result: 'win',
    payout: 0,
    status: 'live',
    placedAt: new Date(now - 1000 * 60 * 45).toISOString(),
    betCode: 'TF-SEED-LIVE',
    betType: 'accumulator',
    currency: 'USDT',
    stake: 50,
    potentialReturn: 50 * 3.78,
    potentialProfit: 50 * 3.78 - 50,
    legs: [
      {
        id: 'seed-live-push-l1',
        matchId: 'seed',
        matchLabel: '利物浦 vs 曼城',
        marketTitle: '胜平负',
        selection: '利物浦',
        oddsAtPlacement: 2.1,
        status: 'live',
      },
      {
        id: 'seed-live-push-l2',
        matchId: 'seed',
        matchLabel: '瓦斯科达伽马 vs 米内罗竞技',
        marketTitle: '亚洲让分盘',
        selection: '瓦斯科达伽马 -0.5',
        oddsAtPlacement: 1.9,
        oddsAfterRecalc: 1.0,
        status: 'settled',
        result: 'push',
      },
      {
        id: 'seed-live-push-l3',
        matchId: 'seed',
        matchLabel: '阿森纳 vs 切尔西',
        marketTitle: '两队都得分',
        selection: '是',
        oddsAtPlacement: 1.8,
        status: 'live',
      },
    ],
  }

  // placed：支持 CashOut
  const placed: MyBetItem = {
    id: 'seed-placed',
    matchLabel: '拜仁慕尼黑 vs 多特蒙德',
    marketTitle: '胜平负',
    selection: '拜仁慕尼黑',
    odds: 1.85,
    amount: 100,
    result: 'win',
    payout: 0,
    status: 'placed',
    placedAt: new Date(now - 1000 * 60 * 15).toISOString(),
    betCode: 'TF-SEED-PLCD',
    betType: 'multi_single',
    currency: 'USDT',
    stake: 100,
    potentialReturn: 185,
    potentialProfit: 85,
    legs: [
      {
        id: 'seed-placed-l1',
        matchId: 'seed',
        matchLabel: '拜仁慕尼黑 vs 多特蒙德',
        marketTitle: '胜平负',
        selection: '拜仁慕尼黑',
        oddsAtPlacement: 1.85,
        status: 'placed',
      },
    ],
  }

  return [placed, pushLive, ...migrated]
}

const persisted = loadState<{ bets: MyBetItem[] }>(STORAGE_KEY)

function restoreBets(bets: MyBetItem[] | undefined): MyBetItem[] | null {
  if (!bets) return null
  return bets.map((bet) => {
    if ((bet.status === 'placed' || bet.status === 'live') && bet.cashout) {
      return {
        ...bet,
        cashout: {
          ...bet.cashout,
          needsRequote: true,
        },
      }
    }
    return bet
  })
}

const restoredBets = restoreBets(persisted?.bets)

export const useMyBetsStore = create<MyBetsState>((set, get) => ({
  bets: restoredBets ?? migrateSeed(),

  add: (bet) => {
    set((s) => ({ bets: sortByPlacedAtDesc([...s.bets, bet]) }))
  },

  update: (id, patch) => {
    set((s) => ({
      bets: s.bets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }))
  },

  remove: (id) => {
    set((s) => ({ bets: s.bets.filter((b) => b.id !== id) }))
  },

  cashout: (id, price) => {
    if (!Number.isFinite(price) || price <= 0) return false
    const bet = get().bets.find((b) => b.id === id)
    if (!bet || !UNSETTLED_STATUSES.has(bet.status ?? 'settled')) return false
    const wallet = useWalletStore.getState()
    wallet.releaseLocked(stakeOf(bet))
    wallet.credit(price)
    set((s) => ({
      bets: s.bets.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'cashed_out',
              settledAt: new Date().toISOString(),
              potentialReturn: price,
              payout: price,
            }
          : b,
      ),
    }))
    return true
  },

  settle: (id, result) => {
    const bet = get().bets.find((b) => b.id === id)
    if (!bet || !UNSETTLED_STATUSES.has(bet.status ?? 'settled')) return false
    const payout = +payoutForResult(bet, result).toFixed(2)
    const wallet = useWalletStore.getState()
    wallet.releaseLocked(stakeOf(bet))
    if (payout > 0) wallet.credit(payout)
    set((s) => ({
      bets: s.bets.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'settled',
              settledAt: new Date().toISOString(),
              settlementResult: result,
              result: result === 'loss' ? 'loss' : result === 'win' ? 'win' : 'push',
              payout,
              potentialReturn: payout,
              potentialProfit: +(payout - stakeOf(b)).toFixed(2),
              legs: b.legs?.map((leg) => ({ ...leg, status: 'settled', result })),
            }
          : b,
      ),
    }))
    return true
  },

  exportCsv: () => {
    const header = ['betCode', 'placedAt', 'betType', 'stake', 'totalOdds', 'status', 'result', 'payout'].join(',')
    const rows = get().bets.map((b) => {
      const stake = b.stake ?? b.amount ?? 0
      const payout = b.payout ?? 0
      const totalOdds = stake > 0 ? (b.potentialReturn ?? b.odds * stake) / stake : b.odds
      const status = b.status ?? 'settled'
      const result = b.settlementResult ?? b.result ?? ''
      const placedAt = b.placedAt ?? ''
      const betCode = b.betCode ?? b.id
      return [betCode, placedAt, b.betType ?? 'multi_single', stake.toFixed(2), totalOdds.toFixed(2), status, result, payout.toFixed(2)].join(',')
    })
    return [header, ...rows].join('\n')
  },

  selectByStatus: (status) => {
    const all = get().bets
    if (status === 'all') return all
    if (status === 'unsettled') return all.filter((b) => b.status === 'placed' || b.status === 'live' || b.status === 'pending')
    if (status === 'settled_any') return all.filter((b) => b.status === 'settled' || b.status === 'cashed_out')
    return all.filter((b) => (b.status ?? 'settled') === status)
  },

  selectByDateRange: (fromIsoOrNull, toIsoOrNull) => {
    return get().bets.filter((b) => {
      if (!b.placedAt) return false
      if (fromIsoOrNull && b.placedAt < fromIsoOrNull) return false
      if (toIsoOrNull && b.placedAt > toIsoOrNull) return false
      return true
    })
  },

  paginate: (list, offset, limit) => list.slice(offset, offset + limit),

  duplicateToSlip: (id) => {
    const bet = get().bets.find((b) => b.id === id)
    if (!bet || !bet.legs || bet.legs.length === 0) return false
    const inputs = bet.legs.map((leg) => {
      const currentOdds = getOdds(makeSelectionKey(leg.matchId, leg.marketTitle, leg.selection))
      return {
        matchId: leg.matchId,
        matchLabel: leg.matchLabel,
        marketTitle: leg.marketTitle,
        selection: leg.selection,
        odds: currentOdds ?? leg.oddsAtPlacement,
        quoteState: currentOdds ? ('fresh' as const) : ('needs_refresh' as const),
      }
    })
    const betType: BetType = bet.betType === 'accumulator' ? 'accumulator' : 'multi_single'
    return useSoccerBetSlipStore.getState().replaceWithItems(inputs, betType).ok
  },
}))

function sortByPlacedAtDesc(bets: MyBetItem[]): MyBetItem[] {
  return [...bets].sort((a, b) => {
    const aAt = a.placedAt ?? ''
    const bAt = b.placedAt ?? ''
    if (aAt === bAt) return 0
    return aAt < bAt ? 1 : -1
  })
}

attachPersist(useMyBetsStore, STORAGE_KEY, (s) => ({ bets: s.bets }))
