import type { BinaryFutureSide, Market, BetSubject, SoccerMatch } from './types'

export type SoccerAmmPriceFormat = 'probability' | 'european'
export type SoccerAmmSide = 'buy' | 'sell'
export type SoccerAmmMarketKind = 'binary' | 'multi'
export type SoccerAmmSubjectScope = 'match' | 'competition' | 'tie' | 'season'
export type SoccerAmmMarketStatus = 'open' | 'paused' | 'closed' | 'settled' | 'void'
/** v7.1：position / trade 结算口径，沿用 v7.0 第 9 节状态机命名。 */
export type SoccerAmmSettlementResult = 'won' | 'lost' | 'void_refunded'

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
  /** v7.1：仅系列赛二元子市场使用；YES / NO 两腿独立成 outcome。 */
  binarySide?: BinaryFutureSide
  /** v7.1：候选稳定 id（如 'france'），用于把同一候选的 YES/NO 分组渲染。 */
  candidate?: string
  /** v7.1：true 表示该 outcome 价格来自互补推导；UI 必须标注「参考价（成交以最新报价为准）」。 */
  isReferencePrice?: boolean
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
  /** v7.1：系列赛持仓所属侧别。 */
  binarySide?: BinaryFutureSide
  /** v7.1：系列赛持仓所属候选稳定 id。 */
  candidate?: string
  /** v7.1：结算后用于在 Portfolio 与历史中区分胜出 / 失败 / void 退款；undefined 表示未结算。 */
  settlement?: SoccerAmmSettlementResult
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
  /** v7.1：成交所属侧别；导出 / 历史列表新增 `side` 列时取该值。 */
  binarySide?: BinaryFutureSide
  candidate?: string
}

export interface SoccerAmmQuote {
  quoteId: string
  providerId: string
  providerQuoteId: string
  avgPrice: number
  endPrice: number
  priceImpact: number
  providerSpread: number
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
  return `${formatProbability(probability)} 隐含概率`
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

interface BinaryMeta {
  binarySide?: BinaryFutureSide
  candidate?: string
  isReferencePrice?: boolean
}

function baseOutcome(
  subject: SoccerAmmSubject,
  market: Market,
  label: string,
  odds: number,
  index: number,
  groupLabel?: string,
  binaryMeta?: BinaryMeta,
): SoccerAmmOutcome {
  const probability = probabilityFromEuropeanOdds(odds)
  const liquidity = 12_000 + index * 750 + subject.id.length * 120
  const sideSuffix = binaryMeta?.binarySide ? `::${binaryMeta.binarySide}` : ''
  return {
    id: `${subject.id}::${slug(market.title)}::${slug(label)}${sideSuffix}`,
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
    binarySide: binaryMeta?.binarySide,
    candidate: binaryMeta?.candidate,
    isReferencePrice: binaryMeta?.isReferencePrice,
  }
}

export function enumerateAmmMarketOutcomes(
  market: Market,
  subject: SoccerAmmSubject,
): SoccerAmmOutcome[] {
  const outcomes: SoccerAmmOutcome[] = []
  const push = (label: string, odds: number, groupLabel?: string, binaryMeta?: BinaryMeta) => {
    outcomes.push(baseOutcome(subject, market, label, odds, outcomes.length, groupLabel, binaryMeta))
  }

  switch (market.type) {
    case 'buttonGroup':
      market.options.forEach((option) => push(option.label, option.odds, undefined, {
        binarySide: option.side,
        candidate: option.candidate,
        isReferencePrice: option.isReferencePrice,
      }))
      break
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
  const providerLimitRatio = Math.min(0.18, rawShares / Math.max(outcome.liquidity, 1))
  const providerSpread = +(providerLimitRatio * (side === 'buy' ? 0.75 : -0.6)).toFixed(4)
  const endPrice = Math.min(0.96, Math.max(0.03, basePrice + signed * Math.abs(providerSpread)))
  const avgPrice = +((basePrice + endPrice) / 2).toFixed(4)
  const shares = mode === 'shares' ? rawShares : value / avgPrice
  const collateral = shares * avgPrice
  const fee = +(collateral * SOCCER_AMM_FEE_RATE).toFixed(2)
  const quoteNonce = `${Date.now().toString(36)}-${Math.abs(hashString(outcome.id)).toString(36)}`
  return {
    quoteId: `rfq-${side}-${quoteNonce}`,
    providerId: 'mm-main-01',
    providerQuoteId: `pq-${quoteNonce}`,
    avgPrice,
    endPrice,
    priceImpact: Math.abs(providerSpread),
    providerSpread: Math.abs(providerSpread),
    fee,
    shares: +shares.toFixed(4),
    collateral: +collateral.toFixed(2),
    expiresAt: Date.now() + SOCCER_AMM_QUOTE_TTL_MS,
  }
}

function hashString(value: string): number {
  return value.split('').reduce((sum, char) => ((sum << 5) - sum + char.charCodeAt(0)) | 0, 0)
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
  // ---- v7.1 系列赛四向持仓样本（buy YES / buy NO / 多候选同 YES / 候选 NO） ----
  // 1. 法国 YES：典型「看涨」持仓
  {
    id: 'amm-pos-wc-france-yes',
    outcomeId: 'future-world-cup-2026::世界杯冠军::法国-是::yes',
    subjectLabel: 'FIFA World Cup 2026',
    marketTitle: '世界杯冠军',
    outcomeLabel: '法国 是',
    shares: 60,
    avgPrice: 0.15,
    currentProbability: 0.17,
    realizedPnl: 2.8,
    updatedAt: new Date(now - 1000 * 60 * 40).toISOString(),
    binarySide: 'yes',
    candidate: 'france',
  },
  // 2. 法国 NO：「看跌法国」直接表达，与「买巴西 YES」payoff 不等价
  {
    id: 'amm-pos-wc-france-no',
    outcomeId: 'future-world-cup-2026::世界杯冠军::法国-否::no',
    subjectLabel: 'FIFA World Cup 2026',
    marketTitle: '世界杯冠军',
    outcomeLabel: '法国 否',
    shares: 25,
    avgPrice: 0.84,
    currentProbability: 0.83,
    realizedPnl: 0,
    updatedAt: new Date(now - 1000 * 60 * 20).toISOString(),
    binarySide: 'no',
    candidate: 'france',
  },
  // 3. 巴西 YES：演示「多候选 YES 同时持有」组合押注
  {
    id: 'amm-pos-wc-brazil-yes',
    outcomeId: 'future-world-cup-2026::世界杯冠军::巴西-是::yes',
    subjectLabel: 'FIFA World Cup 2026',
    marketTitle: '世界杯冠军',
    outcomeLabel: '巴西 是',
    shares: 30,
    avgPrice: 0.16,
    currentProbability: 0.16,
    realizedPnl: 0,
    updatedAt: new Date(now - 1000 * 60 * 90).toISOString(),
    binarySide: 'yes',
    candidate: 'brazil',
  },
  // 4. 阿森纳 NO：英超冠军 NO 侧持仓
  {
    id: 'amm-pos-pl-arsenal-no',
    outcomeId: 'future-premier-league-2026::英超冠军::阿森纳-否::no',
    subjectLabel: 'Premier League 2025/26',
    marketTitle: '英超冠军',
    outcomeLabel: '阿森纳 否',
    shares: 50,
    avgPrice: 0.66,
    currentProbability: 0.65,
    realizedPnl: 0,
    updatedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
    binarySide: 'no',
    candidate: 'arsenal',
  },
  // ---- v7.1 结算样本（胜出 / 失败 / void 退款 各 1） ----
  // 5. 已结算-胜出：阿根廷 YES 兑付 1
  {
    id: 'amm-pos-wc-argentina-yes-settled-won',
    outcomeId: 'future-world-cup-2026::世界杯冠军::阿根廷-是::yes',
    subjectLabel: 'FIFA World Cup 2026',
    marketTitle: '世界杯冠军',
    outcomeLabel: '阿根廷 是',
    shares: 20,
    avgPrice: 0.18,
    currentProbability: 1,
    realizedPnl: 16.4,
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    binarySide: 'yes',
    candidate: 'argentina',
    settlement: 'won',
  },
  // 6. 已结算-失败：曼城 YES 兑付 0
  {
    id: 'amm-pos-pl-mancity-yes-settled-lost',
    outcomeId: 'future-premier-league-2026::英超冠军::曼城-是::yes',
    subjectLabel: 'Premier League 2025/26',
    marketTitle: '英超冠军',
    outcomeLabel: '曼城 是',
    shares: 40,
    avgPrice: 0.34,
    currentProbability: 0,
    realizedPnl: -13.6,
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    binarySide: 'yes',
    candidate: 'mancity',
    settlement: 'lost',
  },
  // 7. 已结算-void 退款：切尔西 NO（赛季因不可抗力宣告无效）
  {
    id: 'amm-pos-pl-chelsea-no-void',
    outcomeId: 'future-premier-league-2026::英超冠军::切尔西-否::no',
    subjectLabel: 'Premier League 2025/26',
    marketTitle: '英超冠军',
    outcomeLabel: '切尔西 否',
    shares: 18,
    avgPrice: 0.88,
    currentProbability: 0.88,
    realizedPnl: 0,
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    binarySide: 'no',
    candidate: 'chelsea',
    settlement: 'void_refunded',
  },
]

// ---- v7.1 系列赛异常样本（报价过期 / 暂停 / 不可卖各 1）：UI 通过 mock outcomeId 触发对应文案 ----
export type SoccerAmmExceptionKind = 'quote_expired' | 'market_suspended' | 'not_sellable'

export interface SoccerAmmExceptionSample {
  id: string
  kind: SoccerAmmExceptionKind
  candidate: string
  binarySide: BinaryFutureSide
  marketTitle: string
  outcomeLabel: string
  message: string
}

export const seedAmmExceptionSamples: SoccerAmmExceptionSample[] = [
  {
    id: 'exc-quote-expired-fr-yes',
    kind: 'quote_expired',
    candidate: 'france',
    binarySide: 'yes',
    marketTitle: '世界杯冠军',
    outcomeLabel: '法国 是',
    message: '报价已过期，请重新获取',
  },
  {
    id: 'exc-market-suspended-br-no',
    kind: 'market_suspended',
    candidate: 'brazil',
    binarySide: 'no',
    marketTitle: '世界杯冠军',
    outcomeLabel: '巴西 否',
    message: '市场暂停，恢复后重新询价',
  },
  {
    id: 'exc-not-sellable-arsenal-no',
    kind: 'not_sellable',
    candidate: 'arsenal',
    binarySide: 'no',
    marketTitle: '英超冠军',
    outcomeLabel: '阿森纳 否',
    message: '当前暂无法提供退出报价',
  },
]

// ---- v7.1 系列赛四向成交历史样本（导出 / 历史列表新增 `side` 列时取 binarySide） ----
export const seedAmmTradeHistory: SoccerAmmTrade[] = [
  {
    id: 'amm-trd-wc-france-yes-buy',
    side: 'buy',
    outcomeId: 'future-world-cup-2026::世界杯冠军::法国-是::yes',
    marketTitle: '世界杯冠军',
    outcomeLabel: '法国 是',
    shares: 60,
    avgPrice: 0.15,
    collateral: 9,
    createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    binarySide: 'yes',
    candidate: 'france',
  },
  {
    id: 'amm-trd-wc-france-yes-sell',
    side: 'sell',
    outcomeId: 'future-world-cup-2026::世界杯冠军::法国-是::yes',
    marketTitle: '世界杯冠军',
    outcomeLabel: '法国 是',
    shares: 10,
    avgPrice: 0.18,
    collateral: 1.8,
    realizedPnl: 0.3,
    createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    binarySide: 'yes',
    candidate: 'france',
  },
  {
    id: 'amm-trd-wc-france-no-buy',
    side: 'buy',
    outcomeId: 'future-world-cup-2026::世界杯冠军::法国-否::no',
    marketTitle: '世界杯冠军',
    outcomeLabel: '法国 否',
    shares: 25,
    avgPrice: 0.84,
    collateral: 21,
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    binarySide: 'no',
    candidate: 'france',
  },
  {
    id: 'amm-trd-pl-arsenal-no-sell',
    side: 'sell',
    outcomeId: 'future-premier-league-2026::英超冠军::阿森纳-否::no',
    marketTitle: '英超冠军',
    outcomeLabel: '阿森纳 否',
    shares: 5,
    avgPrice: 0.67,
    collateral: 3.35,
    realizedPnl: 0.05,
    createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    binarySide: 'no',
    candidate: 'arsenal',
  },
]
