/**
 * 赔率抖动服务。
 *
 * 仅对 match.status === 'live' 的盘口每 tickIntervalMs 触发一次随机抖动：
 *   new = clamp(old + rand(-tickJitter, +tickJitter), 1.01, 50)
 *
 * 抖动结果：
 * 1) 写入 oddsRegistry → 通知订阅方（盘口卡）刷新 + 闪烁
 * 2) 若该 selectionKey 出现在投注单 items 中，调用 soccerBetSlipStore.refreshOdds
 *
 * 生产环境应替换为 WebSocket 推送，本实现仅用于 Demo 可视化。
 */

import { BETTING_LIMITS } from '../data/soccer/contracts'
import { listOddsKeys, setOdds, getOdds } from './oddsRegistry'
import { useSoccerBetSlipStore } from '../stores/soccerBetSlipStore'

const MIN_ODDS = 1.01
const MAX_ODDS = 50

let timer: ReturnType<typeof setInterval> | null = null
let isLive = false

/** 注册：哪些 selectionKey 来自 live 场次（允许抖动） */
const liveKeys = new Set<string>()

export function markKeysLive(keys: Iterable<string>, live: boolean): void {
  for (const k of keys) {
    if (live) liveKeys.add(k)
    else liveKeys.delete(k)
  }
  updateLiveFlag()
}

export function clearLiveKeys(): void {
  liveKeys.clear()
  updateLiveFlag()
}

function updateLiveFlag(): void {
  const nextLive = liveKeys.size > 0
  if (nextLive === isLive) return
  isLive = nextLive
  if (isLive) start()
  else stop()
}

function start(): void {
  if (timer) return
  timer = setInterval(tick, BETTING_LIMITS.tickIntervalMs)
}

function stop(): void {
  if (!timer) return
  clearInterval(timer)
  timer = null
}

function tick(): void {
  const slipItems = useSoccerBetSlipStore.getState().items
  const keys = listOddsKeys()
  for (const key of keys) {
    if (!liveKeys.has(key)) continue
    const old = getOdds(key)
    if (old === undefined) continue
    const delta = (Math.random() * 2 - 1) * BETTING_LIMITS.tickJitter
    const raw = old + delta
    const clamped = Math.min(MAX_ODDS, Math.max(MIN_ODDS, raw))
    const next = +clamped.toFixed(2)
    if (next === old) continue
    setOdds(key, next)
    const slipItem = slipItems.find((it) => it.id === key)
    if (slipItem) {
      useSoccerBetSlipStore.getState().refreshOdds(key, next)
    }
  }
}

/** 仅供测试 / HMR 清理 */
export function __forceStopTicker(): void {
  stop()
  clearLiveKeys()
}
