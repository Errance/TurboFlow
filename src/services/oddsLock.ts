/**
 * 赔率锁定倒计时 hook。
 *
 * 每个投注单 item 加入时会写入 oddsLockedUntil（= now + 30s）。
 * 本 hook 每秒读取 store 并计算剩余秒数；到期不自动删除 item，仅标 stale
 * （由 placeBet 的 acceptPolicy 阶段决定是否拒单）。
 */

import { useEffect, useState } from 'react'
import { useSoccerBetSlipStore } from '../stores/soccerBetSlipStore'

/**
 * 返回每个 item 的剩余锁定秒数（向下取整）。
 * 已过期或无锁定时间戳的 item 返回 0。
 */
export function useOddsLockCountdown(): Record<string, number> {
  const items = useSoccerBetSlipStore((s) => s.items)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (items.length === 0) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [items.length])

  const map: Record<string, number> = {}
  for (const it of items) {
    if (!it.oddsLockedUntil) {
      map[it.id] = 0
      continue
    }
    const remainMs = it.oddsLockedUntil - now
    map[it.id] = remainMs > 0 ? Math.floor(remainMs / 1000) : 0
  }
  return map
}

/** 判断 item 是否仍在锁定窗口内（非过期） */
export function isOddsLocked(lockedUntil?: number): boolean {
  if (!lockedUntil) return false
  return Date.now() < lockedUntil
}
