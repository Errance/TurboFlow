import type { Market, BetSubject, SoccerMatch } from './types'

export type SoccerAmmPriceFormat = 'probability' | 'european'
export type SoccerAmmSide = 'buy' | 'sell'
export type SoccerAmmMarketKind = 'binary' | 'multi'
export type SoccerAmmSubjectScope = 'match' | 'competition' | 'tie' | 'season'
export type SoccerAmmMarketStatus = 'open' | 'paused' | 'closed' | 'settled' | 'void'

export interface SoccerAmmSubject {
  scope: SoccerAmmSubjectScope
  id: string
  label: string
  closesAt?: string
  resolutionTimeLabel: string
  resolutionSource: string
}

export interface SoccerAmmOutcome {
  id: string
  subject: SoccerAmmSubject
  marketTitle: string
  marketKind: SoccerAmmMarketKind
  groupLabel?: string
  label: string
  questionTitle: string
  resolutionRule: string
  probability: number
  liquidity: number
  volume24h: number
  priceChange24h: number
  status: SoccerAmmMarketStatus
  voidRule: string
  delayOrDisputePolicy: string
}

export interface SoccerAmmPosition {
  id: string
  outcomeId: string
  subjectLabel: string
  marketTitle: string
  outcomeLabel: string
  shares: number
  avgPrice: number
  currentProbability: number
  realizedPnl: number
  updatedAt: string
}

export interface SoccerAmmTrade {
  id: string
  side: SoccerAmmSide
  outcomeId: string
  marketTitle: string
  outcomeLabel: string
  shares: number
  avgPrice: number
  collateral: number
  realizedPnl?: number
  createdAt: string
}

export interface SoccerAmmQuote {
  avgPrice: number
  endPrice: number
  priceImpact: number
  fee: number
  shares: number
  collateral: number
  expiresAt: number
}

const now = Date.now()

export const SOCCER_AMM_QUOTE_TTL_MS = 30_000
export const SOCCER_AMM_FEE_RATE = 0.006
export const SOCCER_AMM_DUST_THRESHOLD_USDT = 1

export function probabilityFromEuropeanOdds(odds: number): number {
  if (!Number.isFinite(odds) || odds <= 1) return 0.5
  return Math.min(0.95, Math.max(0.03, 1 / odds))
}

export function europeanOddsFromProbability(probability: number): number {
  const safe = Math.min(0.95, Math.max(0.03, probability))
  return +(1 / safe).toFixed(2)
}

export function formatSharePrice(probability: number): string {
  const safe = Math.min(0.99, Math.max(0.01, probability))
  const cents = safe * 100
  if (cents > 0 && cents < 100) {
    const rounded = Math.round(cents * 10) / 10
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}¢`
  }
  return `$${safe.toFixed(2)}`
}

export function formatAmmPrice(probability: number, format: SoccerAmmPriceFormat): string {
  if (format === 'european') return europeanOddsFromProbability(probability).toFixed(2)
  return formatSharePrice(probability)
}

export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`
}

export function formatImpliedProbability(probability: number): string {
  return `${formatProbability(probability)} implied`
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5:-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function subjectFromMatch(match: SoccerMatch): SoccerAmmSubject {
  return {
    scope: 'match',
    id: match.id,
    label: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    closesAt: `${match.date} ${match.time}`,
    resolutionTimeLabel: '比赛官方赛果确认后',
    resolutionSource: `${match.league} 官方比赛结果`,
  }
}

export function subjectFromBetSubject(subject: BetSubject): SoccerAmmSubject {
  return {
    scope: subject.scope,
    id: subject.subjectId,
    label: subject.subjectLabel,
    closesAt: subject.closesAt,
    resolutionTimeLabel: subject.resolutionTimeLabel ?? '官方结果确认后',
    resolutionSource: subject.resolutionSource ?? '官方结果',
  }
}

function marketKind(market: Market): SoccerAmmMarketKind {
  if (market.type === 'oddsTable') return 'binary'
  if (market.type === 'buttonGroup' && market.options.length === 2) return 'binary'
  return 'multi'
}

function questionFor(marketTitle: string, label: string, subjectLabel: string): string {
  if (marketTitle === '胜平负') return `${subjectLabel} 的全场赛果是否为「${label}」？`
  if (marketTitle === '开球权') return `${subjectLabel} 是否由「${label}」先开球？`
  if (marketTitle === '大小球') return `${subjectLabel} 全场总进球是否为「${label}」？`
  if (marketTitle === '让球') return `${subjectLabel} 让球后结果是否为「${label}」？`
  if (marketTitle === '让球 0:1') return `${subjectLabel} 在让球 0:1 规则下是否为「${label}」？`
  if (marketTitle === '总进球数') return `${subjectLabel} 全场总进球数是否为「${label}」？`
  if (marketTitle === '波胆') return `${subjectLabel} 精确比分是否为「${label}」？`
  if (marketTitle.includes('冠军')) return `${label} 是否赢得${marketTitle.includes('世界杯') ? '世界杯' : marketTitle}？`
  if (marketTitle.includes('出线') || marketTitle.includes('进入') || marketTitle.includes('晋级') || marketTitle.includes('资格')) return `${label} 是否达成「${marketTitle}」？`
  return `${subjectLabel} · ${marketTitle} · ${label} 是否发生？`
}

function resolutionRuleFor(marketTitle: string): string {
  if (marketTitle === '波胆') return '按全场官方比分结算，精确比分命中兑付 1，否则兑付 0。'
  if (marketTitle === '大小球') return '按官方全场总进球数与盘口线比较结算。'
  if (marketTitle.includes('冠军')) return '按官方冠军结果结算，正确 outcome 每份兑付 1。'
  if (marketTitle.includes('出线') || marketTitle.includes('进入') || marketTitle.includes('晋级') || marketTitle.includes('资格')) return '按官方晋级、出线或资格结果结算。'
  return '按官方赛果和该市场规则结算，正确 outcome 每份兑付 1。'
}

function groupForScore(label: string): string | undefined {
  const match = label.match(/^(\d+):(\d+)$/)
  if (!match) return '其他比分'
  const home = Number(match[1])
  const away = Number(match[2])
  if (home > away) return '主胜比分'
  if (home === away) return '平局比分'
  return '客胜比分'
}

function baseOutcome(
  subject: SoccerAmmSubject,
  market: Market,
  label: string,
  odds: number,
  index: number,
  groupLabel?: string,
): SoccerAmmOutcome {
  const probability = probabilityFromEuropeanOdds(odds)
  const liquidity = 12_000 + index * 750 + subject.id.length * 120
  return {
    id: `${subject.id}::${slug(market.title)}::${slug(label)}`,
    subject,
    marketTitle: market.title,
    marketKind: marketKind(market),
    groupLabel,
    label,
    questionTitle: questionFor(market.title, label, subject.label),
    resolutionRule: resolutionRuleFor(market.title),
    probability,
    liquidity,
    volume24h: Math.round(liquidity * (0.08 + probability * 0.14)),
    priceChange24h: +(((index % 5) - 2) * 0.012).toFixed(3),
    status: market.status === 'suspended' || market.status === 'upcoming' ? 'paused' : market.status === 'settled' ? 'settled' : market.status === 'void' || market.status === 'cancelled' ? 'void' : 'open',
    voidRule: '官方取消、市场失效或结算来源无法确认时按 void 规则退回可兑付价值。',
    delayOrDisputePolicy: 'VAR、延期、腰斩、官方改判或资格递补时进入暂停或等待官方确认。',
  }
}

export function enumerateAmmMarketOutcomes(
  market: Market,
  subject: SoccerAmmSubject,
): SoccerAmmOutcome[] {
  const outcomes: SoccerAmmOutcome[] = []
  const push = (label: string, odds: number, groupLabel?: string) => {
    outcomes.push(baseOutcome(subject, market, label, odds, outcomes.length, groupLabel))
  }

  switch (market.type) {
    case 'buttonGroup':
    case 'rangeButtons':
      market.options.forEach((option) => push(option.label, option.odds))
      break
    case 'oddsTable':
      market.rows.forEach((row) => {
        row.odds.forEach((odds, index) => push(`${market.columns[index]} ${row.line}`.trim(), odds, row.line))
      })
      break
    case 'scoreGrid':
      Object.entries(market.odds).forEach(([label, odds]) => push(label, odds, groupForScore(label)))
      break
    case 'playerList':
      market.players.forEach((player) => {
        player.odds.forEach((odds, index) => push(`${player.name} ${market.tiers[index] ?? ''}`.trim(), odds))
      })
      break
    case 'comboGrid':
      market.cells.forEach((cell) => push(cell.label, cell.odds))
      break
  }

  return outcomes
}

export function enumerateMatchAmmOutcomes(match: SoccerMatch): SoccerAmmOutcome[] {
  const subject = subjectFromMatch(match)
  return match.tabs.flatMap((tab) => tab.markets.flatMap((market) => enumerateAmmMarketOutcomes(market, subject)))
}

export function quoteAmmTrade(
  outcome: SoccerAmmOutcome,
  side: SoccerAmmSide,
  value: number,
  mode: 'collateral' | 'shares',
): SoccerAmmQuote | null {
  if (!Number.isFinite(value) || value <= 0) return null
  const signed = side === 'buy' ? 1 : -1
  const basePrice = outcome.probability
  const rawShares = mode === 'shares' ? value : value / basePrice
  const depthRatio = Math.min(0.28, rawShares / Math.max(outcome.liquidity, 1))
  const priceImpact = +(depthRatio * (side === 'buy' ? 1 : -0.85)).toFixed(4)
  const endPrice = Math.min(0.96, Math.max(0.03, basePrice + signed * Math.abs(priceImpact)))
  const avgPrice = +((basePrice + endPrice) / 2).toFixed(4)
  const shares = mode === 'shares' ? rawShares : value / avgPrice
  const collateral = shares * avgPrice
  const fee = +(collateral * SOCCER_AMM_FEE_RATE).toFixed(2)
  return {
    avgPrice,
    endPrice,
    priceImpact: Math.abs(priceImpact),
    fee,
    shares: +shares.toFixed(4),
    collateral: +collateral.toFixed(2),
    expiresAt: Date.now() + SOCCER_AMM_QUOTE_TTL_MS,
  }
}

export const seedAmmPositions: SoccerAmmPosition[] = [
  {
    id: 'amm-pos-botafogo-home',
    outcomeId: 'botafogo-mirassol::胜平负::rj博塔弗戈',
    subjectLabel: 'RJ博塔弗戈 vs 米拉索尔',
    marketTitle: '胜平负',
    outcomeLabel: 'RJ博塔弗戈',
    shares: 84,
    avgPrice: 0.52,
    currentProbability: 0.57,
    realizedPnl: 0,
    updatedAt: new Date(now - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'amm-pos-world-cup-france',
    outcomeId: 'future-world-cup-2026::世界杯冠军::法国',
    subjectLabel: 'FIFA World Cup 2026',
    marketTitle: '世界杯冠军',
    outcomeLabel: '法国',
    shares: 60,
    avgPrice: 0.15,
    currentProbability: 0.17,
    realizedPnl: 2.8,
    updatedAt: new Date(now - 1000 * 60 * 40).toISOString(),
  },
]
