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
  status: 'scheduled' | 'live' | 'finished'
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

export interface ButtonGroupMarket {
  type: 'buttonGroup'
  title: string
  options: { label: string; odds: number }[]
}

export interface OddsTableMarket {
  type: 'oddsTable'
  title: string
  columns: string[]
  rows: { line: string; odds: number[] }[]
}

export interface ScoreGridMarket {
  type: 'scoreGrid'
  title: string
  homeRange: number[]
  awayRange: number[]
  odds: Record<string, number>
}

export interface PlayerListMarket {
  type: 'playerList'
  title: string
  tiers: string[]
  players: { name: string; odds: number[] }[]
}

export interface ComboGridMarket {
  type: 'comboGrid'
  title: string
  rowHeaders: string[]
  colHeaders: string[]
  cells: { label: string; odds: number }[]
}

export interface RangeButtonsMarket {
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
  marketTitle: string
  selection: string
  odds: number
}
