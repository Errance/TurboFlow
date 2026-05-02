import type { BetSubject, ButtonGroupMarket, Market, MarketStatus } from './types'

export type FutureMarketGroup = '冠军' | '晋级' | '赛季结果' | '系列赛'

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
  markets: SoccerFutureMarket[]
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

function buttonMarket(title: string, options: Array<{ label: string; odds: number }>, status?: MarketStatus): ButtonGroupMarket {
  return { type: 'buttonGroup', title, options, status }
}

export const futuresCompetitions: SoccerFutureCompetition[] = [
  {
    id: 'ucl-2026',
    name: 'UEFA Champions League 2026',
    shortName: '欧冠 2026',
    region: '欧洲',
    phase: '淘汰赛',
    headline: '冠军、晋级决赛和两回合系列赛预测',
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
    markets: [
      {
        id: 'pl-winner',
        group: '冠军',
        subject: premierLeagueSubject,
        market: buttonMarket('英超冠军', [
          { label: '阿森纳', odds: 2.95 },
          { label: '曼城', odds: 3.10 },
          { label: '利物浦', odds: 4.40 },
          { label: '切尔西', odds: 8.80 },
        ]),
        description: '预测赛季最终冠军，按 Premier League 官方最终积分榜结算。',
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
