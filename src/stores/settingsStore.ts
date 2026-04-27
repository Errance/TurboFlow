/**
 * 足球盘口偏好设置 store。
 *
 * 包含：
 * - oddsFormat：赔率显示格式（decimal / fractional / american）
 * - acceptPolicy：赔率变化接受策略（any / higher_only / none）
 * - quickStakes：投注单快选金额 chips
 *
 * 全部持久化到 localStorage key：tf_settings。
 */

import { create } from 'zustand'
import { attachPersist, loadState } from './persist'
import type { OddsAcceptPolicy, OddsFormat } from '../data/soccer/contracts'
import { DEFAULT_QUICK_STAKES } from '../data/soccer/contracts'

const STORAGE_KEY = 'tf_settings'

interface PersistedSettings {
  oddsFormat: OddsFormat
  acceptPolicy: OddsAcceptPolicy
  quickStakes: number[]
}

interface SettingsState extends PersistedSettings {
  setOddsFormat: (format: OddsFormat) => void
  setAcceptPolicy: (policy: OddsAcceptPolicy) => void
  setQuickStakes: (stakes: number[]) => void
  reset: () => void
}

const DEFAULTS: PersistedSettings = {
  oddsFormat: 'decimal',
  acceptPolicy: 'higher_only',
  quickStakes: [...DEFAULT_QUICK_STAKES],
}

const persisted = loadState<Partial<PersistedSettings>>(STORAGE_KEY) ?? {}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULTS,
  ...persisted,
  quickStakes: persisted.quickStakes && persisted.quickStakes.length > 0
    ? persisted.quickStakes
    : DEFAULTS.quickStakes,

  setOddsFormat: (format) => set({ oddsFormat: format }),
  setAcceptPolicy: (policy) => set({ acceptPolicy: policy }),
  setQuickStakes: (stakes) => set({ quickStakes: stakes }),
  reset: () => set(DEFAULTS),
}))

attachPersist(useSettingsStore, STORAGE_KEY, (s) => ({
  oddsFormat: s.oddsFormat,
  acceptPolicy: s.acceptPolicy,
  quickStakes: s.quickStakes,
}))
