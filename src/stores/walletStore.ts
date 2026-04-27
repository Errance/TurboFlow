/**
 * 钱包 store。
 *
 * 责任：
 * - 持有可用余额和未结算本金
 * - 提供下注扣款、结算入账、修正扣回和重置
 * - 首次加载注入 10,000 USDT 并提示用户
 * - 使用 localStorage 持久化
 *
 * 当前只服务本地演示，真实资金以后由服务端账本接管。
 */

import { create } from 'zustand'
import { attachPersist, loadState } from './persist'
import { INITIAL_DEMO_BALANCE } from '../data/soccer/contracts'
import { useToastStore } from './toastStore'

const STORAGE_KEY = 'tf_wallet'

interface PersistedWallet {
  balance: number
  locked: number
}

interface WalletState {
  balance: number
  locked: number
  /** 返回 true 表示扣款成功；余额不足则不修改并返回 false */
  deduct: (amount: number) => boolean
  debit: (amount: number) => boolean
  credit: (amount: number) => void
  releaseLocked: (amount: number) => void
  canAfford: (amount: number) => boolean
  reset: () => void
}

const persisted = loadState<PersistedWallet>(STORAGE_KEY)
const isFreshInstall = !persisted

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: persisted?.balance ?? INITIAL_DEMO_BALANCE,
  locked: persisted?.locked ?? 0,

  canAfford: (amount) => get().balance >= amount,

  deduct: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return false
    if (get().balance < amount) return false
    set({
      balance: +(get().balance - amount).toFixed(2),
      locked: +(get().locked + amount).toFixed(2),
    })
    return true
  },

  debit: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return false
    if (get().balance < amount) return false
    set({ balance: +(get().balance - amount).toFixed(2) })
    return true
  },

  credit: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return
    set({ balance: +(get().balance + amount).toFixed(2) })
  },

  releaseLocked: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return
    set({ locked: Math.max(0, +(get().locked - amount).toFixed(2)) })
  },

  reset: () => set({ balance: INITIAL_DEMO_BALANCE, locked: 0 }),
}))

attachPersist(useWalletStore, STORAGE_KEY, (s) => ({
  balance: s.balance,
  locked: s.locked,
}))

if (isFreshInstall && typeof window !== 'undefined') {
  // 延后到下一个 tick，避免 React 首屏渲染前就派发 toast
  setTimeout(() => {
    useToastStore.getState().addToast({
      type: 'info',
      message: `钱包已注入 ${INITIAL_DEMO_BALANCE.toLocaleString('en-US')} USDT`,
    })
  }, 500)
}
