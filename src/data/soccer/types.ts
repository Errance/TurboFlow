export interface SoccerTeam {
  name: string
  shortName: string
}

export interface MatchPlayer {
  name: string
  number: number
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  gridRow: number
  gridCol: number
  isCaptain?: boolean
}

export interface MatchLineup {
  formation: string
  players: MatchPlayer[]
  substitutes: MatchPlayer[]
  manager: string
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var'
  team: 'home' | 'away'
  playerName: string
  detail?: string
}

export interface H2HMatch {
  date: string
  homeTeam: string
  awayTeam: string
  score: { home: number; away: number }
  competition: string
}

export interface HeadToHead {
  homeWins: number
  draws: number
  awayWins: number
  matches: H2HMatch[]
  avgGoals: { homeScored: number; homeConceded: number; awayScored: number; awayConceded: number }
}

export interface MatchStats {
  possession: [number, number]
  shots: [number, number]
  shotsOnTarget: [number, number]
  corners: [number, number]
  fouls: [number, number]
  offsides: [number, number]
  yellowCards: [number, number]
  redCards: [number, number]
}

export interface SoccerMatch {
  id: string
  league: string
  leagueId: string
  homeTeam: SoccerTeam
  awayTeam: SoccerTeam
  date: string
  time: string
  status: 'scheduled' | 'live' | 'finished' | 'interrupted' | 'abandoned' | 'postponed' | 'cancelled'
  score?: { home: number; away: number }
  currentMinute?: number
  tabs: MatchTab[]
  referee?: string
  venue?: string
  homeLineup?: MatchLineup
  awayLineup?: MatchLineup
  events?: MatchEvent[]
  headToHead?: HeadToHead
  stats?: MatchStats
}

export type BetSubjectScope = 'match' | 'competition' | 'tie' | 'season'

export interface BetSubject {
  scope: BetSubjectScope
  subjectId: string
  subjectLabel: string
  closesAt?: string
  resolutionTimeLabel?: string
  resolutionSource?: string
}

export interface MatchTab {
  id: string
  label: string
  markets: Market[]
}

export type Market =
  | ButtonGroupMarket
  | OddsTableMarket
  | ScoreGridMarket
  | PlayerListMarket
  | ComboGridMarket
  | RangeButtonsMarket

export type MarketStatus = 'open' | 'upcoming' | 'suspended' | 'settled' | 'void' | 'cancelled' | 'hidden'
export type SettlementResult = 'win' | 'loss' | 'void' | 'push' | 'half_win' | 'half_loss' | 'dead_heat'

export type MyBetStatus = 'pending' | 'placed' | 'live' | 'settled' | 'cashed_out'

export type BetType = 'multi_single' | 'accumulator'

interface MarketBase {
  status?: MarketStatus
  settlementResult?: SettlementResult
  winningSelection?: string
}

export interface ButtonGroupMarket extends MarketBase {
  type: 'buttonGroup'
  title: string
  options: { label: string; odds: number }[]
}

export interface OddsTableMarket extends MarketBase {
  type: 'oddsTable'
  title: string
  columns: string[]
  rows: { line: string; odds: number[] }[]
}

export interface ScoreGridMarket extends MarketBase {
  type: 'scoreGrid'
  title: string
  homeRange: number[]
  awayRange: number[]
  odds: Record<string, number>
}

export interface PlayerListMarket extends MarketBase {
  type: 'playerList'
  title: string
  tiers: string[]
  players: { name: string; odds: number[] }[]
}

export interface ComboGridMarket extends MarketBase {
  type: 'comboGrid'
  title: string
  rowHeaders: string[]
  colHeaders: string[]
  cells: { label: string; odds: number }[]
}

export interface RangeButtonsMarket extends MarketBase {
  type: 'rangeButtons'
  title: string
  options: { label: string; odds: number }[]
}

export interface SoccerLeague {
  id: string
  name: string
  country: string
  matchCount: number
}

export interface BetSlipItem {
  id: string
  matchId: string
  matchLabel: string
  subject?: BetSubject
  marketTitle: string
  selection: string
  odds: number
}

/**
 * 单腿注单。多笔单注会拆成多张 legs 长度为 1 的注单；串关按实际腿数。
 *
 * oddsAtPlacement 在下单瞬间快照，结算期间不再变更；
 * oddsAfterRecalc 仅在 push/void 触发重算时写入（= 1.0）。
 */
export interface MyBetLeg {
  id: string
  matchId: string
  matchLabel: string
  subject?: BetSubject
  marketTitle: string
  selection: string
  oddsAtPlacement: number
  oddsAfterRecalc?: number
  status?: MyBetStatus
  result?: SettlementResult
}

/**
 * 历史注单。
 *
 * 旧 mock schema 保留 amount/payout/result 三字段以向后兼容 MyBetsPanel 展示；
 * 新 schema（Phase 1+）使用 stake/potentialReturn/legs 等字段。
 * 两套字段在迁移期间并存，读写时按 "??" 优先级兜底。
 */
export interface MyBetItem {
  id: string
  matchLabel: string
  subject?: BetSubject
  marketTitle: string
  selection: string
  odds: number

  // --- 旧 schema（仍被 MyBetsPanel 引用，Phase 5 会重构后移除） ---
  amount: number
  result: 'win' | 'loss' | 'push'
  payout: number

  // --- Phase 0 新增扩展字段（全部 optional，便于渐进迁移） ---
  status?: MyBetStatus
  /** 结算后的最终结果，含 half_win / half_loss / dead_heat */
  settlementResult?: SettlementResult
  /** ISO 8601 下单时间 */
  placedAt?: string
  /** ISO 8601 结算时间 */
  settledAt?: string
  /** 用户可见的注单编码，形如 TF-ABCD1234 */
  betCode?: string
  betType?: BetType
  /** 多笔单注 = 1；串关 ≥ 2 */
  legs?: MyBetLeg[]
  stake?: number
  currency?: 'USDT'
  potentialReturn?: number
  potentialProfit?: number
  cashout?: {
    availablePrice: number
    minutesUntilExpire: number
    expiresAt?: string
    isSimulated?: boolean
    needsRequote?: boolean
  }
}

/** Re-export 由 marketFamily.ts 定义的 MarketFamily 类型，让 types.ts 成为单一真源。 */
export type { MarketFamily } from './marketFamily'
