/**
 * 轻量版 Zustand 持久化 helper。
 *
 * 不引入 zustand/middleware/persist 依赖，保持 store 声明直白：
 * - loadState 在 store 初始化时同步读取 localStorage
 * - subscribeToPersist 在 store 创建后挂 listener，按需把指定字段快照写回
 *
 * 之所以不是通用 middleware：
 * - 我们想精确控制哪些字段持久化（Toasts/submitting 等临时状态不落盘）
 * - SSR / private mode 下静默降级为无持久化
 */

import type { StoreApi } from 'zustand'

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    if (!window.localStorage) return null
    const k = '__tf_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return window.localStorage
  } catch {
    return null
  }
}

export function loadState<T>(key: string): T | null {
  const storage = safeStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveState<T>(key: string, value: T): void {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // quota / serialize 失败静默忽略，保留内存态
  }
}

export function clearState(key: string): void {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * 订阅 store 变化并把 picker 返回值写回 localStorage。
 *
 * 使用：
 *   const store = create<State>(...)
 *   attachPersist(store, 'tf_wallet', s => ({ balance: s.balance, locked: s.locked }))
 */
export function attachPersist<TState, TSlice>(
  store: StoreApi<TState>,
  key: string,
  picker: (state: TState) => TSlice,
): void {
  let prev = picker(store.getState())
  saveState(key, prev)
  store.subscribe((state) => {
    const next = picker(state)
    if (shallowEqual(prev, next)) return
    prev = next
    saveState(key, next)
  })
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) {
      return false
    }
  }
  return true
}
