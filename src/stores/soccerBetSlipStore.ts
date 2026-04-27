import { create } from 'zustand'
import type { BetSlipItem, BetType, MyBetLeg } from '../data/soccer/types'
import type { BetRejectReason, BetSubmissionResult, SystemType } from '../data/soccer/contracts'
import { canCombine, getMarketFamily, type MarketFamily } from '../data/soccer/marketFamily'
import { useToastStore } from './toastStore'
import { useWalletStore } from './walletStore'
import { useSettingsStore } from './settingsStore'
import { useMyBetsStore } from './myBetsStore'
import { attachPersist, loadState } from './persist'
import { BETTING_LIMITS } from '../data/soccer/contracts'
import { rejectMessage } from '../utils/betRejectMessages'
import { generateBetCode } from '../utils/betCode'
import { buildSystemBetProjection, getSystemMeta } from '../utils/systemBets'

/**
 * 足球投注单全局 store。
 *
 * 责任：
 * - 持有跨场（cross-match）投注单 items
 * - 维护选项的增删（含相关性校验）
 * - 暴露按场分组的派生视图
 * - 在比赛状态变化（void / suspended / ended）时被动清理
 * - 跟踪赔率快照（oddsAtAdd）与当前赔率（oddsCurrent），供 acceptPolicy 判定
 * - 维护 betType / systemType（单式 / 串关 / 复式）
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
  /** 锁定窗口到期时间戳（ms）；过期后 stale，下单按 acceptPolicy 处理 */
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
  /** 投注类型（单式/串关/复式） */
  betType: BetType
  /** 复式子类型（仅 betType === 'system' 时有效） */
  systemType: SystemType
  /** 下单提交中标志 */
  submitting: boolean

  toggleItem: (input: ToggleInput) => ToggleResult
  replaceWithItems: (
    inputs: ToggleInput[],
    betType?: BetType,
    systemType?: SystemType,
  ) => ToggleResult
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
  setSystemType: (type: SystemType) => void
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
  /** 串单 / 复式腿数是否满足 BETTING_LIMITS 要求 */
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
  systemType: SystemType
}

function makeId(matchId: string, marketTitle: string, selection: string): string {
  return `${matchId}|${marketTitle}|${selection}`
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
  betType: restoredItems.length > 1 && persisted?.betType === 'single'
    ? 'accumulator'
    : (persisted?.betType ?? 'single'),
  systemType: persisted?.systemType ?? 'trixie',
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
        betType: get().betType === 'accumulator' && next.length <= 1 ? 'single' : get().betType,
      })
      return { ok: true, action: 'removed' }
    }

    // 2) 同 matchId + 同 marketTitle 的既有 item → 替换（盘口内部天然互斥）
    const sameMarketIdx = prev.findIndex(
      (it) => it.matchId === matchId && it.marketTitle === marketTitle,
    )

    // 3) 若跨盘口，对同场其他盘口做相关性校验
    if (sameMarketIdx === -1) {
      for (const existing of prev) {
        if (existing.matchId !== matchId) continue
        if (existing.marketTitle === marketTitle) continue
        const verdict = canCombine(family, existing.marketFamily)
        if (!verdict.ok) {
          addToast({
            type: 'error',
            message: `无法同场组合：${marketTitle} 与 ${existing.marketTitle}。${verdict.reason}`,
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
    const nextBetType = prev.length >= 1 && prevBetType === 'single' ? 'accumulator' : prevBetType
    set({ items: [...prev, newItem], betType: nextBetType })
    if (nextBetType !== prevBetType) {
      addToast({ type: 'info', message: '已切换为串关，需全部选项命中方可获胜' })
    }
    return { ok: true, action: 'added' }
  },

  replaceWithItems: (inputs, nextBetType = inputs.length > 1 ? 'accumulator' : 'single', nextSystemType) => {
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

    const byMatch = new Map<string, ExtendedBetSlipItem[]>()
    for (const item of next) {
      const group = byMatch.get(item.matchId) ?? []
      group.push(item)
      byMatch.set(item.matchId, group)
    }
    for (const group of byMatch.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (group[i].marketTitle === group[j].marketTitle) continue
          const verdict = canCombine(group[i].marketFamily, group[j].marketFamily)
          if (!verdict.ok) {
            addToast({
              type: 'error',
              message: `无法重投：${group[i].marketTitle} 与 ${group[j].marketTitle} 不可同场组合`,
            })
            return { ok: false, reason: verdict.reason }
          }
        }
      }
    }

    set({
      items: next,
      betType: nextBetType,
      systemType: nextSystemType ?? get().systemType,
      slipOpen: true,
    })
    return { ok: true, action: 'added' }
  },
  removeById: (id) => {
    const next = get().items.filter((it) => it.id !== id)
    set({
      items: next,
      betType: get().betType === 'accumulator' && next.length <= 1 ? 'single' : get().betType,
    })
  },

  removeByMatchTitle: (matchId, marketTitle) => {
    const next = get().items.filter(
      (it) => !(it.matchId === matchId && it.marketTitle === marketTitle),
    )
    set({
      items: next,
      betType: get().betType === 'accumulator' && next.length <= 1 ? 'single' : get().betType,
    })
  },

  clearMatch: (matchId) => {
    const next = get().items.filter((it) => it.matchId !== matchId)
    set({
      items: next,
      betType: get().betType === 'accumulator' && next.length <= 1 ? 'single' : get().betType,
    })
  },

  clearAll: () => set({ items: [], slipOpen: false, betType: 'single' }),

  purgeVoid: (matchId, voidMarketTitles) => {
    if (voidMarketTitles.size === 0) return
    const prev = get().items
    const next = prev.filter(
      (it) => !(it.matchId === matchId && voidMarketTitles.has(it.marketTitle)),
    )
    if (next.length !== prev.length) {
      set({
        items: next,
        betType: get().betType === 'accumulator' && next.length <= 1 ? 'single' : get().betType,
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
  setSystemType: (type) => set({ systemType: type }),
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

    const settings = useSettingsStore.getState()
    const wallet = useWalletStore.getState()
    const items = state.items
    const betType = state.betType
    const systemType = state.systemType

    // 2. 金额校验
    if (!Number.isFinite(stake) || stake < BETTING_LIMITS.minStake) return reject('stake_below_min')
    if (stake > BETTING_LIMITS.maxStake) return reject('stake_above_max')

    // 3. 腿数校验
    const minLegs = BETTING_LIMITS.minLegs[betType]
    if (items.length < minLegs) return reject('legs_too_few')
    if (betType === 'single' && items.length > 1) return reject('legs_too_many')
    if (items.length > BETTING_LIMITS.maxLegs) return reject('legs_too_many')
    if (betType === 'system') {
      const meta = getSystemMeta(systemType)
      if (items.length < meta.requiredLegs) return reject('legs_too_few')
      if (items.length > meta.requiredLegs) return reject('legs_too_many')
    }

    const systemProjection =
      betType === 'system'
        ? buildSystemBetProjection(systemType, items)
        : null
    const currentTotalOdds = systemProjection
      ? systemProjection.totalOdds
      : items.reduce((acc, it) => acc * it.oddsCurrent, 1)
    const totalStake = systemProjection ? +(stake * systemProjection.lineCount).toFixed(2) : stake

    // 4. 余额校验
    if (!wallet.canAfford(totalStake)) return reject('balance_insufficient')

    // 5. 相关性校验（同场）
    const byMatch = new Map<string, ExtendedBetSlipItem[]>()
    for (const it of items) {
      const arr = byMatch.get(it.matchId) ?? []
      arr.push(it)
      byMatch.set(it.matchId, arr)
    }
    for (const group of byMatch.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (group[i].marketTitle === group[j].marketTitle) continue
          const verdict = canCombine(group[i].marketFamily, group[j].marketFamily)
          if (!verdict.ok) {
            addToast({
              type: 'error',
              message: `${group[i].marketTitle} 与 ${group[j].marketTitle} 不可同场组合`,
            })
            return { ok: false, reason: 'conflict_detected' }
          }
        }
      }
    }

    const potentialReturn = +(stake * currentTotalOdds).toFixed(2)
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

    // 8. 报价有效期与赔率变动（按 acceptPolicy）
    const now = Date.now()
    const expired = items.filter(
      (it) => it.quoteState === 'needs_refresh' || !it.oddsLockedUntil || it.oddsLockedUntil <= now,
    )
    if (expired.length > 0) return reject('odds_expired')

    const changed = items.filter((it) => it.oddsCurrent !== it.oddsAtAdd)
    if (changed.length > 0) {
      if (settings.acceptPolicy === 'none') return reject('odds_changed')
      if (
        settings.acceptPolicy === 'higher_only' &&
        changed.some((c) => c.oddsCurrent < c.oddsAtAdd)
      ) {
        return reject('odds_changed')
      }
    }

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

    const betCode = generateBetCode()
    const placedAt = new Date().toISOString()
    const legs: MyBetLeg[] = items.map((it) => ({
      id: `${idempotencyKey}-${it.id}`,
      matchId: it.matchId,
      matchLabel: it.matchLabel,
      marketTitle: it.marketTitle,
      selection: it.selection,
      oddsAtPlacement: it.oddsCurrent,
      status: 'placed',
    }))

    // 展示用「主盘口」挑第一腿
    const head = items[0]
    const isSingle = betType === 'single' && items.length === 1
    const systemLabel = systemProjection ? `${systemProjection.label} · ${systemProjection.lineCount} 注` : null

    useMyBetsStore.getState().add({
      id: idempotencyKey,
      matchLabel: isSingle ? head.matchLabel : `${items.length} 腿${betType === 'system' ? '复式' : '串关'}`,
      marketTitle: isSingle ? head.marketTitle : betType === 'system' ? '复式注单' : '串关注单',
      selection: isSingle ? head.selection : systemLabel ?? legs.map((l) => `${l.matchLabel} ${l.selection}`).join(' / '),
      odds: +currentTotalOdds.toFixed(2),
      amount: totalStake,
      result: 'win', // 占位：Phase 5 结算环节会更新
      payout: 0,

      status: 'placed',
      placedAt,
      betCode,
      betType,
      systemType: betType === 'system' ? systemType : undefined,
      systemLineCount: systemProjection?.lineCount,
      legs,
      stake: totalStake,
      unitStake: betType === 'system' ? stake : undefined,
      currency: 'USDT',
      potentialReturn,
      potentialProfit: +(potentialReturn - totalStake).toFixed(2),
    })

    set({ items: [], submitting: false, slipOpen: false })
    addToast({
      type: 'success',
      message: `下单成功，注单号 ${betCode}`,
      cta: { label: '查看注单', route: '/soccer/mybets' },
    })
    return { ok: true, betCode }
  },
}))

attachPersist(useSoccerBetSlipStore, STORAGE_KEY, (s) => ({
  items: s.items,
  betType: s.betType,
  systemType: s.systemType,
}))
