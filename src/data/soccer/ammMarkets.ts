import { matches } from './mockData'

export type AmmCategory = 'single' | 'futures'
export type AmmMarketKind = 'binary' | 'multi'
export type AmmMarketStatus = 'open' | 'paused' | 'view_only' | 'official_pending' | 'settled' | 'void'
export type PriceFormat = 'probability' | 'decimal'
export type TradeSide = 'buy' | 'sell'

export interface AmmOutcome {
  id: string
  label: string
  shortLabel?: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  maxTradeShares: number
}

export interface AmmMarket {
  id: string
  category: AmmCategory
  kind: AmmMarketKind
  group: string
  eventLabel: string
  questionTitle: string
  description: string
  status: AmmMarketStatus
  closesAt: string
  expectedResolutionTime: string
  resolutionSource: string
  resolutionRule: string
  voidRule: string
  delayOrDisputePolicy: string
  providerStatus: 'quoting' | 'paused' | 'degraded' | 'pending'
  liquidity: number
  volume24h: number
  feeBps: number
  maxPriceImpact: number
  quoteTtlSeconds: number
  outcomes: AmmOutcome[]
  matchId?: string
  seriesId?: string
}

export interface AmmPosition {
  id: string
  marketId: string
  outcomeId: string
  shares: number
  avgPrice: number
  realizedPnl: number
  updatedAt: string
}

export interface AmmTradeHistory {
  id: string
  marketId: string
  outcomeId: string
  side: TradeSide
  shares: number
  avgPrice: number
  collateral: number
  realizedPnl?: number
  createdAt: string
}

const botafogo = matches.find((match) => match.id === 'botafogo-mirassol') ?? matches[0]
const realBarca = matches.find((match) => match.id === 'realmadrid-barcelona') ?? matches[0]
const manUnited = matches.find((match) => match.id === 'manunited-tottenham') ?? matches[0]

function isoPlus(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function outcome(
  id: string,
  label: string,
  price: number,
  change: number,
  volume: number,
  liquidity: number,
  maxTradeShares = 1600,
  shortLabel?: string,
): AmmOutcome {
  return { id, label, shortLabel, price, priceChange24h: change, volume24h: volume, liquidity, maxTradeShares }
}

export function decimalOdds(price: number): number {
  if (price <= 0) return 0
  return +(1 / price).toFixed(2)
}

export function formatPrice(price: number, format: PriceFormat): string {
  if (format === 'decimal') return decimalOdds(price).toFixed(2)
  return `${Math.round(Math.min(0.99, Math.max(0.01, price)) * 100)}¢`
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function getAmmMarketById(id: string): AmmMarket | undefined {
  return ammMarkets.find((market) => market.id === id)
}

export function getOutcome(market: AmmMarket, outcomeId: string): AmmOutcome | undefined {
  return market.outcomes.find((item) => item.id === outcomeId)
}

export function getPrimaryOutcome(market: AmmMarket): AmmOutcome {
  return market.outcomes[0]
}

export function estimateAmmQuote(
  market: AmmMarket,
  outcome: AmmOutcome,
  side: TradeSide,
  input: number,
  inputMode: 'collateral' | 'shares' = side === 'buy' ? 'collateral' : 'shares',
) {
  const feeRate = market.feeBps / 10000
  const liquidityDepth = Math.max(outcome.liquidity, 1)
  const shares = inputMode === 'shares'
    ? input
    : input / Math.max(outcome.price, 0.01)
  const direction = side === 'buy' ? 1 : -1
  const rawImpact = Math.min((shares / liquidityDepth) * 0.08, market.maxPriceImpact)
  const priceImpact = +rawImpact.toFixed(4)
  const avgPrice = Math.min(Math.max(outcome.price + direction * priceImpact / 2, 0.01), 0.99)
  const nextPrice = Math.min(Math.max(outcome.price + direction * priceImpact, 0.01), 0.99)
  const grossCollateral = shares * avgPrice
  const fee = grossCollateral * feeRate
  const collateral = side === 'buy' ? grossCollateral + fee : Math.max(grossCollateral - fee, 0)

  return {
    shares: +shares.toFixed(2),
    avgPrice: +avgPrice.toFixed(4),
    nextPrice: +nextPrice.toFixed(4),
    priceImpact: +(priceImpact * 100).toFixed(2),
    fee: +fee.toFixed(2),
    collateral: +collateral.toFixed(2),
    expiresAt: new Date(Date.now() + market.quoteTtlSeconds * 1000).toISOString(),
  }
}

export const ammMarkets: AmmMarket[] = [
  {
    id: 'amm-botafogo-result',
    category: 'single',
    kind: 'multi',
    group: '赛果',
    eventLabel: `${botafogo.homeTeam.name} vs ${botafogo.awayTeam.name}`,
    questionTitle: `${botafogo.homeTeam.name} vs ${botafogo.awayTeam.name} 的全场赛果是什么？`,
    description: '互斥多 outcome 市场，最终只有主胜、平局或客胜中的一个 outcome 兑付 1。',
    status: 'open',
    closesAt: isoPlus(2),
    expectedResolutionTime: '全场结束并经官方赛果确认后',
    resolutionSource: '官方比赛赛果',
    resolutionRule: '以常规比赛时间官方全场赛果为准。',
    voidRule: '比赛取消或长期延期时，按市场作废规则退回可退金额。',
    delayOrDisputePolicy: 'VAR、改判或官方结果延迟时进入暂停或官方待确认。',
    providerStatus: 'quoting',
    liquidity: 128000,
    volume24h: 34200,
    feeBps: 35,
    maxPriceImpact: 0.08,
    quoteTtlSeconds: 30,
    matchId: botafogo.id,
    outcomes: [
      outcome('home', `${botafogo.homeTeam.name}胜`, 0.54, 2.4, 18200, 52000, 1800, '主胜'),
      outcome('draw', '平局', 0.25, -0.8, 7200, 36000, 1300),
      outcome('away', `${botafogo.awayTeam.name}胜`, 0.21, -1.6, 8800, 40000, 1400, '客胜'),
    ],
  },
  {
    id: 'amm-botafogo-over-25',
    category: 'single',
    kind: 'binary',
    group: '大小球',
    eventLabel: `${botafogo.homeTeam.shortName} vs ${botafogo.awayTeam.shortName}`,
    questionTitle: '本场总进球是否大于 2.5？',
    description: '二元 outcome 市场，Yes 表示全场总进球 3 个或以上。',
    status: 'open',
    closesAt: isoPlus(2),
    expectedResolutionTime: '全场结束并经官方比分确认后',
    resolutionSource: '官方比分',
    resolutionRule: '全场总进球大于 2.5 时 Yes 兑付 1，否则 No 兑付 1。',
    voidRule: '比赛取消、腰斩且官方未给有效赛果时作废。',
    delayOrDisputePolicy: '进球、VAR 或比分异常时可暂停交易并重新报价。',
    providerStatus: 'quoting',
    liquidity: 98000,
    volume24h: 28100,
    feeBps: 35,
    maxPriceImpact: 0.07,
    quoteTtlSeconds: 30,
    matchId: botafogo.id,
    outcomes: [
      outcome('yes', 'Yes · 大于 2.5', 0.47, 1.1, 15000, 48000, 1500),
      outcome('no', 'No · 不大于 2.5', 0.53, -1.1, 13100, 50000, 1500),
    ],
  },
  {
    id: 'amm-real-barca-qualify',
    category: 'single',
    kind: 'binary',
    group: '系列赛',
    eventLabel: `${realBarca.homeTeam.name} vs ${realBarca.awayTeam.name}`,
    questionTitle: '皇家马德里是否晋级下一轮？',
    description: '两回合系列赛 outcome 市场，包含加时赛和点球大战后的官方晋级结果。',
    status: 'open',
    closesAt: isoPlus(5),
    expectedResolutionTime: '次回合结束并确认晋级方后',
    resolutionSource: 'UEFA 官方淘汰赛结果',
    resolutionRule: '皇家马德里成为官方晋级方时 Yes 兑付 1，否则 No 兑付 1。',
    voidRule: '系列赛取消或赛制重大变更时进入作废处理。',
    delayOrDisputePolicy: '官方结果延迟时进入等待官方结果状态。',
    providerStatus: 'quoting',
    liquidity: 156000,
    volume24h: 46300,
    feeBps: 35,
    maxPriceImpact: 0.06,
    quoteTtlSeconds: 30,
    matchId: realBarca.id,
    outcomes: [
      outcome('yes', 'Yes · 皇家马德里晋级', 0.52, 3.2, 26100, 76000, 2200),
      outcome('no', 'No · 皇家马德里未晋级', 0.48, -3.2, 20200, 80000, 2200),
    ],
  },
  {
    id: 'amm-manunited-clean-sheet',
    category: 'single',
    kind: 'binary',
    group: '球队表现',
    eventLabel: `${manUnited.homeTeam.name} vs ${manUnited.awayTeam.name}`,
    questionTitle: '曼联本场是否零封对手？',
    description: '二元球队表现市场，展示 RFQ 对小众盘口的报价偏移。',
    status: 'paused',
    closesAt: isoPlus(3),
    expectedResolutionTime: '全场结束并经官方比分确认后',
    resolutionSource: '官方比分',
    resolutionRule: '若曼联全场失球数为 0，Yes 兑付 1。',
    voidRule: '比赛取消或官方未确认有效赛果时作废。',
    delayOrDisputePolicy: '关键阵容或比赛状态异常时暂停报价。',
    providerStatus: 'paused',
    liquidity: 42000,
    volume24h: 9600,
    feeBps: 35,
    maxPriceImpact: 0.1,
    quoteTtlSeconds: 20,
    matchId: manUnited.id,
    outcomes: [
      outcome('yes', 'Yes · 曼联零封', 0.34, -2.7, 4100, 19000, 500),
      outcome('no', 'No · 曼联未零封', 0.66, 2.7, 5500, 23000, 500),
    ],
  },
  {
    id: 'amm-world-cup-winner',
    category: 'futures',
    kind: 'multi',
    group: '冠军',
    eventLabel: 'FIFA World Cup 2026',
    questionTitle: '谁会赢得 2026 世界杯？',
    description: '冠军多 outcome 市场，最终官方冠军 outcome 兑付 1，其余 outcome 归 0。',
    status: 'open',
    closesAt: '2026-06-11T19:00:00.000Z',
    expectedResolutionTime: '决赛结束并经 FIFA 确认后',
    resolutionSource: 'FIFA 官方冠军结果',
    resolutionRule: '以 FIFA 公布的 2026 世界杯冠军为准。',
    voidRule: '赛事取消或冠军无法官方确认时按作废规则处理。',
    delayOrDisputePolicy: '官方结果争议、纪律处罚或公告延迟时进入官方待确认。',
    providerStatus: 'quoting',
    liquidity: 520000,
    volume24h: 126000,
    feeBps: 40,
    maxPriceImpact: 0.05,
    quoteTtlSeconds: 45,
    seriesId: 'world-cup-2026',
    outcomes: [
      outcome('france', '法国', 0.17, 1.6, 33200, 122000, 5200),
      outcome('brazil', '巴西', 0.16, 0.8, 28400, 110000, 5000),
      outcome('argentina', '阿根廷', 0.14, -1.1, 25100, 98000, 4400),
      outcome('spain', '西班牙', 0.12, 2.2, 19300, 84000, 3800),
      outcome('other', '其他球队', 0.41, -3.5, 20000, 106000, 4600),
    ],
  },
  {
    id: 'amm-world-cup-group-a-mexico-qualify',
    category: 'futures',
    kind: 'binary',
    group: '小组赛',
    eventLabel: '世界杯 2026 · A 组',
    questionTitle: '墨西哥是否从 A 组出线？',
    description: '小组出线二元市场，按官方小组排名和出线结果结算。',
    status: 'open',
    closesAt: '2026-06-20T19:00:00.000Z',
    expectedResolutionTime: 'A 组全部比赛结束并经 FIFA 确认后',
    resolutionSource: 'FIFA 官方小组排名',
    resolutionRule: '墨西哥成为 A 组官方出线球队时 Yes 兑付 1。',
    voidRule: '小组赛取消或规则重大变更时按作废规则处理。',
    delayOrDisputePolicy: '排名争议或官方公告延迟时进入官方待确认。',
    providerStatus: 'quoting',
    liquidity: 146000,
    volume24h: 38400,
    feeBps: 40,
    maxPriceImpact: 0.07,
    quoteTtlSeconds: 45,
    seriesId: 'world-cup-2026',
    outcomes: [
      outcome('yes', 'Yes · 墨西哥出线', 0.74, 4.8, 21400, 74000, 2600),
      outcome('no', 'No · 墨西哥未出线', 0.26, -4.8, 17000, 72000, 2600),
    ],
  },
  {
    id: 'amm-ucl-winner',
    category: 'futures',
    kind: 'multi',
    group: '冠军',
    eventLabel: 'UEFA Champions League 2026',
    questionTitle: '谁会赢得 2026 欧冠？',
    description: '俱乐部杯赛冠军多 outcome 市场。',
    status: 'open',
    closesAt: '2026-05-30T19:00:00.000Z',
    expectedResolutionTime: '决赛结束并经 UEFA 确认后',
    resolutionSource: 'UEFA 官方冠军结果',
    resolutionRule: '以 UEFA 公布的赛季冠军为准。',
    voidRule: '赛事取消或冠军无法确认时作废。',
    delayOrDisputePolicy: '官方结果争议时进入官方待确认。',
    providerStatus: 'quoting',
    liquidity: 430000,
    volume24h: 112000,
    feeBps: 40,
    maxPriceImpact: 0.05,
    quoteTtlSeconds: 45,
    seriesId: 'ucl-2026',
    outcomes: [
      outcome('real-madrid', '皇家马德里', 0.22, 2.9, 30100, 102000, 4200),
      outcome('man-city', '曼城', 0.20, -1.4, 28600, 99000, 4200),
      outcome('psg', '巴黎圣日耳曼', 0.15, 1.2, 18400, 82000, 3400),
      outcome('bayern', '拜仁慕尼黑', 0.14, -0.6, 16600, 76000, 3200),
      outcome('other', '其他球队', 0.29, -2.1, 18300, 71000, 3000),
    ],
  },
  {
    id: 'amm-premier-league-top-four-newcastle',
    category: 'futures',
    kind: 'binary',
    group: '赛季结果',
    eventLabel: 'Premier League 2025/26',
    questionTitle: '纽卡斯尔是否获得欧冠资格？',
    description: '赛季资格二元市场，按官方最终积分榜和资格分配规则结算。',
    status: 'official_pending',
    closesAt: '2026-05-24T15:00:00.000Z',
    expectedResolutionTime: '赛季最终积分榜确认后',
    resolutionSource: 'Premier League 官方积分榜',
    resolutionRule: '纽卡斯尔获得下赛季欧冠资格时 Yes 兑付 1。',
    voidRule: '赛季取消、规则重大变更或资格无法确认时作废或延迟。',
    delayOrDisputePolicy: '资格递补、纪律处罚或官方公告延迟时进入官方待确认。',
    providerStatus: 'degraded',
    liquidity: 118000,
    volume24h: 42600,
    feeBps: 40,
    maxPriceImpact: 0.08,
    quoteTtlSeconds: 30,
    seriesId: 'premier-league-2026',
    outcomes: [
      outcome('yes', 'Yes · 获得资格', 0.58, 5.4, 23600, 58000, 1600),
      outcome('no', 'No · 未获得资格', 0.42, -5.4, 19000, 60000, 1600),
    ],
  },
]

export const ammPositions: AmmPosition[] = [
  {
    id: 'pos-botafogo-home',
    marketId: 'amm-botafogo-result',
    outcomeId: 'home',
    shares: 180,
    avgPrice: 0.49,
    realizedPnl: 0,
    updatedAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
  },
  {
    id: 'pos-wc-france',
    marketId: 'amm-world-cup-winner',
    outcomeId: 'france',
    shares: 620,
    avgPrice: 0.14,
    realizedPnl: 18.4,
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pos-mexico-qualify',
    marketId: 'amm-world-cup-group-a-mexico-qualify',
    outcomeId: 'yes',
    shares: 210,
    avgPrice: 0.68,
    realizedPnl: 12.6,
    updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
]

export const ammTradeHistory: AmmTradeHistory[] = [
  {
    id: 'trd-001',
    marketId: 'amm-world-cup-winner',
    outcomeId: 'france',
    side: 'buy',
    shares: 720,
    avgPrice: 0.14,
    collateral: 100.8,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trd-002',
    marketId: 'amm-world-cup-winner',
    outcomeId: 'france',
    side: 'sell',
    shares: 100,
    avgPrice: 0.17,
    collateral: 17,
    realizedPnl: 3,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trd-003',
    marketId: 'amm-botafogo-result',
    outcomeId: 'home',
    side: 'buy',
    shares: 180,
    avgPrice: 0.49,
    collateral: 88.2,
    createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
  },
]

export function marketsByCategory(category: AmmCategory): AmmMarket[] {
  return ammMarkets.filter((market) => market.category === category)
}

export function marketsByMatch(matchId: string): AmmMarket[] {
  return ammMarkets.filter((market) => market.matchId === matchId)
}

export function marketsBySeries(seriesId: string): AmmMarket[] {
  return ammMarkets.filter((market) => market.seriesId === seriesId)
}

export function getPositionFor(marketId: string, outcomeId: string): AmmPosition | undefined {
  return ammPositions.find((position) => position.marketId === marketId && position.outcomeId === outcomeId)
}
