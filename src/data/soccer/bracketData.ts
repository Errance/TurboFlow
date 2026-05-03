/**
 * v4.5 足球淘汰赛对阵树预测大赛（Bracket Pool）mock 数据。
 *
 * 产品形态见 PRD：
 *   Stake足球盘口研究/04_正式产品文档/TurboFlow足球预测大赛产品需求文档_v4.5.md
 *
 * 关键设计：
 * - 单笔入场（每用户每赛事 1 份），固定入场费
 * - 锁定时机：淘汰赛首场开赛瞬间锁定，锁前可任意改、可全额撤回
 * - 评分：R16=1pt × 8 / QF=2pt × 4 / SF=4pt × 2 / Final=8pt（满分 32）
 * - 派奖：(本人得分 / 全员总分) × 净池，按命中率分奖
 * - tieSubject 复用 v4.4 BetSubject (scope=tie)，便于跨产品对账
 */

import type { BetSubject } from './types'

export type BracketRoundId = 'R16' | 'QF' | 'SF' | 'F'

export type BracketTournamentStatus =
  | 'upcoming'
  | 'open'
  | 'locked'
  | 'running'
  | 'settled'
  | 'cancelled'

export type UserBracketEntryStatus =
  | 'draft'
  | 'submitted'
  | 'locked'
  | 'settled'
  | 'refunded'

export type BracketRefundReason = 'user_withdraw' | 'tournament_cancelled' | 'aggregate_zero' | 'minimum_not_met'

export type BracketAttributionSourceType = 'promo_code' | 'invite_code' | 'share' | 'organic'

export interface BracketAttribution {
  sourceType: BracketAttributionSourceType
  sourceLabel: string
  sourceCodeMasked?: string
  shareSourceEntryId?: string
  keepExistingAttribution: boolean
  rebateBasisLabel: string
}

export interface BracketRound {
  id: BracketRoundId
  label: string
  weight: number
  slotCount: number
}

export interface BracketSlot {
  id: string
  round: BracketRoundId
  parentSlotId?: string
  childSlotIds?: [string, string]
  candidates?: [string, string]
  tieSubject: BetSubject
  actualWinner?: string
}

export interface PoolDistributionShare {
  teamId: string
  pickCount: number
  pickShare: number
}

export interface PoolDistributionSnapshot {
  slotId: string
  capturedAt: string
  frozen: boolean
  totalPicks: number
  shares: PoolDistributionShare[]
}

export interface TeachingCardStep {
  title: string
  body: string
}

export interface TeachingCardWorkedExample {
  correctSlots: number
  selfScore: number
  aggregateScore: number
  netPool: number
  payout: number
}

export interface TeachingCard {
  steps: TeachingCardStep[]
  worked_example: TeachingCardWorkedExample
}

export interface TournamentConfigMeta {
  configurableByOps: string[]
  immutableAfterOpen: string[]
  notes?: string
}

export interface BracketPoolSnapshot {
  entrants: number
  grossPool: number
  netPool: number
  aggregateScore: number
  capturedAt: string
}

export interface BracketGrowthContext {
  baseBusiness: 'perp_dex'
  marketVertical: 'prediction_market'
  currentDau: number
  tabImpressions: number
  detailViews: number
  submittedEntries: number
  sourceMix: Array<{
    sourceType: BracketAttributionSourceType
    label: string
    share: number
  }>
  lightweightOpsLabel: string
}

export interface BracketAffiliatePolicy {
  enabled: boolean
  label: string
  basis: 'platform_revenue'
  note: string
}

export interface BracketTournament {
  id: string
  name: string
  shortName: string
  competitionId: string
  region: string
  phase: string
  headline: string
  status: BracketTournamentStatus
  rounds: BracketRound[]
  slots: BracketSlot[]
  openAt: string
  entryFee: number
  currency: 'USDT'
  rake: number
  minEntrants: number
  guaranteedPool: number
  lockAt: string
  settleAt: string
  fundLockHint: string
  tiebreakerLabel: string
  lateStrategyLabel: string
  distributionPolicyLabel: string
  teachingCard: TeachingCard
  poolSnapshot: BracketPoolSnapshot
  distribution: PoolDistributionSnapshot[]
  configMeta: TournamentConfigMeta
  marketVertical: 'prediction_market'
  growthContext: BracketGrowthContext
  affiliatePolicy: BracketAffiliatePolicy
  invitePolicy: BracketAffiliatePolicy
}

export interface BracketScoreBreakdownItem {
  round: BracketRoundId
  correct: number
  total: number
  points: number
}

export interface SettlementReviewSlot {
  slotId: string
  round: BracketRoundId
  pickedTeamId: string
  pickedTeamLabel: string
  actualWinnerId: string
  actualWinnerLabel: string
  correct: boolean
  pointsEarned: number
}

export interface SettlementReview {
  perSlot: SettlementReviewSlot[]
  perRound: BracketScoreBreakdownItem[]
  highlight: string
}

export interface UserBracketEntry {
  id: string
  tournamentId: string
  userName: string
  picks: Record<string, string>
  tiebreakerGuess?: number
  status: UserBracketEntryStatus
  submittedAt?: string
  lockedAt?: string
  settledAt?: string
  refundedAt?: string
  refundReason?: BracketRefundReason
  scoreBreakdown?: BracketScoreBreakdownItem[]
  totalScore?: number
  rankDisplay?: number
  scoreShare?: number
  projectedPayout?: number
  finalPayout?: number
  shareId?: string
  review?: SettlementReview
  attribution?: BracketAttribution
}

export interface LeaderboardRow {
  tournamentId: string
  rankDisplay: number
  userName: string
  isSelf: boolean
  totalScore: number
  scoreShare: number
  projectedPayout: number
  tiebreakerGuess?: number
}

// -----------------------------------------------------------------------------
// 评分与派奖函数
// -----------------------------------------------------------------------------

const ROUND_WEIGHTS: Record<BracketRoundId, number> = { R16: 1, QF: 2, SF: 4, F: 8 }

export function getRoundWeights(): Record<BracketRoundId, number> {
  return { ...ROUND_WEIGHTS }
}

export function scoreEntry(
  picks: Record<string, string>,
  results: Record<string, string>,
  slots: BracketSlot[],
  weights: Record<BracketRoundId, number> = ROUND_WEIGHTS,
): { totalScore: number; breakdown: BracketScoreBreakdownItem[] } {
  const breakdownMap: Record<BracketRoundId, BracketScoreBreakdownItem> = {
    R16: { round: 'R16', correct: 0, total: 0, points: 0 },
    QF: { round: 'QF', correct: 0, total: 0, points: 0 },
    SF: { round: 'SF', correct: 0, total: 0, points: 0 },
    F: { round: 'F', correct: 0, total: 0, points: 0 },
  }
  for (const slot of slots) {
    const entry = breakdownMap[slot.round]
    entry.total += 1
    const picked = picks[slot.id]
    const actual = results[slot.id]
    if (picked && actual && picked === actual) {
      entry.correct += 1
      entry.points += weights[slot.round]
    }
  }
  const breakdown = (['R16', 'QF', 'SF', 'F'] as BracketRoundId[]).map((id) => breakdownMap[id])
  const totalScore = breakdown.reduce((sum, b) => sum + b.points, 0)
  return { totalScore, breakdown }
}

export function projectPayout(scoreSelf: number, aggregateScore: number, netPool: number): number {
  if (aggregateScore <= 0 || scoreSelf <= 0) return 0
  return (scoreSelf / aggregateScore) * netPool
}

export function buildSettlementReview(
  picks: Record<string, string>,
  results: Record<string, string>,
  slots: BracketSlot[],
  weights: Record<BracketRoundId, number> = ROUND_WEIGHTS,
): SettlementReview {
  const perSlot: SettlementReviewSlot[] = []
  const perRoundMap: Record<BracketRoundId, BracketScoreBreakdownItem> = {
    R16: { round: 'R16', correct: 0, total: 0, points: 0 },
    QF: { round: 'QF', correct: 0, total: 0, points: 0 },
    SF: { round: 'SF', correct: 0, total: 0, points: 0 },
    F: { round: 'F', correct: 0, total: 0, points: 0 },
  }
  for (const slot of slots) {
    const picked = picks[slot.id] ?? ''
    const actual = results[slot.id] ?? ''
    const correct = Boolean(picked) && picked === actual
    const points = correct ? weights[slot.round] : 0
    perRoundMap[slot.round].total += 1
    if (correct) {
      perRoundMap[slot.round].correct += 1
      perRoundMap[slot.round].points += points
    }
    perSlot.push({
      slotId: slot.id,
      round: slot.round,
      pickedTeamId: picked,
      pickedTeamLabel: picked,
      actualWinnerId: actual,
      actualWinnerLabel: actual,
      correct,
      pointsEarned: points,
    })
  }
  const perRound = (['R16', 'QF', 'SF', 'F'] as BracketRoundId[]).map((id) => perRoundMap[id])

  let bestRound = perRound[0]
  for (const r of perRound) {
    if (r.total === 0) continue
    if (r.correct / r.total > bestRound.correct / Math.max(bestRound.total, 1)) bestRound = r
  }
  let highlight = '本届预测整体表现：得分 0 分。'
  const totalCorrect = perRound.reduce((s, r) => s + r.correct, 0)
  const totalSlots = perRound.reduce((s, r) => s + r.total, 0)
  if (totalCorrect > 0) {
    if (bestRound.total > 0 && bestRound.correct === bestRound.total) {
      highlight = `你最强的是 ${bestRound.round} 轮（${bestRound.correct}/${bestRound.total} 全对）。`
    } else if (bestRound.correct > 0) {
      highlight = `你最强的是 ${bestRound.round} 轮（${bestRound.correct}/${bestRound.total} 命中），整届共命中 ${totalCorrect}/${totalSlots}。`
    } else {
      highlight = `本届共命中 ${totalCorrect}/${totalSlots}，分布在前几轮。`
    }
  }

  return { perSlot, perRound, highlight }
}

// -----------------------------------------------------------------------------
// UCL 2026 淘汰赛 mock：完整 15 个 slot
// -----------------------------------------------------------------------------

const TEAMS_R16: Array<[string, string]> = [
  ['real-madrid', 'manchester-city'],
  ['bayern', 'arsenal'],
  ['psg', 'inter'],
  ['barcelona', 'leverkusen'],
  ['atletico', 'atalanta'],
  ['liverpool', 'porto'],
  ['dortmund', 'sporting'],
  ['chelsea', 'feyenoord'],
]

const TEAM_LABEL: Record<string, string> = {
  'real-madrid': '皇家马德里',
  'manchester-city': '曼城',
  bayern: '拜仁慕尼黑',
  arsenal: '阿森纳',
  psg: '巴黎圣日耳曼',
  inter: '国际米兰',
  barcelona: '巴塞罗那',
  leverkusen: '勒沃库森',
  atletico: '马德里竞技',
  atalanta: '亚特兰大',
  liverpool: '利物浦',
  porto: '波尔图',
  dortmund: '多特蒙德',
  sporting: '里斯本竞技',
  chelsea: '切尔西',
  feyenoord: '费耶诺德',
}

export function teamLabel(id: string): string {
  return TEAM_LABEL[id] ?? id
}

export const SAMPLE_FINAL_TOTAL_GOALS = 3

const UCL_OPEN_AT = '2026-05-01T10:00:00.000Z'
const UCL_LOCK_AT = '2026-05-20T20:00:00.000Z'
const UCL_SETTLE_AT = '2026-07-12T19:00:00.000Z'

function makeTieSubject(slotId: string, label: string, closesAt: string, resolutionLabel: string): BetSubject {
  return {
    scope: 'tie',
    subjectId: `pool-ucl-2026-${slotId}`,
    subjectLabel: label,
    closesAt,
    resolutionTimeLabel: resolutionLabel,
    resolutionSource: 'UEFA 官方淘汰赛结果',
  }
}

function buildSlots(): BracketSlot[] {
  const slots: BracketSlot[] = []

  // R16 - 8 slots
  TEAMS_R16.forEach((pair, idx) => {
    const id = `R16-${idx + 1}`
    slots.push({
      id,
      round: 'R16',
      candidates: pair,
      tieSubject: makeTieSubject(
        id,
        `${teamLabel(pair[0])} vs ${teamLabel(pair[1])} · 1/8 决赛`,
        UCL_LOCK_AT,
        '次回合结束并经 UEFA 确认晋级方后',
      ),
      actualWinner: undefined,
    })
  })

  // QF - 4 slots, each from two R16 winners
  for (let i = 0; i < 4; i++) {
    const id = `QF-${i + 1}`
    const childA = `R16-${i * 2 + 1}`
    const childB = `R16-${i * 2 + 2}`
    slots.push({
      id,
      round: 'QF',
      childSlotIds: [childA, childB],
      tieSubject: makeTieSubject(
        id,
        `1/4 决赛 ${i + 1}：${childA} 胜者 vs ${childB} 胜者`,
        UCL_LOCK_AT,
        '次回合结束并经 UEFA 确认晋级方后',
      ),
    })
  }

  // SF - 2 slots, each from two QF winners
  for (let i = 0; i < 2; i++) {
    const id = `SF-${i + 1}`
    const childA = `QF-${i * 2 + 1}`
    const childB = `QF-${i * 2 + 2}`
    slots.push({
      id,
      round: 'SF',
      childSlotIds: [childA, childB],
      tieSubject: makeTieSubject(
        id,
        `半决赛 ${i + 1}：${childA} 胜者 vs ${childB} 胜者`,
        UCL_LOCK_AT,
        '次回合结束并经 UEFA 确认晋级方后',
      ),
    })
  }

  // Final
  slots.push({
    id: 'F-1',
    round: 'F',
    childSlotIds: ['SF-1', 'SF-2'],
    tieSubject: makeTieSubject(
      'F-1',
      '决赛：半决赛胜者对决',
      UCL_LOCK_AT,
      '决赛结束并经 UEFA 确认后',
    ),
  })

  // Set parent relationships
  for (const slot of slots) {
    if (slot.childSlotIds) {
      for (const childId of slot.childSlotIds) {
        const child = slots.find((s) => s.id === childId)
        if (child) child.parentSlotId = slot.id
      }
    }
  }

  return slots
}

function makeDistribution(slots: BracketSlot[], totalPicks: number): PoolDistributionSnapshot[] {
  // 用稳定哈希生成仿真分布。R16 只有两队；下游 slot 覆盖所有潜在球队，
  // UI 再按当前候选过滤展示，避免 QF/SF/F 使用 placeholder 后查不到占比。
  const result: PoolDistributionSnapshot[] = []
  const captured = '2026-05-03T00:30:00.000Z'
  const allTeamIds = Object.keys(TEAM_LABEL)
  for (const slot of slots) {
    const candidates = slot.candidates ?? allTeamIds
    const seed = Array.from(slot.id).reduce((sum, c) => sum + c.charCodeAt(0), 0)
    const rawWeights = candidates.map((teamId, index) => {
      const teamSeed = Array.from(teamId).reduce((sum, c) => sum + c.charCodeAt(0), 0)
      return 8 + ((seed + teamSeed + index * 17) % 33)
    })
    const rawTotal = rawWeights.reduce((sum, value) => sum + value, 0)
    const shares = candidates.map((teamId, index) => {
      const pickShare = rawWeights[index] / rawTotal
      return {
        teamId,
        pickCount: Math.round(totalPicks * pickShare),
        pickShare,
      }
    })
    result.push({
      slotId: slot.id,
      capturedAt: captured,
      frozen: false,
      totalPicks,
      shares,
    })
  }
  return result
}

const UCL_SLOTS = buildSlots()

const UCL_TEACHING: TeachingCard = {
  steps: [
    {
      title: '入场',
      body: '付 10 USDT 入场费，所有人的入场费汇成奖金池，平台抽水 10%。',
    },
    {
      title: '填表',
      body: '填完整张对阵树。每命中一个 slot 按轮次拿分：R16=1 分、QF=2 分、SF=4 分、决赛=8 分，满分 32 分。',
    },
    {
      title: '派奖',
      body: '决赛后按"本人得分 / 全员总分 × 净池"的比例分奖。命中越多，分奖越多。',
    },
  ],
  worked_example: {
    correctSlots: 7,
    selfScore: 12,
    aggregateScore: 5000,
    netPool: 9000,
    payout: 21.6,
  },
}

const UCL_CONFIG_META: TournamentConfigMeta = {
  configurableByOps: [
    'name',
    'shortName',
    'region',
    'phase',
    'entryFee',
    'rake',
    'lockAt',
    'settleAt',
    'fundLockHint',
    'tiebreakerLabel',
    'teachingCard',
    'slots[].candidates',
  ],
  immutableAfterOpen: ['entryFee', 'rake', 'rounds[].weight', 'tiebreakerLabel'],
  notes: '一旦赛事进入 open 状态，资金参数和评分权重不得变更，确保参赛公平。',
}

const PLATFORM_GROWTH_CONTEXT: BracketGrowthContext = {
  baseBusiness: 'perp_dex',
  marketVertical: 'prediction_market',
  currentDau: 500,
  tabImpressions: 386,
  detailViews: 214,
  submittedEntries: 126,
  sourceMix: [
    { sourceType: 'promo_code', label: '代理推广码', share: 0.38 },
    { sourceType: 'invite_code', label: '普通邀请码', share: 0.21 },
    { sourceType: 'organic', label: '站内自然访问', share: 0.31 },
    { sourceType: 'share', label: '预测表分享回流', share: 0.1 },
  ],
  lightweightOpsLabel: '站内轻量验证：预测市场新板块，不新增独立增长系统。',
}

const AFFILIATE_POLICY: BracketAffiliatePolicy = {
  enabled: true,
  label: '支持既有代理推广码归因',
  basis: 'platform_revenue',
  note: '返佣沿用平台代理体系，按预测市场平台收入口径计算，不改变奖金池净池。',
}

const INVITE_POLICY: BracketAffiliatePolicy = {
  enabled: true,
  label: '支持既有普通邀请码归因',
  basis: 'platform_revenue',
  note: '普通用户邀请码沿用一级返佣和固定比例；分享预测表不覆盖已有归属。',
}

export const DEFAULT_ATTRIBUTION: BracketAttribution = {
  sourceType: 'promo_code',
  sourceLabel: '代理推广码归因',
  sourceCodeMasked: 'AGT-•••-88',
  keepExistingAttribution: true,
  rebateBasisLabel: '按平台预测市场收入口径归因，不从奖金池二次扣除。',
}

export const UCL_BRACKET: BracketTournament = {
  id: 'pool-ucl-2026',
  name: 'UEFA Champions League 2026 淘汰赛预测大赛',
  shortName: '欧冠 2026 淘汰赛',
  competitionId: 'future-ucl-2026',
  region: '欧洲',
  phase: '淘汰赛 R16 起',
  headline: '一份对阵树预测，入场费汇成奖金池，按命中率分奖',
  status: 'open',
  rounds: [
    { id: 'R16', label: '1/8 决赛', weight: 1, slotCount: 8 },
    { id: 'QF', label: '1/4 决赛', weight: 2, slotCount: 4 },
    { id: 'SF', label: '半决赛', weight: 4, slotCount: 2 },
    { id: 'F', label: '决赛', weight: 8, slotCount: 1 },
  ],
  slots: UCL_SLOTS,
  openAt: UCL_OPEN_AT,
  entryFee: 10,
  currency: 'USDT',
  rake: 0.1,
  minEntrants: 1000,
  guaranteedPool: 50000,
  lockAt: UCL_LOCK_AT,
  settleAt: UCL_SETTLE_AT,
  fundLockHint: '入场费将锁定约 8 周（2026-05-20 锁定，2026-07-12 决赛后派奖）。锁前可全额撤回，锁后无法取消。',
  tiebreakerLabel: '决赛总进球数（含加时）',
  lateStrategyLabel: '用户预测分布为约 15 分钟延迟快照，锁定前 2 小时冻结。',
  distributionPolicyLabel: '分布按 slot 展示；下游轮次会根据你当前 bracket 候选球队过滤展示。',
  teachingCard: UCL_TEACHING,
  poolSnapshot: {
    entrants: 4218,
    grossPool: 42180,
    netPool: 45000,
    aggregateScore: 38104,
    capturedAt: '2026-05-03T00:30:00.000Z',
  },
  distribution: makeDistribution(UCL_SLOTS, 4218),
  configMeta: UCL_CONFIG_META,
  marketVertical: 'prediction_market',
  growthContext: PLATFORM_GROWTH_CONTEXT,
  affiliatePolicy: AFFILIATE_POLICY,
  invitePolicy: INVITE_POLICY,
}

// -----------------------------------------------------------------------------
// 世界杯 2026 淘汰赛 - 即将开放卡片占位
// -----------------------------------------------------------------------------

export const WC_BRACKET_PLACEHOLDER: BracketTournament = {
  id: 'pool-wc-2026',
  name: 'FIFA World Cup 2026 淘汰赛预测大赛',
  shortName: '世界杯 2026 淘汰赛',
  competitionId: 'future-wc-2026',
  region: '北美',
  phase: '淘汰赛 16 强起',
  headline: '小组赛结束后开放报名',
  status: 'upcoming',
  rounds: [
    { id: 'R16', label: '16 强', weight: 1, slotCount: 8 },
    { id: 'QF', label: '8 强', weight: 2, slotCount: 4 },
    { id: 'SF', label: '半决赛', weight: 4, slotCount: 2 },
    { id: 'F', label: '决赛', weight: 8, slotCount: 1 },
  ],
  slots: [],
  openAt: '2026-06-28T12:00:00.000Z',
  entryFee: 10,
  currency: 'USDT',
  rake: 0.1,
  minEntrants: 2000,
  guaranteedPool: 100000,
  lockAt: '2026-07-04T16:00:00.000Z',
  settleAt: '2026-07-19T19:00:00.000Z',
  fundLockHint: '入场费将锁定约 2 周（2026-07-04 锁定，2026-07-19 决赛后派奖）。锁前可全额撤回。',
  tiebreakerLabel: '决赛总进球数（含加时）',
  lateStrategyLabel: '报名开放后展示约 15 分钟延迟的用户预测分布。',
  distributionPolicyLabel: '对阵树确认前不展示 slot 分布；开放报名后按 slot 展示。',
  teachingCard: UCL_TEACHING,
  poolSnapshot: {
    entrants: 0,
    grossPool: 0,
    netPool: 0,
    aggregateScore: 0,
    capturedAt: '2026-02-15T10:00:00.000Z',
  },
  distribution: [],
  configMeta: UCL_CONFIG_META,
  marketVertical: 'prediction_market',
  growthContext: {
    ...PLATFORM_GROWTH_CONTEXT,
    tabImpressions: 148,
    detailViews: 0,
    submittedEntries: 0,
    lightweightOpsLabel: '即将开放赛事仅承接预约心智，不做单独大促。',
  },
  affiliatePolicy: AFFILIATE_POLICY,
  invitePolicy: INVITE_POLICY,
}

export const bracketTournaments: BracketTournament[] = [UCL_BRACKET, WC_BRACKET_PLACEHOLDER]

export function getBracketTournamentById(id: string): BracketTournament | undefined {
  return bracketTournaments.find((t) => t.id === id)
}

// -----------------------------------------------------------------------------
// 示例用户 entries（草稿 / 已提交 / 已锁定 / 进行中 / 已结算 / 已撤回）
// -----------------------------------------------------------------------------

const SELF_DRAFT_PICKS: Record<string, string> = {
  'R16-1': 'real-madrid',
  'R16-2': 'arsenal',
  'R16-3': 'psg',
}

const SELF_SUBMITTED_PICKS: Record<string, string> = {
  'R16-1': 'real-madrid',
  'R16-2': 'arsenal',
  'R16-3': 'psg',
  'R16-4': 'barcelona',
  'R16-5': 'atletico',
  'R16-6': 'liverpool',
  'R16-7': 'dortmund',
  'R16-8': 'chelsea',
  'QF-1': 'real-madrid',
  'QF-2': 'psg',
  'QF-3': 'atletico',
  'QF-4': 'dortmund',
  'SF-1': 'real-madrid',
  'SF-2': 'atletico',
  'F-1': 'real-madrid',
}

// 进行中：R16 全部结算，QF 部分结算
const RUNNING_RESULTS: Record<string, string> = {
  'R16-1': 'real-madrid',
  'R16-2': 'arsenal',
  'R16-3': 'inter',
  'R16-4': 'barcelona',
  'R16-5': 'atletico',
  'R16-6': 'liverpool',
  'R16-7': 'sporting',
  'R16-8': 'chelsea',
  'QF-1': 'real-madrid',
  'QF-2': 'barcelona',
}

// 已结算：完整 results（用于 SettlementReview 示例）
const SETTLED_RESULTS: Record<string, string> = {
  ...RUNNING_RESULTS,
  'QF-3': 'atletico',
  'QF-4': 'dortmund',
  'SF-1': 'real-madrid',
  'SF-2': 'atletico',
  'F-1': 'real-madrid',
}

const RUNNING_BREAKDOWN = scoreEntry(SELF_SUBMITTED_PICKS, RUNNING_RESULTS, UCL_SLOTS).breakdown
const RUNNING_TOTAL = RUNNING_BREAKDOWN.reduce((s, b) => s + b.points, 0)
const RUNNING_AGG = 38104
const RUNNING_NET = 45000
const RUNNING_PROJECTED = projectPayout(RUNNING_TOTAL, RUNNING_AGG, RUNNING_NET)

const SETTLED_BREAKDOWN = scoreEntry(SELF_SUBMITTED_PICKS, SETTLED_RESULTS, UCL_SLOTS).breakdown
const SETTLED_TOTAL = SETTLED_BREAKDOWN.reduce((s, b) => s + b.points, 0)
const SETTLED_AGG = 41200
const SETTLED_NET = 45000
const SETTLED_FINAL = projectPayout(SETTLED_TOTAL, SETTLED_AGG, SETTLED_NET)
const SETTLED_REVIEW = buildSettlementReview(SELF_SUBMITTED_PICKS, SETTLED_RESULTS, UCL_SLOTS)
// 把 review 中的 teamId/Label 替换为可读球队名
for (const slot of SETTLED_REVIEW.perSlot) {
  slot.pickedTeamLabel = slot.pickedTeamId ? teamLabel(slot.pickedTeamId) : '—'
  slot.actualWinnerLabel = slot.actualWinnerId ? teamLabel(slot.actualWinnerId) : '—'
}

export const sampleEntries: UserBracketEntry[] = [
  {
    id: 'entry-self-draft',
    tournamentId: UCL_BRACKET.id,
    userName: '我（草稿）',
    picks: SELF_DRAFT_PICKS,
    status: 'draft',
    attribution: {
      sourceType: 'invite_code',
      sourceLabel: '普通邀请码归因',
      sourceCodeMasked: 'INV-•••-31',
      keepExistingAttribution: true,
      rebateBasisLabel: '沿用普通用户一级邀请口径。',
    },
  },
  {
    id: 'entry-self-submitted',
    tournamentId: UCL_BRACKET.id,
    userName: '我',
    picks: SELF_SUBMITTED_PICKS,
    tiebreakerGuess: 3,
    status: 'submitted',
    submittedAt: '2026-02-12T18:30:00.000Z',
    shareId: 'share-self-submitted',
    attribution: DEFAULT_ATTRIBUTION,
  },
  {
    id: 'entry-self-locked',
    tournamentId: UCL_BRACKET.id,
    userName: '我',
    picks: SELF_SUBMITTED_PICKS,
    tiebreakerGuess: 3,
    status: 'locked',
    submittedAt: '2026-02-12T18:30:00.000Z',
    lockedAt: UCL_LOCK_AT,
    shareId: 'share-self-locked',
    attribution: DEFAULT_ATTRIBUTION,
  },
  {
    id: 'entry-self-running',
    tournamentId: UCL_BRACKET.id,
    userName: '我',
    picks: SELF_SUBMITTED_PICKS,
    tiebreakerGuess: 3,
    status: 'locked',
    submittedAt: '2026-02-12T18:30:00.000Z',
    lockedAt: UCL_LOCK_AT,
    scoreBreakdown: RUNNING_BREAKDOWN,
    totalScore: RUNNING_TOTAL,
    rankDisplay: 312,
    scoreShare: RUNNING_AGG > 0 ? RUNNING_TOTAL / RUNNING_AGG : 0,
    projectedPayout: +RUNNING_PROJECTED.toFixed(2),
    shareId: 'share-self-running',
    attribution: DEFAULT_ATTRIBUTION,
  },
  {
    id: 'entry-self-settled',
    tournamentId: UCL_BRACKET.id,
    userName: '我',
    picks: SELF_SUBMITTED_PICKS,
    tiebreakerGuess: 3,
    status: 'settled',
    submittedAt: '2026-02-12T18:30:00.000Z',
    lockedAt: UCL_LOCK_AT,
    settledAt: UCL_SETTLE_AT,
    scoreBreakdown: SETTLED_BREAKDOWN,
    totalScore: SETTLED_TOTAL,
    rankDisplay: 87,
    scoreShare: SETTLED_AGG > 0 ? SETTLED_TOTAL / SETTLED_AGG : 0,
    projectedPayout: +SETTLED_FINAL.toFixed(2),
    finalPayout: +SETTLED_FINAL.toFixed(2),
    shareId: 'share-self-settled',
    review: SETTLED_REVIEW,
    attribution: {
      sourceType: 'share',
      sourceLabel: '预测表分享回流',
      sourceCodeMasked: 'share-self-running',
      shareSourceEntryId: 'entry-self-running',
      keepExistingAttribution: true,
      rebateBasisLabel: '记录分享来源，但保留用户既有推广 / 邀请归属。',
    },
  },
  {
    id: 'entry-self-refunded',
    tournamentId: UCL_BRACKET.id,
    userName: '我',
    picks: SELF_DRAFT_PICKS,
    status: 'refunded',
    submittedAt: '2026-02-10T11:20:00.000Z',
    refundedAt: '2026-02-11T09:05:00.000Z',
    refundReason: 'user_withdraw',
    attribution: DEFAULT_ATTRIBUTION,
  },
  {
    id: 'entry-self-minimum-refunded',
    tournamentId: UCL_BRACKET.id,
    userName: '我',
    picks: SELF_SUBMITTED_PICKS,
    tiebreakerGuess: 3,
    status: 'refunded',
    submittedAt: '2026-05-03T09:20:00.000Z',
    refundedAt: '2026-05-20T20:05:00.000Z',
    refundReason: 'minimum_not_met',
    attribution: DEFAULT_ATTRIBUTION,
  },
]

export function getEntryByShareId(shareId: string): UserBracketEntry | undefined {
  return sampleEntries.find((e) => e.shareId === shareId)
}

// -----------------------------------------------------------------------------
// 全员得分榜 mock 前 100 名
// -----------------------------------------------------------------------------

function makeLeaderboard(): LeaderboardRow[] {
  const rows: LeaderboardRow[] = []
  // 头部高分用户：分数从 28 递减到 12
  const seedNames = [
    'Iniesta_88', 'kingofsalt', 'tactic_geek', 'liu_3pt', 'fc_legend', 'ronaldoBR',
    'lazyfan99', 'nine_lives', 'tikitaka', 'maradona88', 'pepe_fan', 'bbcfanatic',
    'goalden_eyes', 'guardiola_x', 'roberto.c', 'beckhamLite', 'aniki_kane', 'iker.casillas',
    'frabbie', 'thiago_brasil', 'darksisko', 'monchi.fan', 'kaka_22',
  ]
  for (let rank = 1; rank <= 360; rank++) {
    let score: number
    if (rank === 1) score = 28
    else if (rank <= 10) score = 26 - Math.floor((rank - 1) * 0.4)
    else if (rank <= 30) score = 22 - Math.floor((rank - 10) * 0.3)
    else if (rank <= 60) score = 16 - Math.floor((rank - 30) * 0.15)
    else if (rank <= 180) score = 12 - Math.floor((rank - 60) * 0.04)
    else score = 8 - Math.floor((rank - 180) * 0.025)
    if (score < 1) score = 1

    let name: string
    if (rank <= seedNames.length) name = seedNames[rank - 1]
    else name = `predictor_${String(rank).padStart(3, '0')}`

    rows.push({
      tournamentId: UCL_BRACKET.id,
      rankDisplay: rank,
      userName: name,
      isSelf: false,
      totalScore: score,
      scoreShare: score / SETTLED_AGG,
      projectedPayout: +projectPayout(score, SETTLED_AGG, SETTLED_NET).toFixed(2),
      tiebreakerGuess: 1 + (rank % 5),
    })
  }
  return rows
}

export const sampleLeaderboard = makeLeaderboard()

export const sampleSelfRunningRow: LeaderboardRow = {
  tournamentId: UCL_BRACKET.id,
  rankDisplay: 312,
  userName: '我',
  isSelf: true,
  totalScore: RUNNING_TOTAL,
  scoreShare: RUNNING_AGG > 0 ? RUNNING_TOTAL / RUNNING_AGG : 0,
  projectedPayout: +RUNNING_PROJECTED.toFixed(2),
  tiebreakerGuess: 3,
}

// -----------------------------------------------------------------------------
// 时间和状态计算辅助
// -----------------------------------------------------------------------------

export function formatLockCountdown(lockAt: string, now: Date = new Date()): string {
  const diff = new Date(lockAt).getTime() - now.getTime()
  if (diff <= 0) return '已锁定'
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return `${days} 天 ${hours} 小时`
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  return `${minutes} 分钟`
}

export function describeStatus(status: BracketTournamentStatus): string {
  switch (status) {
    case 'upcoming':
      return '即将开放'
    case 'open':
      return '报名中'
    case 'locked':
      return '已锁定'
    case 'running':
      return '进行中'
    case 'settled':
      return '已结算'
    case 'cancelled':
      return '已取消'
  }
}

export function describeEntryStatus(status: UserBracketEntryStatus): string {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'submitted':
      return '已提交'
    case 'locked':
      return '已锁定'
    case 'settled':
      return '已结算'
    case 'refunded':
      return '已退款'
  }
}

export function describeRefundReason(reason: BracketRefundReason): string {
  switch (reason) {
    case 'user_withdraw':
      return '用户锁前撤回'
    case 'tournament_cancelled':
      return '赛事取消'
    case 'aggregate_zero':
      return '全员总分为 0 兜底退款'
    case 'minimum_not_met':
      return '未达最低参赛人数'
  }
}

export function describeAttribution(attribution?: BracketAttribution): string {
  if (!attribution) return '站内自然访问'
  if (attribution.sourceCodeMasked) {
    return `${attribution.sourceLabel} · ${attribution.sourceCodeMasked}`
  }
  return attribution.sourceLabel
}
