/**
 * 拒单原因 → 用户可读文案映射。
 *
 * 文案原则：
 * - 告知"为什么被拒"，并尽量暗示用户下一步动作
 * - 金额上下限 / 腿数 / 最大赔付动态引用 BETTING_LIMITS，保持与 store 单一真源
 * - 纯对象导出，方便 PRD 文档表格直接引用
 */

import { BETTING_LIMITS } from '../data/soccer/contracts'
import type { BetRejectReason } from '../data/soccer/contracts'

export const REJECT_MESSAGES: Record<BetRejectReason, string> = {
  odds_changed: '赔率已变化，请接受当前赔率后重试',
  odds_expired: '报价已过期，请重新确认当前赔率',
  market_closed: '盘口已关闭，请移除不可用选项',
  match_not_available: '比赛已不可用，请移除相关选项',
  balance_insufficient: '余额不足，请调整金额或使用 MAX',
  stake_below_min: `单注不得低于 ${BETTING_LIMITS.minStake} USDT`,
  stake_above_max: `单注不得高于 ${BETTING_LIMITS.maxStake.toLocaleString('en-US')} USDT`,
  payout_above_cap: `单注最高可能返还 ${BETTING_LIMITS.maxReturn.toLocaleString('en-US')} USDT`,
  legs_too_few: `当前投注类型腿数不足，请选择更多选项或切换投注方式`,
  legs_too_many: `当前投注类型腿数过多，串单最多 ${BETTING_LIMITS.maxLegs} 腿`,
  conflict_detected: '存在盘口冲突，请移除或替换冲突选项',
  network_error: '网络错误，请重试',
  rate_limited: '提交过于频繁，请稍候',
}

export function rejectMessage(reason: BetRejectReason): string {
  return REJECT_MESSAGES[reason] ?? '下单失败，请重试'
}
