/**
 * 统一赔率展示组件。
 *
 * 职责：
 * - 按 settingsStore.oddsFormat 格式化（decimal / fractional / american）
 * - 若传入 selectionKey 则订阅 oddsRegistry，使用实时赔率覆盖 fallbackOdds
 * - 赔率变动时短暂闪烁（up 绿 / down 红）
 *
 * 无 selectionKey 时退化为纯格式化展示（静态盘口），不订阅任何源。
 */

import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { getOdds, subscribeOdds } from '../../services/oddsRegistry'
import { formatOdds } from '../../utils/oddsFormat'

interface Props {
  /** 加入 registry 后的 key；为空则不订阅，只做静态格式化 */
  selectionKey?: string
  /** 当 registry 无值或未订阅时兜底显示的赔率 */
  fallbackOdds: number
  /** 分数矩阵式展示在分数 > 2 位数时可能溢出；此处保留与旧行为兼容的压缩位数 */
  compactLarge?: boolean
  className?: string
}

export default function OddsDisplay({ selectionKey, fallbackOdds, compactLarge, className }: Props) {
  const format = useSettingsStore((s) => s.oddsFormat)
  const [currentOdds, setCurrentOdds] = useState<number>(
    selectionKey ? (getOdds(selectionKey) ?? fallbackOdds) : fallbackOdds,
  )
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 订阅 registry 变化
  useEffect(() => {
    if (!selectionKey) return
    const initial = getOdds(selectionKey)
    if (initial !== undefined && initial !== currentOdds) {
      setCurrentOdds(initial)
    }
    const unsub = subscribeOdds((k, next, prev) => {
      if (k !== selectionKey) return
      setCurrentOdds(next)
      if (prev !== undefined && next !== prev) {
        const dir = next > prev ? 'up' : 'down'
        setFlash(dir)
        if (flashTimer.current) clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setFlash(null), 500)
      }
    })
    return () => {
      unsub()
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey])

  // fallbackOdds 切换（首次 seed 或父级重渲染）时对齐内部 state
  useEffect(() => {
    if (!selectionKey) {
      setCurrentOdds(fallbackOdds)
    }
  }, [fallbackOdds, selectionKey])

  const text = (() => {
    if (compactLarge && currentOdds >= 100 && format === 'decimal') {
      return currentOdds.toFixed(0)
    }
    return formatOdds(currentOdds, format)
  })()

  const flashClass = flash === 'up' ? 'odds-flash-up' : flash === 'down' ? 'odds-flash-down' : ''
  return <span className={`${className ?? ''} ${flashClass}`.trim()}>{text}</span>
}
