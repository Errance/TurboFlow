/**
 * 下单与钱包相关的枚举、接口与常量契约。
 *
 * 本文件定义"外部 IO 边界"：下单请求 / 结果 / 拒单原因 / 额度常量。
 * 不依赖任何 React / Zustand / UI，可被 store、service、utils、PRD 文档交叉引用。
 *
 * 数值口径：
 * - 金额单位统一 USDT（Demo 以 1 USDT ≈ 1 USD 近似）
 * - 赔率统一存欧洲小数（decimal），格式化仅在展示层执行
 */

import type { BetType } from './types'

export type OddsFormat = 'decimal' | 'fractional' | 'american'

/**
 * 赔率接受策略。
 * - any：任何变化都自动接受
 * - higher_only：仅自动接受上涨（对用户有利）；下跌时要求手工确认
 * - none：任何变化都必须手工确认
 */
export type OddsAcceptPolicy = 'any' | 'higher_only' | 'none'

// lucky15 / heinz 为生产扩展预留，当前投注单 UI 仅开放 trixie / patent / yankee。
export type SystemType = 'trixie' | 'yankee' | 'patent' | 'lucky15' | 'heinz'

export interface WalletAccount {
  balance: number
  currency: 'USDT'
  /** 已锁定（例如下单中、未结算）的金额；Demo 暂不使用但预留给生产 */
  locked: number
}

export interface BetLegInput {
  matchId: string
  matchLabel: string
  marketTitle: string
  selection: string
  /** 下单时的赔率快照（用户看到并同意的那个） */
  oddsAtPlacement: number
}

export interface BetSubmission {
  /** 幂等键，使用 crypto.randomUUID() */
  idempotencyKey: string
  betType: BetType
  systemType?: SystemType
  legs: BetLegInput[]
  stake: number
  acceptPolicy: OddsAcceptPolicy
}

/**
 * 拒单原因。顺序对应 Phase 3 placeBet 校验链。
 * - odds_changed：赔率已变化且不满足 acceptPolicy
 * - odds_expired：报价有效期已过，需要用户重新确认当前赔率
 * - market_closed：盘口已 suspended / settled / void / hidden
 * - match_not_available：比赛已不可下注
 * - balance_insufficient：钱包余额不足
 * - stake_below_min / stake_above_max：投注额越界
 * - payout_above_cap：可能返还超过 maxReturn
 * - legs_too_few / legs_too_many：腿数不满足 betType 要求
 * - conflict_detected：同场盘口冲突（由 canCombine 判定）
 * - network_error：网络层失败（mock 5% 概率）
 * - rate_limited：频率限制（防御性占位）
 */
export type BetRejectReason =
  | 'odds_changed'
  | 'odds_expired'
  | 'market_closed'
  | 'match_not_available'
  | 'balance_insufficient'
  | 'stake_below_min'
  | 'stake_above_max'
  | 'payout_above_cap'
  | 'legs_too_few'
  | 'legs_too_many'
  | 'conflict_detected'
  | 'network_error'
  | 'rate_limited'

export interface BetSubmissionResult {
  ok: boolean
  reason?: BetRejectReason
  betCode?: string
}

/**
 * 下单额度常量。数值参考国际主流博彩平台（bet365 / Betway / Stake）的典型范围，
 * 在 Demo 上做了宽松化以便用户快速跑通不同路径（含边界拒单）。
 *
 * 注意：
 * - minStake 保留 1 而非 0.1，便于演示 stake_below_min 拒单
 * - maxLegs 15 是业界普遍上限
 * - oddsLockSeconds 30s 是从选中到提交的锁定窗口，到期后标 stale
 * - tickIntervalMs 15s + tickJitter 0.02 为 live 场次的赔率抖动参数
 */
export const BETTING_LIMITS = {
  minStake: 1,
  maxStake: 10000,
  stakeStep: 0.1,
  minLegs: { single: 1, accumulator: 2, system: 3 } as Record<BetType, number>,
  maxLegs: 15,
  maxReturn: 500000,
  oddsLockSeconds: 30,
  tickIntervalMs: 15000,
  tickJitter: 0.02,
} as const

export const DEFAULT_QUICK_STAKES = [10, 50, 100, 500] as const

export const INITIAL_DEMO_BALANCE = 10000
