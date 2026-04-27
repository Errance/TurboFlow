import type { SoccerLeague, SoccerMatch, Market, MyBetItem } from './types'
import { createFullMatchTabs } from './fullMatchTabs'
import {
  botafogoLineup, mirassolLineup, botafogoMirassolH2H,
  palmeirasLineup, gremioLineup, palmeirasGremioH2H,
  flamengoLineup, corinthiansLineup, flamengoCorinthiansH2H, flamengoCorinthiansEvents, flamengoCorinthiansStats,
  santosLineup, bahiaLineup, santosBahiaH2H, santosBahiaEvents, santosBahiaStats,
  vascoLineup, atleticoMGLineup, vascoAtleticoMGH2H, vascoAtleticoMGEvents, vascoAtleticoMGStats,
  arsenalLineup, chelseaLineup, arsenalChelseaH2H, arsenalChelseaEvents, arsenalChelseaStats,
  liverpoolLineup, mancityLineup, liverpoolMancityH2H, liverpoolMancityEvents, liverpoolMancityStats,
  manunitedLineup, tottenhamLineup, manunitedTottenhamH2H,
  newcastleLineup, brightonLineup, newcastleBrightonH2H, newcastleBrightonEvents, newcastleBrightonStats,
  realmadridLineup, barcelonaLineup, realmadridBarcelonaH2H,
  psgLineup, bayernLineup, psgBayernH2H, psgBayernEvents, psgBayernStats,
  atleticoMadridLineup, realSociedadLineup, atleticoMadridRealSociedadH2H, atleticoMadridRealSociedadEvents, atleticoMadridRealSociedadStats,
  sevillaLineup, villarrealLineup, sevillaVillarrealH2H,
  valenciaLineup, getafeLineup, valenciaGetafeH2H,
} from './matchInfoData'

export const soccerBackOfficeControls: { goalMarketsRemainOpenAfterKickoff: boolean } = {
  goalMarketsRemainOpenAfterKickoff: true,
}

function markMarketStatus(match: SoccerMatch, titlePattern: string, status: Market['status'], extra?: Partial<Pick<Market, 'settlementResult' | 'winningSelection'>>) {
  for (const tab of match.tabs) {
    for (const market of tab.markets) {
      if (market.title.includes(titlePattern)) {
        market.status = status
        if (extra?.settlementResult) market.settlementResult = extra.settlementResult
        if (extra?.winningSelection) market.winningSelection = extra.winningSelection
      }
    }
  }
}

function isGoalMarket(title: string): boolean {
  if (title.includes('角球') || title.includes('红黄牌') || title.includes('罚牌')) return false
  return title.includes('进球') ||
    title.includes('得分') ||
    title.includes('比分') ||
    title.includes('不失球') ||
    title.includes('不丢球') ||
    title.includes('Multiscores') ||
    title.includes('奇/偶') ||
    title.startsWith('两个半场高于') ||
    title.startsWith('两个半场低于') ||
    title.includes('合计') ||
    title.includes('总计') ||
    title.includes('总数')
}

function applyGoalMarketKickoffControl(match: SoccerMatch) {
  if (match.status !== 'live' || soccerBackOfficeControls.goalMarketsRemainOpenAfterKickoff) return
  for (const tab of match.tabs) {
    for (const market of tab.markets) {
      if (isGoalMarket(market.title) && (!market.status || market.status === 'open')) {
        market.status = 'suspended'
      }
    }
  }
}

export const leagues: SoccerLeague[] = [
  { id: 'brasileiro-a', name: 'Brasileiro Serie A', country: '巴西', matchCount: 5 },
  { id: 'premier-league', name: 'Premier League', country: '英格兰', matchCount: 4 },
  { id: 'champions-league', name: 'UEFA Champions League', country: '欧洲', matchCount: 2 },
  { id: 'la-liga', name: 'La Liga', country: '西班牙', matchCount: 3 },
]

export const matches: SoccerMatch[] = [
  // ─── Brasileiro Serie A ───
  {
    id: 'botafogo-mirassol',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: 'RJ博塔弗戈', shortName: 'BOT' },
    awayTeam: { name: '米拉索尔', shortName: 'MIR' },
    date: '04月02日', time: '06:30', status: 'scheduled',
    referee: 'Anderson Daronco',
    venue: 'Estádio Nilton Santos, Rio de Janeiro',
    homeLineup: botafogoLineup,
    awayLineup: mirassolLineup,
    headToHead: botafogoMirassolH2H,
    tabs: createFullMatchTabs('RJ博塔弗戈', '米拉索尔', botafogoLineup, mirassolLineup),
  },
  {
    id: 'palmeiras-gremio',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: '帕尔梅拉斯', shortName: 'PAL' },
    awayTeam: { name: '格雷米奥', shortName: 'GRE' },
    date: '04月03日', time: '08:30', status: 'scheduled',
    referee: 'Bruno Arleu de Araujo',
    venue: 'Allianz Parque, São Paulo',
    homeLineup: palmeirasLineup,
    awayLineup: gremioLineup,
    headToHead: palmeirasGremioH2H,
    tabs: createFullMatchTabs('帕尔梅拉斯', '格雷米奥', palmeirasLineup, gremioLineup),
  },
  {
    id: 'flamengo-corinthians',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: '弗拉门戈', shortName: 'FLA' },
    awayTeam: { name: '科林蒂安', shortName: 'COR' },
    date: '04月02日', time: '08:00', status: 'live',
    score: { home: 1, away: 0 },
    currentMinute: 65,
    referee: 'Raphael Claus',
    venue: 'Maracanã, Rio de Janeiro',
    homeLineup: flamengoLineup,
    awayLineup: corinthiansLineup,
    headToHead: flamengoCorinthiansH2H,
    events: flamengoCorinthiansEvents,
    stats: flamengoCorinthiansStats,
    tabs: createFullMatchTabs('弗拉门戈', '科林蒂安', flamengoLineup, corinthiansLineup),
  },
  {
    id: 'santos-bahia',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: '桑托斯', shortName: 'SAN' },
    awayTeam: { name: '巴伊亚', shortName: 'BAH' },
    date: '04月03日', time: '06:30', status: 'live',
    score: { home: 0, away: 0 },
    currentMinute: 32,
    referee: 'Wilton Pereira Sampaio',
    venue: 'Vila Belmiro, Santos',
    homeLineup: santosLineup,
    awayLineup: bahiaLineup,
    headToHead: santosBahiaH2H,
    events: santosBahiaEvents,
    stats: santosBahiaStats,
    tabs: createFullMatchTabs('桑托斯', '巴伊亚', santosLineup, bahiaLineup),
  },
  {
    id: 'vasco-atletico-mg',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: '瓦斯科达伽马', shortName: 'VAS' },
    awayTeam: { name: '米内罗竞技', shortName: 'CAM' },
    date: '04月03日', time: '08:00', status: 'finished',
    score: { home: 0, away: 1 },
    referee: 'Luiz Flávio de Oliveira',
    venue: 'São Januário, Rio de Janeiro',
    homeLineup: vascoLineup,
    awayLineup: atleticoMGLineup,
    headToHead: vascoAtleticoMGH2H,
    events: vascoAtleticoMGEvents,
    stats: vascoAtleticoMGStats,
    tabs: createFullMatchTabs('瓦斯科达伽马', '米内罗竞技', vascoLineup, atleticoMGLineup),
  },

  // ─── Premier League ───
  {
    id: 'arsenal-chelsea',
    league: 'Premier League', leagueId: 'premier-league',
    homeTeam: { name: '阿森纳', shortName: 'ARS' },
    awayTeam: { name: '切尔西', shortName: 'CHE' },
    date: '04月02日', time: '03:00', status: 'live',
    score: { home: 2, away: 1 },
    currentMinute: 78,
    referee: 'Anthony Taylor',
    venue: 'Emirates Stadium, London',
    homeLineup: arsenalLineup,
    awayLineup: chelseaLineup,
    headToHead: arsenalChelseaH2H,
    events: arsenalChelseaEvents,
    stats: arsenalChelseaStats,
    tabs: createFullMatchTabs('阿森纳', '切尔西', arsenalLineup, chelseaLineup),
  },
  {
    id: 'liverpool-mancity',
    league: 'Premier League', leagueId: 'premier-league',
    homeTeam: { name: '利物浦', shortName: 'LIV' },
    awayTeam: { name: '曼城', shortName: 'MCI' },
    date: '04月02日', time: '03:00', status: 'finished',
    score: { home: 2, away: 1 },
    referee: 'Michael Oliver',
    venue: 'Anfield, Liverpool',
    homeLineup: liverpoolLineup,
    awayLineup: mancityLineup,
    headToHead: liverpoolMancityH2H,
    events: liverpoolMancityEvents,
    stats: liverpoolMancityStats,
    tabs: createFullMatchTabs('利物浦', '曼城', liverpoolLineup, mancityLineup),
  },
  {
    id: 'manunited-tottenham',
    league: 'Premier League', leagueId: 'premier-league',
    homeTeam: { name: '曼联', shortName: 'MUN' },
    awayTeam: { name: '热刺', shortName: 'TOT' },
    date: '04月03日', time: '03:00', status: 'scheduled',
    referee: 'Craig Pawson',
    venue: 'Old Trafford, Manchester',
    homeLineup: manunitedLineup,
    awayLineup: tottenhamLineup,
    headToHead: manunitedTottenhamH2H,
    tabs: createFullMatchTabs('曼联', '热刺', manunitedLineup, tottenhamLineup),
  },
  {
    id: 'newcastle-brighton',
    league: 'Premier League', leagueId: 'premier-league',
    homeTeam: { name: '纽卡斯尔', shortName: 'NEW' },
    awayTeam: { name: '布莱顿', shortName: 'BHA' },
    date: '04月03日', time: '03:00', status: 'finished',
    score: { home: 3, away: 2 },
    referee: 'Simon Hooper',
    venue: "St James' Park, Newcastle",
    homeLineup: newcastleLineup,
    awayLineup: brightonLineup,
    headToHead: newcastleBrightonH2H,
    events: newcastleBrightonEvents,
    stats: newcastleBrightonStats,
    tabs: createFullMatchTabs('纽卡斯尔', '布莱顿', newcastleLineup, brightonLineup),
  },

  // ─── Champions League ───
  {
    id: 'realmadrid-barcelona',
    league: 'UEFA Champions League', leagueId: 'champions-league',
    homeTeam: { name: '皇家马德里', shortName: 'RMA' },
    awayTeam: { name: '巴塞罗那', shortName: 'BAR' },
    date: '04月02日', time: '03:00', status: 'scheduled',
    referee: 'Daniele Orsato',
    venue: 'Santiago Bernabéu, Madrid',
    homeLineup: realmadridLineup,
    awayLineup: barcelonaLineup,
    headToHead: realmadridBarcelonaH2H,
    tabs: createFullMatchTabs('皇家马德里', '巴塞罗那', realmadridLineup, barcelonaLineup),
  },
  {
    id: 'psg-bayernmunich',
    league: 'UEFA Champions League', leagueId: 'champions-league',
    homeTeam: { name: '巴黎圣日耳曼', shortName: 'PSG' },
    awayTeam: { name: '拜仁慕尼黑', shortName: 'BAY' },
    date: '04月02日', time: '03:00', status: 'live',
    score: { home: 1, away: 1 },
    currentMinute: 41,
    referee: 'Slavko Vinčić',
    venue: 'Parc des Princes, Paris',
    homeLineup: psgLineup,
    awayLineup: bayernLineup,
    headToHead: psgBayernH2H,
    events: psgBayernEvents,
    stats: psgBayernStats,
    tabs: createFullMatchTabs('巴黎圣日耳曼', '拜仁慕尼黑', psgLineup, bayernLineup),
  },

  // ─── La Liga ───
  {
    id: 'atleticomadrid-realsociedad',
    league: 'La Liga', leagueId: 'la-liga',
    homeTeam: { name: '马德里竞技', shortName: 'ATM' },
    awayTeam: { name: '皇家社会', shortName: 'RSO' },
    date: '04月02日', time: '04:00', status: 'finished',
    score: { home: 2, away: 0 },
    referee: 'Jesús Gil Manzano',
    venue: 'Metropolitano, Madrid',
    homeLineup: atleticoMadridLineup,
    awayLineup: realSociedadLineup,
    headToHead: atleticoMadridRealSociedadH2H,
    events: atleticoMadridRealSociedadEvents,
    stats: atleticoMadridRealSociedadStats,
    tabs: createFullMatchTabs('马德里竞技', '皇家社会', atleticoMadridLineup, realSociedadLineup),
  },
  {
    id: 'sevilla-villarreal',
    league: 'La Liga', leagueId: 'la-liga',
    homeTeam: { name: '塞维利亚', shortName: 'SEV' },
    awayTeam: { name: '比利亚雷亚尔', shortName: 'VIL' },
    date: '04月03日', time: '04:00', status: 'scheduled',
    referee: 'Pablo González Fuertes',
    venue: 'Ramón Sánchez-Pizjuán, Sevilla',
    homeLineup: sevillaLineup,
    awayLineup: villarrealLineup,
    headToHead: sevillaVillarrealH2H,
    tabs: createFullMatchTabs('塞维利亚', '比利亚雷亚尔', sevillaLineup, villarrealLineup),
  },
  {
    id: 'valencia-getafe',
    league: 'La Liga', leagueId: 'la-liga',
    homeTeam: { name: '瓦伦西亚', shortName: 'VAL' },
    awayTeam: { name: '赫塔费', shortName: 'GET' },
    date: '04月03日', time: '02:00', status: 'scheduled',
    referee: 'Alejandro Hernández Hernández',
    venue: 'Mestalla, Valencia',
    homeLineup: valenciaLineup,
    awayLineup: getafeLineup,
    headToHead: valenciaGetafeH2H,
    tabs: createFullMatchTabs('瓦伦西亚', '赫塔费', valenciaLineup, getafeLineup),
  },
]

// Live matches: mark a couple of markets as suspended
const arsCheLive = matches.find(m => m.id === 'arsenal-chelsea')
if (arsCheLive) {
  markMarketStatus(arsCheLive, '两队都得分', 'suspended')
  markMarketStatus(arsCheLive, '正确进球', 'suspended')
}
const flaCorLive = matches.find(m => m.id === 'flamengo-corinthians')
if (flaCorLive) {
  markMarketStatus(flaCorLive, '任何时间进球', 'suspended')
}

// Finished matches: mark first few markets as settled
const livMciFinished = matches.find(m => m.id === 'liverpool-mancity')
if (livMciFinished) {
  markMarketStatus(livMciFinished, '胜平负', 'settled', { settlementResult: 'win', winningSelection: '利物浦' })
  markMarketStatus(livMciFinished, '两队都得分', 'settled', { settlementResult: 'win', winningSelection: '是' })
  markMarketStatus(livMciFinished, '总进球数', 'settled', { settlementResult: 'win', winningSelection: '3' })
}
const newBhaFinished = matches.find(m => m.id === 'newcastle-brighton')
if (newBhaFinished) {
  markMarketStatus(newBhaFinished, '胜平负', 'settled', { settlementResult: 'win', winningSelection: '纽卡斯尔' })
  markMarketStatus(newBhaFinished, '两队都得分', 'settled', { settlementResult: 'loss' })
  markMarketStatus(newBhaFinished, '平局返还', 'settled', { settlementResult: 'void' })
}

// Finished match: add more loss examples for visual contrast
const vasAMGFinished = matches.find(m => m.id === 'vasco-atletico-mg')
if (vasAMGFinished) {
  markMarketStatus(vasAMGFinished, '胜平负', 'settled', { settlementResult: 'loss' })
  markMarketStatus(vasAMGFinished, '两队都得分', 'settled', { settlementResult: 'win', winningSelection: '否' })
}

// Live match: add a void market example
if (flaCorLive) {
  markMarketStatus(flaCorLive, '1st 进球队员', 'void')
}

// Scheduled match: add upcoming market example
const botMirScheduled = matches.find(m => m.id === 'botafogo-mirassol')
if (botMirScheduled) {
  markMarketStatus(botMirScheduled, '任何时间进球队员', 'upcoming')
}

// Scheduled match: add cancelled market example
const palGreScheduled = matches.find(m => m.id === 'palmeiras-gremio')
if (palGreScheduled) {
  markMarketStatus(palGreScheduled, '1st 进球队员', 'cancelled')
}

matches.forEach(applyGoalMarketKickoffControl)

export const myBets: MyBetItem[] = [
  {
    id: 'bet-1',
    matchLabel: '利物浦 vs 曼城',
    marketTitle: '胜平负',
    selection: '利物浦',
    odds: 2.24,
    amount: 50,
    result: 'win',
    payout: 112,
  },
  {
    id: 'bet-2',
    matchLabel: '纽卡斯尔 vs 布莱顿',
    marketTitle: '两队都得分',
    selection: '是',
    odds: 1.83,
    amount: 30,
    result: 'loss',
    payout: 0,
  },
  {
    id: 'bet-3',
    matchLabel: '瓦斯科达伽马 vs 米内罗竞技',
    marketTitle: '平局返还',
    selection: '瓦斯科达伽马',
    odds: 1.60,
    amount: 20,
    result: 'push',
    payout: 20,
  },
  {
    id: 'bet-4',
    matchLabel: '马德里竞技 vs 皇家社会',
    marketTitle: '亚洲让分盘',
    selection: '马德里竞技 -0.5',
    odds: 2.23,
    amount: 40,
    result: 'win',
    payout: 89.20,
  },
]

export function getMatchById(id: string): SoccerMatch | undefined {
  return matches.find((m) => m.id === id)
}

export function getMatchesByLeague(leagueId: string): SoccerMatch[] {
  return matches.filter((m) => m.leagueId === leagueId)
}
