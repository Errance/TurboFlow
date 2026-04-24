import { create } from 'zustand'
import type { BetSlipItem } from '../data/soccer/types'
import { canCombine, getMarketFamily, type MarketFamily } from '../data/soccer/marketFamily'
import { useToastStore } from './toastStore'

/**
 * 足球投注单全局 store。
 *
 * 责任：
 * - 持有跨场（cross-match）投注单 items
 * - 维护选项的增删（含相关性校验）
 * - 暴露按场分组的派生视图
 * - 在比赛状态变化（void / suspended / ended）时被动清理
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
}

export interface ToggleInput {
  matchId: string
  matchLabel: string
  marketTitle: string
  selection: string
  odds: number
}

export type ToggleResult =
  | { ok: true; action: 'added' | 'removed' | 'replaced' }
  | { ok: false; reason: string }

interface SoccerBetSlipState {
  items: ExtendedBetSlipItem[]
  slipOpen: boolean

  /** 核心入口：添加/取消选择，处理"同盘替换"与"同场冲突"。 */
  toggleItem: (input: ToggleInput) => ToggleResult
  /** 直接按 item id 移除（投注单面板的 × 按钮用）。 */
  removeById: (id: string) => void
  /** 指定比赛的指定盘口全部移除（void 清理场景用）。 */
  removeByMatchTitle: (matchId: string, marketTitle: string) => void
  /** 指定比赛所有 items 清空。 */
  clearMatch: (matchId: string) => void
  /** 清空全部。 */
  clearAll: () => void
  /** 被动清理 void 盘口（SoccerMatchPage useEffect 用）。 */
  purgeVoid: (matchId: string, voidMarketTitles: Set<string>) => void

  openSlip: () => void
  closeSlip: () => void
  toggleSlipOpen: () => void

  /** 派生查询：指定比赛的所有 items。 */
  getItemsByMatch: (matchId: string) => ExtendedBetSlipItem[]
  /** 派生查询：指定比赛内已选中的 selectedKeys（`marketTitle|selection`）。 */
  getSelectedKeys: (matchId: string) => Set<string>
}

function makeId(matchId: string, marketTitle: string, selection: string): string {
  return `${matchId}|${marketTitle}|${selection}`
}

export const useSoccerBetSlipStore = create<SoccerBetSlipState>((set, get) => ({
  items: [],
  slipOpen: false,

  toggleItem: (input) => {
    const { matchId, matchLabel, marketTitle, selection, odds } = input
    const id = makeId(matchId, marketTitle, selection)
    const family = getMarketFamily(marketTitle)
    const addToast = useToastStore.getState().addToast
    const prev = get().items

    // 1) id 已存在 → 取消选择
    if (prev.some((it) => it.id === id)) {
      set({ items: prev.filter((it) => it.id !== id) })
      return { ok: true, action: 'removed' }
    }

    // 2) 同 matchId + 同 marketTitle 的既有 item → 替换（盘口内部天然互斥）
    const sameMarketIdx = prev.findIndex(
      (it) => it.matchId === matchId && it.marketTitle === marketTitle
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
            message: `无法同场组合：${marketTitle} 与 ${existing.marketTitle} ${verdict.reason}`,
          })
          return { ok: false, reason: verdict.reason }
        }
      }
    }

    const newItem: ExtendedBetSlipItem = {
      id,
      matchId,
      matchLabel,
      marketTitle,
      selection,
      odds,
      marketFamily: family,
      addedAt: Date.now(),
    }

    if (sameMarketIdx >= 0) {
      const next = [...prev]
      next.splice(sameMarketIdx, 1, newItem)
      set({ items: next })
      return { ok: true, action: 'replaced' }
    }

    set({ items: [...prev, newItem] })
    return { ok: true, action: 'added' }
  },

  removeById: (id) => {
    set({ items: get().items.filter((it) => it.id !== id) })
  },

  removeByMatchTitle: (matchId, marketTitle) => {
    set({
      items: get().items.filter(
        (it) => !(it.matchId === matchId && it.marketTitle === marketTitle)
      ),
    })
  },

  clearMatch: (matchId) => {
    set({ items: get().items.filter((it) => it.matchId !== matchId) })
  },

  clearAll: () => set({ items: [], slipOpen: false }),

  purgeVoid: (matchId, voidMarketTitles) => {
    if (voidMarketTitles.size === 0) return
    const prev = get().items
    const next = prev.filter(
      (it) => !(it.matchId === matchId && voidMarketTitles.has(it.marketTitle))
    )
    if (next.length !== prev.length) set({ items: next })
  },

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
}))
