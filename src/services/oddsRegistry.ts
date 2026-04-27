/**
 * 赔率注册表。
 *
 * 全局 Map，把 selectionKey（matchId|marketTitle|selection）映射到当前最新赔率。
 * - oddsTicker 负责写入
 * - 盘口卡片组件订阅读取（展示实时赔率 + 闪烁动画）
 *
 * 不用 Zustand：订阅面非常广（每个赔率按钮），用轻量 listener 避免整树重渲染。
 */

type Listener = (key: string, newOdds: number, oldOdds: number | undefined) => void

const registry = new Map<string, number>()
const listeners = new Set<Listener>()

export function makeSelectionKey(matchId: string, marketTitle: string, selection: string): string {
  return `${matchId}|${marketTitle}|${selection}`
}

export function getOdds(key: string): number | undefined {
  return registry.get(key)
}

export function setOdds(key: string, newOdds: number): void {
  const oldOdds = registry.get(key)
  registry.set(key, newOdds)
  for (const fn of listeners) fn(key, newOdds, oldOdds)
}

export function subscribeOdds(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 初始化：把盘口初始赔率写入 registry（页面挂载时一次性 seed） */
export function seedOdds(entries: Iterable<[string, number]>): void {
  for (const [k, v] of entries) {
    if (!registry.has(k)) registry.set(k, v)
  }
}

/** 清空（测试用） */
export function resetOddsRegistry(): void {
  registry.clear()
}

/** 返回当前所有键（ticker 抖动时用） */
export function listOddsKeys(): string[] {
  return Array.from(registry.keys())
}
