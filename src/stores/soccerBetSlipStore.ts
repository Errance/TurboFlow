import { create } from 'zustand'
import type { BetSlipItem, BetType, MyBetLeg } from '../data/soccer/types'
import type { BetRejectReason, BetSubmissionResult } from '../data/soccer/contracts'
import { canCombine, getMarketFamily, type MarketFamily } from '../data/soccer/marketFamily'
import { useToastStore } from './toastStore'
import { useWalletStore } from './walletStore'
import { useMyBetsStore } from './myBetsStore'
import { attachPersist, loadState } from './persist'
import { BETTING_LIMITS } from '../data/soccer/contracts'
import { rejectMessage } from '../utils/betRejectMessages'
import { generateBetCode } from '../utils/betCode'

/**
 * 足球投注单全局 store。
 *
 * 责任：
 * - 持有跨场（cross-match）投注单 items
 * - 维护选项的增删（含相关性校验）
 * - 暴露按场分组的派生视图
 * - 在比赛状态变化（void / suspended / ended）时被动清理
 * - 跟踪赔率快照（oddsAtAdd）与当前赔率（oddsCurrent），供二次确认判定
 * - 维护 betType（多笔单注 / 串关）
 *
 * 与 parlayStore（Events 串单）严格分离：
 * - parlayStore 服务 YES/NO 合约市场（0~1 价格）
 * - 本 store 服务欧洲小数赔率（≥1.01）
 */

export interface ExtendedBetSlipItem extends BetSlipItem {
  /** 由 marketTitle 推断，用于相关性冲突校验 */
  marketFamily: MarketFamily
  /** 加入时间戳，用于排序与过期判断 */
  addedAt: number
  /** 加入投注单时用户看到的赔率快照 */
  oddsAtAdd: number
  /** 最新赔率（ticker 刷新） */
  oddsCurrent: number
  /** 锁定窗口到期时间戳（ms）；过期后 stale，需要在二次确认中重新接受 */
  oddsLockedUntil?: number
  /** 从持久化恢复或重投回填的报价需要用户重新确认 */
  quoteState?: 'fresh' | 'needs_refresh'
}

export interface ToggleInput {
  matchId: string
  matchLabel: string
  marketTitle: string
  selection: string
  odds: number
  quoteState?: 'fresh' | 'needs_refresh'
}

export type ToggleResult =
  | { ok: true; action: 'added' | 'removed' | 'replaced' }
  | { ok: false; reason: string }

interface SoccerBetSlipState {
  items: ExtendedBetSlipItem[]
  slipOpen: boolean
  /** 投注类型（多笔单注 / 串关） */
  betType: BetType
  /** 下单提交中标志 */
  submitting: boolean

  toggleItem: (input: ToggleInput) => ToggleResult
  replaceWithItems: (inputs: ToggleInput[], betType?: BetType) => ToggleResult
  removeById: (id: string) => void
  removeByMatchTitle: (matchId: string, marketTitle: string) => void
  clearMatch: (matchId: string) => void
  clearAll: () => void
  purgeVoid: (matchId: string, voidMarketTitles: Set<string>) => void

  /** 更新某 item 当前赔率（由 oddsTicker 调用） */
  refreshOdds: (itemId: string, newOdds: number) => void
  /** 把某 item 的 oddsAtAdd 更新为 oddsCurrent（用户点「接受变化」） */
  acceptOddsChange: (itemId: string) => void
  /** 批量接受所有已变动的赔率 */
  acceptAllOddsChanges: () => void

  setBetType: (type: BetType) => void
  setSubmitting: (value: boolean) => void

  /**
   * 核心下单入口：12 步校验 + 扣款 + 写 MyBets。
   *
   * ctx 提供环境相关信息（suspended 盘口、已结束比赛），由 UI 层注入以避免
   * store 直接依赖 mockData / 路由。
   *
   * 返回 BetSubmissionResult：ok=true 带 betCode；ok=false 带 reason。
   * 拒单时 UI 层应按 reason 通过 toast 反馈（store 内部也已写入 toast）。
   */
  placeBet: (
    stake: number,
    ctx?: {
      suspendedSelectionKeys?: Set<string>
      endedMatchIds?: Set<string>
    },
  ) => Promise<BetSubmissionResult>

  openSlip: () => void
  closeSlip: () => void
  toggleSlipOpen: () => void

  getItemsByMatch: (matchId: string) => ExtendedBetSlipItem[]
  getSelectedKeys: (matchId: string) => Set<string>

  // --- derived 快照 getters（UI 可调用但不订阅） ---
  /** 多笔单注 / 串关腿数是否满足 BETTING_LIMITS 要求 */
  isParlayValid: () => boolean
  /** 累计赔率（所有 items 的 oddsCurrent 乘积） */
  totalOdds: () => number
  /** 给定 stake 的预期返还 */
  potentialReturn: (stake: number) => number
  /** 是否存在任一 item 的赔率与加入时不同 */
  hasOddsChanged: () => boolean
}

const STORAGE_KEY = 'tf_soccer_betslip'

interface PersistedSlip {
  items: ExtendedBetSlipItem[]
  betType: BetType
}

function makeId(matchId: string, marketTitle: string, selection: string): string {
  return `${matchId}|${marketTitle}|${selection}`
}

function findSameMatchConflict(items: ExtendedBetSlipItem[]) {
  const byMatch = new Map<string, ExtendedBetSlipItem[]>()
  for (const item of items) {
    const group = byMatch.get(item.matchId) ?? []
    group.push(item)
    byMatch.set(item.matchId, group)
  }

  for (const group of byMatch.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].marketTitle === group[j].marketTitle) continue
        const verdict = canCombine(group[i].marketFamily, group[j].marketFamily)
        if (!verdict.ok) return { left: group[i], right: group[j], reason: verdict.reason }
      }
    }
  }

  return null
}

const persisted = loadState<PersistedSlip>(STORAGE_KEY)

function restoreItems(items: ExtendedBetSlipItem[] | undefined): ExtendedBetSlipItem[] {
  if (!items) return []
  return items.map((it) => ({
    ...it,
    marketFamily: getMarketFamily(it.marketTitle),
    oddsAtAdd: it.oddsCurrent ?? it.oddsAtAdd ?? it.odds,
    oddsCurrent: it.oddsCurrent ?? it.odds,
    oddsLockedUntil: undefined,
    quoteState: 'needs_refresh',
  }))
}

const restoredItems = restoreItems(persisted?.items)

export const useSoccerBetSlipStore = create<SoccerBetSlipState>((set, get) => ({
  items: restoredItems,
  slipOpen: false,
  betType: persisted?.betType === 'accumulator' ? 'accumulator' : 'multi_single',
  submitting: false,

  toggleItem: (input) => {
    const { matchId, matchLabel, marketTitle, selection, odds } = input
    const id = makeId(matchId, marketTitle, selection)
    const family = getMarketFamily(marketTitle)
    const addToast = useToastStore.getState().addToast
    const prev = get().items

    // 1) id 已存在 → 取消选择
    if (prev.some((it) => it.id === id)) {
      const next = prev.filter((it) => it.id !== id)
      set({
        items: next,
        betType: get().betType === 'accumulator' && next.length <= 1 ? 'multi_single' : get().betType,
      })
      return { ok: true, action: 'removed' }
    }

    // 2) 同 matchId + 同 marketTitle 的既有 item → 替换（盘口内部天然互斥）
    const sameMarketIdx = prev.findIndex(
      (it) => it.matchId === matchId && it.marketTitle === marketTitle,
    )

    // 3) 多笔单注彼此独立，只有当前处于串关模式时才需要同场相关性校验
    if (get().betType === 'accumulator' && sameMarketIdx === -1) {
      for (const existing of prev) {
        if (existing.matchId !== matchId) continue
        if (existing.marketTitle === marketTitle) continue
        const verdict = canCombine(family, existing.marketFamily)
        if (!verdict.ok) {
          addToast({
            type: 'error',
            message: `无法同场串关：${marketTitle} 与 ${existing.marketTitle}。${verdict.reason}`,
          })
          return { ok: false, reason: verdict.reason }
        }
      }
    }

    const now = Date.now()
    const newItem: ExtendedBetSlipItem = {
      id,
      matchId,
      matchLabel,
      marketTitle,
      selection,
      odds,
      marketFamily: family,
      addedAt: now,
      oddsAtAdd: odds,
      oddsCurrent: odds,
      oddsLockedUntil:
        input.quoteState === 'needs_refresh'
          ? undefined
          : now + BETTING_LIMITS.oddsLockSeconds * 1000,
      quoteState: input.quoteState ?? 'fresh',
    }

    if (sameMarketIdx >= 0) {
      const next = [...prev]
      next.splice(sameMarketIdx, 1, newItem)
      set({ items: next })
      return { ok: true, action: 'replaced' }
    }

    const prevBetType = get().betType
    const nextBetType = prevBetType === 'accumulator' ? 'accumulator' : 'multi_single'
    set({ items: [...prev, newItem], betType: nextBetType })
    return { ok: true, action: 'added' }
  },

  replaceWithItems: (inputs, nextBetType = inputs.length > 1 ? 'accumulator' : 'multi_single') => {
    if (inputs.length === 0) return { ok: false, reason: '没有可加入投注单的选项' }

    const addToast = useToastStore.getState().addToast
    const now = Date.now()
    const next: ExtendedBetSlipItem[] = inputs.map((input) => {
      const family = getMarketFamily(input.marketTitle)
      return {
        id: makeId(input.matchId, input.marketTitle, input.selection),
        matchId: input.matchId,
        matchLabel: input.matchLabel,
        marketTitle: input.marketTitle,
        selection: input.selection,
        odds: input.odds,
        marketFamily: family,
        addedAt: now,
        oddsAtAdd: input.odds,
        oddsCurrent: input.odds,
        oddsLockedUntil:
          input.quoteState === 'needs_refresh'
            ? undefined
            : now + BETTING_LIMITS.oddsLockSeconds * 1000,
        quoteState: input.quoteState ?? 'fresh',
      }
    })

    if (nextBetType === 'accumulator') {
      const conflict = findSameMatchConflict(next)
      if (conflict) {
        addToast({
          type: 'error',
          message: `无法重投为串关：${conflict.left.marketTitle} 与 ${conflict.right.marketTitle} 不可同场串关`,
        })
        return { ok: false, reason: conflict.reason }
      }
    }

    set({
      items: next,
      betType: nextBetType,
      slipOpen: true,
    })
    return { ok: true, action: 'added' }
  },
  removeById: (id) => {
    const next = get().items.filter((it) => it.id !== id)
    set({
      items: next,
      betType: get().betType === 'accumulator' && next.length <= 1 ? 'multi_single' : get().betType,
    })
  },

  removeByMatchTitle: (matchId, marketTitle) => {
    const next = get().items.filter(
      (it) => !(it.matchId === matchId && it.marketTitle === marketTitle),
    )
    set({
      items: next,
      betType: get().betType === 'accumulator' && next.length <= 1 ? 'multi_single' : get().betType,
    })
  },

  clearMatch: (matchId) => {
    const next = get().items.filter((it) => it.matchId !== matchId)
    set({
      items: next,
      betType: get().betType === 'accumulator' && next.length <= 1 ? 'multi_single' : get().betType,
    })
  },

  clearAll: () => set({ items: [], slipOpen: false, betType: 'multi_single' }),

  purgeVoid: (matchId, voidMarketTitles) => {
    if (voidMarketTitles.size === 0) return
    const prev = get().items
    const next = prev.filter(
      (it) => !(it.matchId === matchId && voidMarketTitles.has(it.marketTitle)),
    )
    if (next.length !== prev.length) {
      set({
        items: next,
        betType: get().betType === 'accumulator' && next.length <= 1 ? 'multi_single' : get().betType,
      })
    }
  },

  refreshOdds: (itemId, newOdds) => {
    set({
      items: get().items.map((it) =>
        it.id === itemId ? { ...it, oddsCurrent: +newOdds.toFixed(2) } : it,
      ),
    })
  },

  acceptOddsChange: (itemId) => {
    const now = Date.now()
    set({
      items: get().items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              oddsAtAdd: it.oddsCurrent,
              oddsLockedUntil: now + BETTING_LIMITS.oddsLockSeconds * 1000,
              quoteState: 'fresh',
            }
          : it,
      ),
    })
  },

  acceptAllOddsChanges: () => {
    const now = Date.now()
    set({
      items: get().items.map((it) => ({
        ...it,
        oddsAtAdd: it.oddsCurrent,
        oddsLockedUntil: now + BETTING_LIMITS.oddsLockSeconds * 1000,
        quoteState: 'fresh',
      })),
    })
  },

  setBetType: (type) => set({ betType: type }),
  setSubmitting: (value) => set({ submitting: value }),

  openSlip: () => set({ slipOpen: true }),
  closeSlip: () => set({ slipOpen: false }),
  toggleSlipOpen: () => set({ slipOpen: !get().slipOpen }),

  getItemsByMatch: (matchId) => get().items.filter((it) => it.matchId === matchId),

  getSelectedKeys: (matchId) => {
    const keys = new Set<string>()
    for (const it of get().items) {
      if (it.matchId === matchId) keys.add(`${it.marketTitle}|${it.selection}`)
    }
    return keys
  },

  isParlayValid: () => {
    const { items, betType } = get()
    const len = items.length
    if (len === 0) return false
    if (len > BETTING_LIMITS.maxLegs) return false
    const min = BETTING_LIMITS.minLegs[betType]
    return len >= min
  },

  totalOdds: () => {
    const items = get().items
    if (items.length === 0) return 0
    return items.reduce((acc, it) => acc * it.oddsCurrent, 1)
  },

  potentialReturn: (stake) => {
    if (!Number.isFinite(stake) || stake <= 0) return 0
    const { betType, items } = get()
    if (betType === 'multi_single') {
      return +items.reduce((sum, item) => sum + stake * item.oddsCurrent, 0).toFixed(2)
    }
    return +(stake * get().totalOdds()).toFixed(2)
  },

  hasOddsChanged: () => {
    return get().items.some((it) => it.oddsCurrent !== it.oddsAtAdd)
  },

  placeBet: async (stake, ctx) => {
    const state = get()

    // 双击保护：提交中直接拒绝后续请求
    if (state.submitting) {
      return { ok: false, reason: 'rate_limited' }
    }

    const addToast = useToastStore.getState().addToast
    const reject = (reason: BetRejectReason): BetSubmissionResult => {
      addToast({ type: 'error', message: rejectMessage(reason) })
      return { ok: false, reason }
    }

    // 1. 幂等键（即便失败也占位，便于日志回溯）
    const idempotencyKey =
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `bet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const wallet = useWalletStore.getState()
    const items = state.items
    const betType = state.betType

    // 2. 金额校验
    if (!Number.isFinite(stake) || stake < BETTING_LIMITS.minStake) return reject('stake_below_min')
    if (stake > BETTING_LIMITS.maxStake) return reject('stake_above_max')

    // 3. 腿数校验
    const minLegs = BETTING_LIMITS.minLegs[betType]
    if (items.length < minLegs) return reject('legs_too_few')
    if (items.length > BETTING_LIMITS.maxLegs) return reject('legs_too_many')

    const currentTotalOdds = items.reduce((acc, it) => acc * it.oddsCurrent, 1)
    const totalStake = betType === 'multi_single' ? +(stake * items.length).toFixed(2) : stake

    // 4. 余额校验
    if (!wallet.canAfford(totalStake)) return reject('balance_insufficient')

    // 5. 相关性校验只适用于串关；多笔单注独立生成注单，不互相组合。
    if (betType === 'accumulator') {
      const conflict = findSameMatchConflict(items)
      if (conflict) {
        addToast({
          type: 'error',
          message: `${conflict.left.marketTitle} 与 ${conflict.right.marketTitle} 不可同场串关`,
        })
        return { ok: false, reason: 'conflict_detected' }
      }
    }

    const potentialReturn = betType === 'multi_single'
      ? +items.reduce((sum, it) => sum + stake * it.oddsCurrent, 0).toFixed(2)
      : +(stake * currentTotalOdds).toFixed(2)
    if (potentialReturn > BETTING_LIMITS.maxReturn) return reject('payout_above_cap')

    // 7. 盘口/比赛状态
    const suspended = ctx?.suspendedSelectionKeys
    const ended = ctx?.endedMatchIds
    if (suspended && suspended.size > 0) {
      for (const it of items) {
        if (suspended.has(it.id) || suspended.has(`${it.matchId}|${it.marketTitle}`)) {
          return reject('market_closed')
        }
      }
    }
    if (ended && ended.size > 0) {
      for (const it of items) {
        if (ended.has(it.matchId)) return reject('match_not_available')
      }
    }

    // 8. 报价有效期与赔率变动（需要先在二次确认弹窗内接受）
    const now = Date.now()
    const expired = items.filter(
      (it) => it.quoteState === 'needs_refresh' || !it.oddsLockedUntil || it.oddsLockedUntil <= now,
    )
    if (expired.length > 0) return reject('odds_expired')

    const changed = items.filter((it) => it.oddsCurrent !== it.oddsAtAdd)
    if (changed.length > 0) return reject('odds_changed')

    // 9. loading
    set({ submitting: true })

    // 10. mock 200ms + 5% 网络失败
    await new Promise((r) => setTimeout(r, 200))
    if (Math.random() < 0.05) {
      set({ submitting: false })
      return reject('network_error')
    }

    // 11. 扣款 + 写 MyBets + 清空 + toast
    const deducted = wallet.deduct(totalStake)
    if (!deducted) {
      // 边缘场景：期间被其他请求扣走（demo 不会出现，但兜底）
      set({ submitting: false })
      return reject('balance_insufficient')
    }

    const placedAt = new Date().toISOString()
    const myBets = useMyBetsStore.getState()
    const betCodes: string[] = []

    if (betType === 'multi_single') {
      items.forEach((it, index) => {
        const betCode = generateBetCode()
        betCodes.push(betCode)
        const singleReturn = +(stake * it.oddsCurrent).toFixed(2)
        const leg: MyBetLeg = {
          id: `${idempotencyKey}-${index}-${it.id}`,
          matchId: it.matchId,
          matchLabel: it.matchLabel,
          marketTitle: it.marketTitle,
          selection: it.selection,
          oddsAtPlacement: it.oddsCurrent,
          status: 'placed',
        }
        myBets.add({
          id: `${idempotencyKey}-${index}`,
          matchLabel: it.matchLabel,
          marketTitle: it.marketTitle,
          selection: it.selection,
          odds: +it.oddsCurrent.toFixed(2),
          amount: stake,
          result: 'win',
          payout: 0,
          status: 'placed',
          placedAt,
          betCode,
          betType,
          legs: [leg],
          stake,
          currency: 'USDT',
          potentialReturn: singleReturn,
          potentialProfit: +(singleReturn - stake).toFixed(2),
        })
      })
    } else {
      const betCode = generateBetCode()
      betCodes.push(betCode)
      const legs: MyBetLeg[] = items.map((it) => ({
        id: `${idempotencyKey}-${it.id}`,
        matchId: it.matchId,
        matchLabel: it.matchLabel,
        marketTitle: it.marketTitle,
        selection: it.selection,
        oddsAtPlacement: it.oddsCurrent,
        status: 'placed',
      }))

      myBets.add({
        id: idempotencyKey,
        matchLabel: `${items.length} 腿串关`,
        marketTitle: '串关注单',
        selection: legs.map((l) => `${l.matchLabel} ${l.selection}`).join(' / '),
        odds: +currentTotalOdds.toFixed(2),
        amount: totalStake,
        result: 'win',
        payout: 0,
        status: 'placed',
        placedAt,
        betCode,
        betType,
        legs,
        stake: totalStake,
        currency: 'USDT',
        potentialReturn,
        potentialProfit: +(potentialReturn - totalStake).toFixed(2),
      })
    }

    set({ items: [], submitting: false, slipOpen: false })
    addToast({
      type: 'success',
      message: betType === 'multi_single'
        ? `下单成功，已生成 ${betCodes.length} 笔单注`
        : `下单成功，注单号 ${betCodes[0]}`,
      cta: { label: '查看注单', route: '/soccer/mybets' },
    })
    return { ok: true, betCode: betCodes[0] }
  },
}))

attachPersist(useSoccerBetSlipStore, STORAGE_KEY, (s) => ({
  items: s.items,
  betType: s.betType,
}))
