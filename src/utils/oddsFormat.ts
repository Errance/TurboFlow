/**
 * 赔率格式化工具。
 *
 * 内部数据始终以 decimal（欧洲小数）存储与计算，本模块只负责展示层互转：
 * - toDecimal：统一保留 2 位小数
 * - toFractional：用欧几里得化约还原分数（a/b，gcd 约掉）
 * - toAmerican：≥ 2.0 → 正数线；< 2.0 → 负数线
 *
 * formatOdds(n, format) 是 UI 单入口，不访问 store 以保持纯函数。
 */

import type { OddsFormat } from '../data/soccer/contracts'

export function toDecimal(n: number): string {
  if (!Number.isFinite(n) || n < 1) return '-'
  return n.toFixed(2)
}

/**
 * 把 decimal 赔率（> 1）转为分数表达。
 *
 * 做法：profit = decimal - 1，用连分数近似到 1e-4 精度后再化约。
 * 例：2.24 → 1.24 ≈ 31/25 → "31/25"
 */
export function toFractional(n: number): string {
  if (!Number.isFinite(n) || n <= 1) return '-'
  const profit = n - 1
  const [num, den] = approximateFraction(profit, 1e-4, 1000)
  return `${num}/${den}`
}

/**
 * 把 decimal 赔率转为美式线。
 * - decimal >= 2：+(d - 1) × 100
 * - decimal < 2：-100 / (d - 1)
 * 结果四舍五入到整数。
 */
export function toAmerican(n: number): string {
  if (!Number.isFinite(n) || n <= 1) return '-'
  if (n >= 2) {
    const v = Math.round((n - 1) * 100)
    return `+${v}`
  }
  const v = Math.round(-100 / (n - 1))
  return `${v}`
}

export function formatOdds(n: number, format: OddsFormat): string {
  switch (format) {
    case 'fractional':
      return toFractional(n)
    case 'american':
      return toAmerican(n)
    case 'decimal':
    default:
      return toDecimal(n)
  }
}

// --- internals ---

function approximateFraction(x: number, tolerance: number, maxDen: number): [number, number] {
  // Stern-Brocot 连分数展开；保证结果已最简分数形式
  let h1 = 1
  let h0 = 0
  let k1 = 0
  let k0 = 1
  let b = x
  let guard = 0
  while (guard++ < 64) {
    const a = Math.floor(b)
    const h2 = a * h1 + h0
    const k2 = a * k1 + k0
    if (k2 > maxDen) break
    h0 = h1
    h1 = h2
    k0 = k1
    k1 = k2
    if (Math.abs(x - h1 / k1) < tolerance) break
    const frac = b - a
    if (frac === 0) break
    b = 1 / frac
  }
  return [h1, Math.max(k1, 1)]
}
