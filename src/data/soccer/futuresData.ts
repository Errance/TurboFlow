import type { BetSubject, ButtonGroupMarket, ButtonGroupOption, Market, MarketStatus } from './types'

export type FutureMarketGroup = '小组赛' | '淘汰赛' | '冠军' | '晋级' | '赛季结果' | '系列赛'

export interface SoccerFutureMarket {
  id: string
  group: FutureMarketGroup
  subject: BetSubject
  market: ButtonGroupMarket
  description: string
  status: MarketStatus | 'official_pending'
}

export interface SoccerFutureCompetition {
  id: string
  name: string
  shortName: string
  region: string
  phase: string
  headline: string
  seriesType: string
  marketSummary: string[]
  markets: SoccerFutureMarket[]
}

const worldCupSubject: BetSubject = {
  scope: 'competition',
  subjectId: 'future-world-cup-2026',
  subjectLabel: 'FIFA World Cup 2026',
  closesAt: '2026-06-11T19:00:00.000Z',
  resolutionTimeLabel: '对应阶段结束并经 FIFA 确认后',
  resolutionSource: 'FIFA 官方赛事结果',
}

const uclSubject: BetSubject = {
  scope: 'competition',
  subjectId: 'future-ucl-2026',
  subjectLabel: 'UEFA Champions League 2026',
  closesAt: '2026-05-30T19:00:00.000Z',
  resolutionTimeLabel: '决赛结束并经 UEFA 确认后',
  resolutionSource: 'UEFA 官方赛事结果',
}

const premierLeagueSubject: BetSubject = {
  scope: 'season',
  subjectId: 'future-premier-league-2026',
  subjectLabel: 'Premier League 2025/26',
  closesAt: '2026-05-24T15:00:00.000Z',
  resolutionTimeLabel: '赛季最终积分榜确认后',
  resolutionSource: 'Premier League 官方积分榜',
}

const elClasicoTieSubject: BetSubject = {
  scope: 'tie',
  subjectId: 'future-ucl-real-barca-tie',
  subjectLabel: '皇家马德里 vs 巴塞罗那 · 两回合系列赛',
  closesAt: '2026-04-08T19:00:00.000Z',
  resolutionTimeLabel: '次回合结束并确认晋级方后',
  resolutionSource: 'UEFA 官方淘汰赛结果',
}

function buttonMarket(title: string, options: ButtonGroupOption[], status?: MarketStatus): ButtonGroupMarket {
  return { type: 'buttonGroup', title, options, status }
}

/**
 * v7.1：把候选 odds 展开为 YES + NO 两 option。
 * NO 侧 odds 按互补 1/(1 - implied_yes) 推导，并标 isReferencePrice=true，
 * 与 PRD 5.3「展示尽量与同类预测市场对齐；成交以最新报价为准」口径一致。
 *
 * SIG 上线后若 NO 侧由报价方直接下发，去掉 isReferencePrice 即可，无需改 UI。
 */
function binaryCandidate(candidate: string, candidateLabel: string, yesOdds: number, options?: {
  noOdds?: number
  isNoReferencePrice?: boolean
}): ButtonGroupOption[] {
  const yesImplied = 1 / yesOdds
  const noImplied = Math.max(0.02, Math.min(0.98, 1 - yesImplied))
  const noOdds = options?.noOdds ?? +(1 / noImplied).toFixed(2)
  return [
    { label: `${candidateLabel} 是`, odds: +yesOdds.toFixed(2), candidate, side: 'yes' },
    { label: `${candidateLabel} 否`, odds: +noOdds.toFixed(2), candidate, side: 'no', isReferencePrice: options?.isNoReferencePrice ?? true },
  ]
}

export const futuresCompetitions: SoccerFutureCompetition[] = [
  {
    id: 'world-cup-2026',
    name: 'FIFA World Cup 2026',
    shortName: '世界杯 2026',
    region: '国际',
    phase: '小组赛至决赛',
    headline: '小组出线、淘汰赛晋级和最终冠军预测',
    seriesType: '杯赛系列赛',
    marketSummary: ['小组第一', '小组出线', '进入 8 强', '进入决赛', '冠军'],
    markets: [
      {
        id: 'wc-group-a-winner',
        group: '小组赛',
        subject: worldCupSubject,
        market: buttonMarket('A组第一', [
          { label: '墨西哥', odds: 2.05 },
          { label: '捷克', odds: 3.80 },
          { label: '南非', odds: 5.20 },
          { label: '其他球队', odds: 8.00 },
        ]),
        description: '预测 A 组最终第一名，按小组赛全部比赛结束后的 FIFA 官方排名结算。',
        status: 'open',
      },
      {
        id: 'wc-group-a-qualify',
        group: '小组赛',
        subject: worldCupSubject,
        market: buttonMarket('A组出线', [
          { label: '墨西哥 是', odds: 1.32 },
          { label: '墨西哥 否', odds: 3.40 },
          { label: '捷克 是', odds: 2.10 },
          { label: '捷克 否', odds: 1.72 },
        ]),
        description: '预测球队是否从 A 组晋级淘汰赛，按 FIFA 官方小组出线结果结算。',
        status: 'open',
      },
      {
        id: 'wc-quarterfinalist',
        group: '淘汰赛',
        subject: worldCupSubject,
        market: buttonMarket('进入8强', [
          { label: '法国 是', odds: 1.85 },
          { label: '法国 否', odds: 1.95 },
          { label: '巴西 是', odds: 1.72 },
          { label: '巴西 否', odds: 2.10 },
        ]),
        description: '预测球队是否进入 8 强，包含常规时间、加时赛和点球大战后的晋级结果。',
        status: 'open',
      },
      {
        id: 'wc-finalist',
        group: '淘汰赛',
        subject: worldCupSubject,
        market: buttonMarket('进入决赛', [
          { label: '法国 是', odds: 3.20 },
          { label: '法国 否', odds: 1.35 },
          { label: '阿根廷 是', odds: 3.60 },
          { label: '阿根廷 否', odds: 1.30 },
        ]),
        description: '预测球队是否晋级决赛，按半决赛结束后的官方晋级结果结算。',
        status: 'open',
      },
      {
        id: 'wc-winner',
        group: '冠军',
        subject: worldCupSubject,
        market: buttonMarket('世界杯冠军', [
          ...binaryCandidate('france', '法国', 5.80),
          ...binaryCandidate('brazil', '巴西', 6.20),
          ...binaryCandidate('argentina', '阿根廷', 7.40),
          ...binaryCandidate('spain', '西班牙', 8.00),
        ]),
        description: '预测 2026 FIFA World Cup 最终冠军，按 FIFA 官方冠军结果结算；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
    ],
  },
  {
    id: 'ucl-2026',
    name: 'UEFA Champions League 2026',
    shortName: '欧冠 2026',
    region: '欧洲',
    phase: '淘汰赛',
    headline: '冠军、晋级决赛和两回合系列赛预测',
    seriesType: '俱乐部杯赛',
    marketSummary: ['冠军', '晋级决赛', '两回合系列赛'],
    markets: [
      {
        id: 'ucl-winner',
        group: '冠军',
        subject: uclSubject,
        market: buttonMarket('欧冠冠军', [
          { label: '皇家马德里', odds: 4.20 },
          { label: '曼城', odds: 4.80 },
          { label: '巴黎圣日耳曼', odds: 5.60 },
          { label: '拜仁慕尼黑', odds: 6.20 },
          { label: '阿森纳', odds: 7.40 },
        ]),
        description: '预测本赛季 UEFA Champions League 最终冠军，按官方冠军结果结算。',
        status: 'open',
      },
      {
        id: 'ucl-finalist',
        group: '晋级',
        subject: uclSubject,
        market: buttonMarket('晋级决赛', [
          { label: '皇家马德里 是', odds: 2.35 },
          { label: '皇家马德里 否', odds: 1.62 },
          { label: '曼城 是', odds: 2.55 },
          { label: '曼城 否', odds: 1.54 },
        ]),
        description: '预测球队是否进入决赛。该类晋级市场包含加时赛和点球大战结果。',
        status: 'open',
      },
      {
        id: 'ucl-real-barca-series',
        group: '系列赛',
        subject: elClasicoTieSubject,
        market: buttonMarket('两回合系列赛赛果', [
          { label: '皇家马德里晋级', odds: 1.92 },
          { label: '巴塞罗那晋级', odds: 1.96 },
          { label: '总比分打平后点球决胜', odds: 5.80 },
        ]),
        description: '预测两回合淘汰赛最终晋级方。常规时间、加时和点球均按官方晋级结果处理。',
        status: 'open',
      },
    ],
  },
  {
    id: 'premier-league-2026',
    name: 'Premier League 2025/26',
    shortName: '英超 2025/26',
    region: '英格兰',
    phase: '赛季进行中',
    headline: '冠军、前四和降级预测',
    seriesType: '联赛赛季',
    marketSummary: ['冠军', '欧冠资格', '降级'],
    markets: [
      {
        id: 'pl-winner',
        group: '冠军',
        subject: premierLeagueSubject,
        market: buttonMarket('英超冠军', [
          ...binaryCandidate('arsenal', '阿森纳', 2.95),
          ...binaryCandidate('mancity', '曼城', 3.10),
          ...binaryCandidate('liverpool', '利物浦', 4.40),
          ...binaryCandidate('chelsea', '切尔西', 8.80),
        ]),
        description: '预测赛季最终冠军，按 Premier League 官方最终积分榜结算；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'pl-top-four',
        group: '赛季结果',
        subject: premierLeagueSubject,
        market: buttonMarket('获得欧冠资格', [
          { label: '纽卡斯尔 是', odds: 2.25 },
          { label: '纽卡斯尔 否', odds: 1.68 },
          { label: '热刺 是', odds: 2.70 },
          { label: '热刺 否', odds: 1.50 },
        ]),
        description: '预测球队是否获得下赛季欧冠资格，按赛季官方名次和资格规则结算。',
        status: 'open',
      },
      {
        id: 'pl-relegation',
        group: '赛季结果',
        subject: premierLeagueSubject,
        market: buttonMarket('降级球队', [
          { label: '伯恩利', odds: 1.72 },
          { label: '谢菲尔德联', odds: 1.88 },
          { label: '卢顿', odds: 2.15 },
          { label: '埃弗顿', odds: 5.40 },
        ], 'upcoming'),
        description: '预测赛季结束后进入降级区的球队。当前为即将开放状态。',
        status: 'upcoming',
      },
    ],
  },
]

export const futureMarkets = futuresCompetitions.flatMap((competition) => competition.markets)

export function getFutureCompetitionById(id: string): SoccerFutureCompetition | undefined {
  return futuresCompetitions.find((competition) => competition.id === id)
}

export function getFutureMarket(subjectId: string, marketTitle: string): SoccerFutureMarket | undefined {
  return futureMarkets.find((item) => item.subject.subjectId === subjectId && item.market.title === marketTitle)
}

export function enumerateFutureMarketSelections(market: Market): Array<[string, number]> {
  if (market.type !== 'buttonGroup' && market.type !== 'rangeButtons') return []
  return market.options.map((option) => [option.label, option.odds])
}
