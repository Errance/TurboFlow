import type { SoccerLeague, SoccerMatch, MatchTab } from './types'
import { fullMatchTabs } from './fullMatchTabs'
import {
  palmeirasLineup, gremioLineup, palmeirasGremioH2H,
  flamengoLineup, corinthiansLineup, flamengoCorinthiansH2H, flamengoCorinthiansEvents, flamengoCorinthiansStats,
  liverpoolLineup, mancityLineup, liverpoolMancityH2H, liverpoolMancityEvents, liverpoolMancityStats,
} from './matchInfoData'

export const leagues: SoccerLeague[] = [
  { id: 'brasileiro-a', name: 'Brasileiro Serie A', country: '巴西', matchCount: 5 },
  { id: 'premier-league', name: 'Premier League', country: '英格兰', matchCount: 4 },
  { id: 'champions-league', name: 'UEFA Champions League', country: '欧洲', matchCount: 2 },
  { id: 'la-liga', name: 'La Liga', country: '西班牙', matchCount: 3 },
]

function makeQuickTabs(h: string, a: string, odds: number[]): MatchTab[] {
  return [{
    id: 'home', label: '主页',
    markets: [
      {
        type: 'buttonGroup', title: '胜平负',
        options: [{ label: h, odds: odds[0] }, { label: '平局', odds: odds[1] }, { label: a, odds: odds[2] }],
      },
      {
        type: 'oddsTable', title: '合计',
        columns: ['高于', '低于'],
        rows: [
          { line: '2.5', odds: [odds[3], odds[4]] },
          { line: '3.5', odds: [odds[5] ?? 3.20, odds[6] ?? 1.36] },
        ],
      },
      {
        type: 'oddsTable', title: '亚洲让分盘',
        columns: [h, a],
        rows: [
          { line: `${odds[7] ?? -0.5} / ${odds[8] ?? 0.5}`, odds: [odds[9] ?? 1.85, odds[10] ?? 1.95] },
        ],
      },
      {
        type: 'buttonGroup', title: '两队都得分',
        options: [{ label: '是', odds: odds[11] ?? 1.80 }, { label: '否', odds: odds[12] ?? 2.00 }],
      },
    ],
  }]
}

export const matches: SoccerMatch[] = [
  {
    id: 'botafogo-mirassol',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: 'RJ博塔弗戈', shortName: 'BOT' },
    awayTeam: { name: '米拉索尔', shortName: 'MIR' },
    date: '04月02日', time: '06:30', status: 'scheduled',
    tabs: fullMatchTabs,
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
    tabs: makeQuickTabs('帕尔梅拉斯', '格雷米奥', [1.85, 3.60, 4.20, 1.95, 1.85, 3.10, 1.38, -0.5, 0.5, 1.72, 2.10, 1.75, 2.05]),
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
    tabs: makeQuickTabs('弗拉门戈', '科林蒂安', [1.45, 4.20, 6.50, 2.10, 1.72, 3.50, 1.30, -1, 1, 1.90, 1.90, 1.90, 1.90]),
  },
  {
    id: 'santos-bahia',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: '桑托斯', shortName: 'SAN' },
    awayTeam: { name: '巴伊亚', shortName: 'BAH' },
    date: '04月03日', time: '06:30', status: 'scheduled',
    tabs: makeQuickTabs('桑托斯', '巴伊亚', [2.10, 3.40, 3.40, 2.00, 1.80, 3.20, 1.38, -0.25, 0.25, 1.88, 1.92, 1.85, 1.95]),
  },
  {
    id: 'vasco-atletico-mg',
    league: 'Brasileiro Serie A', leagueId: 'brasileiro-a',
    homeTeam: { name: '瓦斯科达伽马', shortName: 'VAS' },
    awayTeam: { name: '米内罗竞技', shortName: 'CAM' },
    date: '04月03日', time: '08:00', status: 'scheduled',
    tabs: makeQuickTabs('瓦斯科达伽马', '米内罗竞技', [2.50, 3.20, 2.85, 2.15, 1.70, 3.40, 1.33, 0, 0, 1.95, 1.85, 1.70, 2.10]),
  },
  {
    id: 'arsenal-chelsea',
    league: 'Premier League', leagueId: 'premier-league',
    homeTeam: { name: '阿森纳', shortName: 'ARS' },
    awayTeam: { name: '切尔西', shortName: 'CHE' },
    date: '04月02日', time: '03:00', status: 'scheduled',
    tabs: makeQuickTabs('阿森纳', '切尔西', [1.75, 3.80, 4.50, 2.05, 1.78, 3.25, 1.35, -0.75, 0.75, 1.88, 1.92, 1.72, 2.08]),
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
    tabs: makeQuickTabs('利物浦', '曼城', [1.60, 3.90, 5.20, 1.90, 1.90, 2.80, 1.42, -0.5, 0.5, 1.85, 1.95, 1.65, 2.15]),
  },
  {
    id: 'manunited-tottenham',
    league: 'Premier League', leagueId: 'premier-league',
    homeTeam: { name: '曼联', shortName: 'MUN' },
    awayTeam: { name: '热刺', shortName: 'TOT' },
    date: '04月03日', time: '03:00', status: 'scheduled',
    tabs: makeQuickTabs('曼联', '热刺', [2.30, 3.40, 3.10, 1.95, 1.85, 3.15, 1.37, -0.25, 0.25, 1.90, 1.90, 1.80, 2.00]),
  },
  {
    id: 'newcastle-brighton',
    league: 'Premier League', leagueId: 'premier-league',
    homeTeam: { name: '纽卡斯尔', shortName: 'NEW' },
    awayTeam: { name: '布莱顿', shortName: 'BHA' },
    date: '04月03日', time: '03:00', status: 'scheduled',
    tabs: makeQuickTabs('纽卡斯尔', '布莱顿', [1.90, 3.60, 4.00, 2.10, 1.72, 3.30, 1.36, -0.5, 0.5, 1.80, 2.00, 1.75, 2.05]),
  },
  {
    id: 'realmadrid-barcelona',
    league: 'UEFA Champions League', leagueId: 'champions-league',
    homeTeam: { name: '皇家马德里', shortName: 'RMA' },
    awayTeam: { name: '巴塞罗那', shortName: 'BAR' },
    date: '04月02日', time: '03:00', status: 'scheduled',
    tabs: makeQuickTabs('皇家马德里', '巴塞罗那', [2.40, 3.30, 2.95, 1.85, 1.95, 2.90, 1.42, -0.25, 0.25, 1.92, 1.88, 1.70, 2.10]),
  },
  {
    id: 'psg-bayernmunich',
    league: 'UEFA Champions League', leagueId: 'champions-league',
    homeTeam: { name: '巴黎圣日耳曼', shortName: 'PSG' },
    awayTeam: { name: '拜仁慕尼黑', shortName: 'BAY' },
    date: '04月02日', time: '03:00', status: 'scheduled',
    tabs: makeQuickTabs('巴黎圣日耳曼', '拜仁慕尼黑', [2.20, 3.40, 3.20, 1.90, 1.90, 2.95, 1.40, -0.25, 0.25, 1.90, 1.90, 1.75, 2.05]),
  },
  {
    id: 'atleticomadrid-realsociedad',
    league: 'La Liga', leagueId: 'la-liga',
    homeTeam: { name: '马德里竞技', shortName: 'ATM' },
    awayTeam: { name: '皇家社会', shortName: 'RSO' },
    date: '04月02日', time: '04:00', status: 'scheduled',
    tabs: makeQuickTabs('马德里竞技', '皇家社会', [1.70, 3.80, 4.80, 2.20, 1.68, 3.60, 1.30, -0.75, 0.75, 1.85, 1.95, 1.80, 2.00]),
  },
  {
    id: 'sevilla-villarreal',
    league: 'La Liga', leagueId: 'la-liga',
    homeTeam: { name: '塞维利亚', shortName: 'SEV' },
    awayTeam: { name: '比利亚雷亚尔', shortName: 'VIL' },
    date: '04月03日', time: '04:00', status: 'scheduled',
    tabs: makeQuickTabs('塞维利亚', '比利亚雷亚尔', [2.50, 3.30, 2.80, 2.00, 1.80, 3.10, 1.38, 0, 0, 1.90, 1.90, 1.75, 2.05]),
  },
  {
    id: 'valencia-getafe',
    league: 'La Liga', leagueId: 'la-liga',
    homeTeam: { name: '瓦伦西亚', shortName: 'VAL' },
    awayTeam: { name: '赫塔费', shortName: 'GET' },
    date: '04月03日', time: '02:00', status: 'scheduled',
    tabs: makeQuickTabs('瓦伦西亚', '赫塔费', [2.00, 3.20, 3.80, 2.30, 1.62, 3.80, 1.28, -0.5, 0.5, 1.82, 1.98, 1.65, 2.15]),
  },
]

export function getMatchById(id: string): SoccerMatch | undefined {
  return matches.find((m) => m.id === id)
}

export function getMatchesByLeague(leagueId: string): SoccerMatch[] {
  return matches.filter((m) => m.leagueId === leagueId)
}
