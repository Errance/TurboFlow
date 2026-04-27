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
  match_not_available: '该比赛暂不支持投注，请移除相关选项',
  balance_insufficient: '余额不足，请调整投注金额',
  stake_below_min: `投注金额需不低于 ${BETTING_LIMITS.minStake} USDT`,
  stake_above_max: `投注金额需不高于 ${BETTING_LIMITS.maxStake.toLocaleString('en-US')} USDT`,
  payout_above_cap: `预计返还不能超过 ${BETTING_LIMITS.maxReturn.toLocaleString('en-US')} USDT`,
  legs_too_few: `当前投注方式需要更多选项，请继续添加或切换投注方式`,
  legs_too_many: `当前投注方式最多支持 ${BETTING_LIMITS.maxLegs} 个投注项，请移除部分选项`,
  conflict_detected: '当前选项不可组合，请移除或替换冲突选项',
  network_error: '提交未成功，请稍后重试',
  rate_limited: '投注正在确认中，请等待当前结果返回',
}

export function rejectMessage(reason: BetRejectReason): string {
  return REJECT_MESSAGES[reason] ?? '投注未提交成功，请重试'
}
