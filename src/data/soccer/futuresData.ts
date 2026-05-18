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

function buttonMarket(
  title: string,
  options: ButtonGroupOption[],
  status?: MarketStatus,
  probabilityTargetSlots?: number,
  probabilityTargetLabel?: string,
): ButtonGroupMarket {
  return { type: 'buttonGroup', title, options, status, probabilityTargetSlots, probabilityTargetLabel }
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
    marketSummary: ['小组第一', '小组出线', '进入 8 强', '进入 4 强', '进入决赛', '冠军'],
    markets: [
      {
        id: 'wc-group-a-winner',
        group: '小组赛',
        subject: worldCupSubject,
        market: buttonMarket('A组第一', [
          ...binaryCandidate('mexico', '墨西哥', 2.05),
          ...binaryCandidate('czechia', '捷克', 3.80),
          ...binaryCandidate('south-africa', '南非', 5.20),
          ...binaryCandidate('group-a-other', '其他球队', 8.00),
        ], undefined, 1, '唯一小组第一：展示候选 YES 合计目标约 100%'),
        description: '预测球队是否获得 A 组最终第一名，按小组赛全部比赛结束后的 FIFA 官方排名结算；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'wc-group-a-qualify',
        group: '小组赛',
        subject: worldCupSubject,
        market: buttonMarket('A组出线', [
          ...binaryCandidate('mexico', '墨西哥', 1.32, { noOdds: 3.40, isNoReferencePrice: false }),
          ...binaryCandidate('czechia', '捷克', 2.10, { noOdds: 1.72, isNoReferencePrice: false }),
          ...binaryCandidate('south-africa', '南非', 2.80),
          ...binaryCandidate('group-a-other', '其他球队', 2.45),
        ], undefined, 2, '小组 2 个出线名额：展示候选 YES 合计目标约 200%'),
        description: '预测球队是否从 A 组晋级淘汰赛，按 FIFA 官方小组出线结果结算；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'wc-quarterfinalist',
        group: '淘汰赛',
        subject: worldCupSubject,
        market: buttonMarket('进入8强', [
          ...binaryCandidate('france', '法国', 1.85, { noOdds: 1.95, isNoReferencePrice: false }),
          ...binaryCandidate('brazil', '巴西', 1.72, { noOdds: 2.10, isNoReferencePrice: false }),
          ...binaryCandidate('argentina', '阿根廷', 1.90),
          ...binaryCandidate('spain', '西班牙', 1.88),
        ], undefined, 8, '完整赛事 8 个名额：当前展示热门候选 YES 合计'),
        description: '预测球队是否进入 8 强，包含常规时间、加时赛和点球大战后的晋级结果；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'wc-semifinalist',
        group: '淘汰赛',
        subject: worldCupSubject,
        market: buttonMarket('进入4强', [
          ...binaryCandidate('france', '法国', 2.45),
          ...binaryCandidate('brazil', '巴西', 2.35),
          ...binaryCandidate('argentina', '阿根廷', 2.75),
          ...binaryCandidate('spain', '西班牙', 2.65),
        ], undefined, 4, '完整赛事 4 个名额：当前展示热门候选 YES 合计'),
        description: '预测球队是否进入 4 强/半决赛，按四分之一决赛结束后的 FIFA 官方晋级结果结算；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'wc-finalist',
        group: '淘汰赛',
        subject: worldCupSubject,
        market: buttonMarket('进入决赛', [
          ...binaryCandidate('france', '法国', 3.20, { noOdds: 1.35, isNoReferencePrice: false }),
          ...binaryCandidate('argentina', '阿根廷', 3.60, { noOdds: 1.30, isNoReferencePrice: false }),
          ...binaryCandidate('brazil', '巴西', 3.10),
          ...binaryCandidate('spain', '西班牙', 3.05),
        ], undefined, 2, '完整赛事 2 个决赛名额：当前展示热门候选 YES 合计'),
        description: '预测球队是否晋级决赛，按半决赛结束后的官方晋级结果结算；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'wc-winner',
        group: '冠军',
        subject: worldCupSubject,
        market: buttonMarket('世界杯冠军', [
          ...binaryCandidate('france', '法国', 5.46),
          ...binaryCandidate('spain', '西班牙', 5.99),
          ...binaryCandidate('england', '英格兰', 8.77),
          ...binaryCandidate('brazil', '巴西', 10.99),
          ...binaryCandidate('argentina', '阿根廷', 11.90),
          ...binaryCandidate('portugal', '葡萄牙', 12.05),
          ...binaryCandidate('germany', '德国', 19.23),
          ...binaryCandidate('netherlands', '荷兰', 28.57),
          ...binaryCandidate('world-cup-other', '其他球队', 5.62),
        ], undefined, 1, '冠军唯一结果：全组候选 YES 合计目标约 100%'),
        description: '预测 2026 FIFA World Cup 最终冠军，按 FIFA 官方冠军结果结算；每个候选有 YES + NO 两侧，同时所有候选 YES 共同组成冠军概率分布，合计目标约 100%。',
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
    marketSummary: ['冠军', '晋级决赛', '两回合晋级'],
    markets: [
      {
        id: 'ucl-winner',
        group: '冠军',
        subject: uclSubject,
        market: buttonMarket('欧冠冠军', [
          ...binaryCandidate('real-madrid', '皇家马德里', 4.80),
          ...binaryCandidate('man-city', '曼城', 5.20),
          ...binaryCandidate('psg', '巴黎圣日耳曼', 6.20),
          ...binaryCandidate('bayern', '拜仁慕尼黑', 7.20),
          ...binaryCandidate('arsenal', '阿森纳', 8.80),
          ...binaryCandidate('inter', '国际米兰', 10.00),
          ...binaryCandidate('barcelona', '巴塞罗那', 12.50),
        ], undefined, 1, '冠军唯一结果：全组候选 YES 合计目标约 100%'),
        description: '预测本赛季 UEFA Champions League 最终冠军，按官方冠军结果结算；每个候选有 YES + NO 两侧，同时所有候选 YES 共同组成冠军概率分布，合计目标约 100%。',
        status: 'open',
      },
      {
        id: 'ucl-finalist',
        group: '晋级',
        subject: uclSubject,
        market: buttonMarket('晋级决赛', [
          ...binaryCandidate('real-madrid', '皇家马德里', 2.35, { noOdds: 1.62, isNoReferencePrice: false }),
          ...binaryCandidate('man-city', '曼城', 2.55, { noOdds: 1.54, isNoReferencePrice: false }),
          ...binaryCandidate('psg', '巴黎圣日耳曼', 2.95),
          ...binaryCandidate('bayern', '拜仁慕尼黑', 3.10),
        ], undefined, 2, '决赛 2 个名额：当前展示热门候选 YES 合计'),
        description: '预测球队是否进入决赛。该类晋级市场包含加时赛和点球大战结果；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'ucl-real-barca-series',
        group: '系列赛',
        subject: elClasicoTieSubject,
        market: buttonMarket('两回合系列赛晋级', [
          ...binaryCandidate('real-madrid', '皇家马德里', 1.92),
          ...binaryCandidate('barcelona', '巴塞罗那', 1.96),
        ], undefined, 1, '唯一晋级方：两队 YES 合计目标约 100%'),
        description: '预测两回合淘汰赛最终晋级方。常规时间、加时和点球均按官方晋级结果处理；两队 YES 共同组成唯一晋级方分布，合计目标约 100%。',
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
    headline: '冠军、欧冠资格和降级预测',
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
        ], undefined, 1, '冠军唯一结果：全组候选 YES 合计目标约 100%'),
        description: '预测赛季最终冠军，按 Premier League 官方最终积分榜结算；每个候选有 YES + NO 两侧，同时所有候选 YES 共同组成冠军概率分布，合计目标约 100%。',
        status: 'open',
      },
      {
        id: 'pl-top-four',
        group: '赛季结果',
        subject: premierLeagueSubject,
        market: buttonMarket('获得欧冠资格', [
          ...binaryCandidate('newcastle', '纽卡斯尔', 2.25, { noOdds: 1.68, isNoReferencePrice: false }),
          ...binaryCandidate('tottenham', '热刺', 2.70, { noOdds: 1.50, isNoReferencePrice: false }),
          ...binaryCandidate('aston-villa', '阿斯顿维拉', 3.05),
          ...binaryCandidate('man-united', '曼联', 3.40),
        ], undefined, 4, '欧冠资格名额：当前展示竞争候选 YES 合计'),
        description: '预测球队是否获得下赛季欧冠资格，按赛季官方名次和资格规则结算；每个候选按 YES + NO 两个二元子市场独立结算。',
        status: 'open',
      },
      {
        id: 'pl-relegation',
        group: '赛季结果',
        subject: premierLeagueSubject,
        market: buttonMarket('降级球队', [
          ...binaryCandidate('burnley', '伯恩利', 1.72),
          ...binaryCandidate('sheffield-united', '谢菲尔德联', 1.88),
          ...binaryCandidate('luton', '卢顿', 2.15),
          ...binaryCandidate('everton', '埃弗顿', 5.40),
        ], 'upcoming', 3, '降级 3 个名额：当前展示候选 YES 合计'),
        description: '预测球队是否在赛季结束后进入降级区。当前为即将开放状态；每个候选按 YES + NO 两个二元子市场独立结算。',
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
