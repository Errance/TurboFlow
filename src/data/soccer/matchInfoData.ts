import type { MatchLineup, MatchEvent, HeadToHead, MatchStats } from './types'

// ─── 帕尔梅拉斯 vs 格雷米奥 (赛前 scheduled) ───

export const palmeirasLineup: MatchLineup = {
  formation: '4-3-3',
  manager: 'Abel Ferreira',
  players: [
    { name: 'Weverton', number: 21, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Marcos Rocha', number: 2, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Gustavo Gómez', number: 15, position: 'DEF', gridRow: 1, gridCol: 1, isCaptain: true },
    { name: 'Murilo', number: 26, position: 'DEF', gridRow: 1, gridCol: 2 },
    { name: 'Piquerez', number: 22, position: 'DEF', gridRow: 1, gridCol: 3 },
    { name: 'Zé Rafael', number: 8, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Richard Ríos', number: 27, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Raphael Veiga', number: 23, position: 'MID', gridRow: 2, gridCol: 2 },
    { name: 'Artur', number: 7, position: 'FWD', gridRow: 3, gridCol: 0 },
    { name: 'Flaco López', number: 42, position: 'FWD', gridRow: 3, gridCol: 1 },
    { name: 'Estêvão', number: 41, position: 'FWD', gridRow: 3, gridCol: 2 },
  ],
  substitutes: [
    { name: 'Marcelo Lomba', number: 12, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Mayke', number: 12, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Luan', number: 13, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Caio Paulista', number: 16, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Gabriel Menino', number: 25, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Rony', number: 10, position: 'FWD', gridRow: 3, gridCol: 0 },
    { name: 'Endrick', number: 9, position: 'FWD', gridRow: 3, gridCol: 1 },
  ],
}

export const gremioLineup: MatchLineup = {
  formation: '4-2-3-1',
  manager: 'Luis Castro',
  players: [
    { name: 'Marchesín', number: 1, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'João Pedro', number: 2, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Rodrigo Ely', number: 3, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Kannemann', number: 4, position: 'DEF', gridRow: 1, gridCol: 2, isCaptain: true },
    { name: 'Reinaldo', number: 6, position: 'DEF', gridRow: 1, gridCol: 3 },
    { name: 'Villasanti', number: 5, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Pepê', number: 8, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Cristaldo', number: 10, position: 'MID', gridRow: 3, gridCol: 0 },
    { name: 'Pavón', number: 7, position: 'MID', gridRow: 3, gridCol: 1 },
    { name: 'Nathan', number: 11, position: 'MID', gridRow: 3, gridCol: 2 },
    { name: 'Luis Suárez', number: 9, position: 'FWD', gridRow: 4, gridCol: 0 },
  ],
  substitutes: [
    { name: 'Caíque', number: 33, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Rodrigo Caio', number: 13, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Fábio', number: 14, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Carballo', number: 20, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Du Queiroz', number: 22, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Diego Costa', number: 19, position: 'FWD', gridRow: 3, gridCol: 0 },
  ],
}

export const palmeirasGremioH2H: HeadToHead = {
  homeWins: 2,
  draws: 1,
  awayWins: 2,
  avgGoals: { homeScored: 2.1, homeConceded: 1.0, awayScored: 1.6, awayConceded: 1.5 },
  matches: [
    { date: '2025-11-15', homeTeam: '帕尔梅拉斯', awayTeam: '格雷米奥', score: { home: 3, away: 1 }, competition: 'Brasileiro Serie A' },
    { date: '2025-07-22', homeTeam: '格雷米奥', awayTeam: '帕尔梅拉斯', score: { home: 2, away: 1 }, competition: 'Brasileiro Serie A' },
    { date: '2024-11-10', homeTeam: '帕尔梅拉斯', awayTeam: '格雷米奥', score: { home: 1, away: 1 }, competition: 'Brasileiro Serie A' },
    { date: '2024-06-18', homeTeam: '格雷米奥', awayTeam: '帕尔梅拉斯', score: { home: 2, away: 0 }, competition: 'Copa do Brasil' },
    { date: '2024-03-05', homeTeam: '帕尔梅拉斯', awayTeam: '格雷米奥', score: { home: 2, away: 1 }, competition: 'Brasileiro Serie A' },
  ],
}

// ─── 弗拉门戈 vs 科林蒂安 (赛中 live, 65') ───

export const flamengoLineup: MatchLineup = {
  formation: '4-4-2',
  manager: 'Tite',
  players: [
    { name: 'Rossi', number: 1, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Wesley', number: 2, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Fabrício Bruno', number: 4, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Léo Pereira', number: 3, position: 'DEF', gridRow: 1, gridCol: 2, isCaptain: true },
    { name: 'Ayrton Lucas', number: 6, position: 'DEF', gridRow: 1, gridCol: 3 },
    { name: 'Gerson', number: 8, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Pulgar', number: 5, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Arrascaeta', number: 14, position: 'MID', gridRow: 2, gridCol: 2 },
    { name: 'Everton Ribeiro', number: 7, position: 'MID', gridRow: 2, gridCol: 3 },
    { name: 'Pedro', number: 9, position: 'FWD', gridRow: 3, gridCol: 0 },
    { name: 'Gabigol', number: 10, position: 'FWD', gridRow: 3, gridCol: 1 },
  ],
  substitutes: [
    { name: 'Santos', number: 33, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Matheuzinho', number: 13, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'David Luiz', number: 23, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Thiago Maia', number: 15, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Lorran', number: 19, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Bruno Henrique', number: 27, position: 'FWD', gridRow: 3, gridCol: 0 },
  ],
}

export const corinthiansLineup: MatchLineup = {
  formation: '4-3-3',
  manager: 'António Oliveira',
  players: [
    { name: 'Cássio', number: 12, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Fagner', number: 23, position: 'DEF', gridRow: 1, gridCol: 0, isCaptain: true },
    { name: 'Félix Torres', number: 3, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Cacá', number: 4, position: 'DEF', gridRow: 1, gridCol: 2 },
    { name: 'Hugo', number: 6, position: 'DEF', gridRow: 1, gridCol: 3 },
    { name: 'Raniele', number: 8, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Rodrigo Garro', number: 10, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Breno Bidon', number: 27, position: 'MID', gridRow: 2, gridCol: 2 },
    { name: 'Wesley', number: 36, position: 'FWD', gridRow: 3, gridCol: 0 },
    { name: 'Yuri Alberto', number: 9, position: 'FWD', gridRow: 3, gridCol: 1 },
    { name: 'Romero', number: 11, position: 'FWD', gridRow: 3, gridCol: 2 },
  ],
  substitutes: [
    { name: 'Matheus Donelli', number: 32, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Raul Gustavo', number: 13, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Fausto Vera', number: 14, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Igor Coronado', number: 77, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Giovane', number: 35, position: 'FWD', gridRow: 3, gridCol: 0 },
  ],
}

export const flamengoCorinthiansH2H: HeadToHead = {
  homeWins: 3,
  draws: 2,
  awayWins: 1,
  avgGoals: { homeScored: 1.8, homeConceded: 0.8, awayScored: 1.2, awayConceded: 1.6 },
  matches: [
    { date: '2025-10-20', homeTeam: '弗拉门戈', awayTeam: '科林蒂安', score: { home: 2, away: 0 }, competition: 'Brasileiro Serie A' },
    { date: '2025-06-14', homeTeam: '科林蒂安', awayTeam: '弗拉门戈', score: { home: 1, away: 1 }, competition: 'Brasileiro Serie A' },
    { date: '2024-11-02', homeTeam: '弗拉门戈', awayTeam: '科林蒂安', score: { home: 3, away: 1 }, competition: 'Copa do Brasil Final' },
    { date: '2024-10-19', homeTeam: '科林蒂安', awayTeam: '弗拉门戈', score: { home: 0, away: 1 }, competition: 'Copa do Brasil Final' },
    { date: '2024-07-07', homeTeam: '弗拉门戈', awayTeam: '科林蒂安', score: { home: 1, away: 1 }, competition: 'Brasileiro Serie A' },
  ],
}

export const flamengoCorinthiansEvents: MatchEvent[] = [
  { minute: 23, type: 'goal', team: 'home', playerName: 'Pedro', detail: '助攻: Arrascaeta' },
  { minute: 31, type: 'yellow_card', team: 'away', playerName: 'Félix Torres' },
  { minute: 45, type: 'yellow_card', team: 'home', playerName: 'Pulgar' },
  { minute: 52, type: 'substitution', team: 'away', playerName: 'Igor Coronado', detail: '换下: Breno Bidon' },
  { minute: 58, type: 'yellow_card', team: 'away', playerName: 'Raniele' },
]

export const flamengoCorinthiansStats: MatchStats = {
  possession: [62, 38],
  shots: [11, 5],
  shotsOnTarget: [5, 2],
  corners: [6, 2],
  fouls: [8, 12],
  offsides: [2, 1],
  yellowCards: [1, 2],
  redCards: [0, 0],
}

// ─── 利物浦 vs 曼城 (赛后 finished) ───

export const liverpoolLineup: MatchLineup = {
  formation: '4-3-3',
  manager: 'Arne Slot',
  players: [
    { name: 'Alisson', number: 1, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Alexander-Arnold', number: 66, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Van Dijk', number: 4, position: 'DEF', gridRow: 1, gridCol: 1, isCaptain: true },
    { name: 'Konaté', number: 5, position: 'DEF', gridRow: 1, gridCol: 2 },
    { name: 'Robertson', number: 26, position: 'DEF', gridRow: 1, gridCol: 3 },
    { name: 'Gravenberch', number: 38, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Mac Allister', number: 10, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Szoboszlai', number: 8, position: 'MID', gridRow: 2, gridCol: 2 },
    { name: 'Salah', number: 11, position: 'FWD', gridRow: 3, gridCol: 0 },
    { name: 'Núñez', number: 9, position: 'FWD', gridRow: 3, gridCol: 1 },
    { name: 'Díaz', number: 7, position: 'FWD', gridRow: 3, gridCol: 2 },
  ],
  substitutes: [
    { name: 'Kelleher', number: 62, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Gomez', number: 12, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Tsimikas', number: 21, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Jones', number: 17, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Elliott', number: 19, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Jota', number: 20, position: 'FWD', gridRow: 3, gridCol: 0 },
    { name: 'Gakpo', number: 18, position: 'FWD', gridRow: 3, gridCol: 1 },
  ],
}

export const mancityLineup: MatchLineup = {
  formation: '4-2-3-1',
  manager: 'Pep Guardiola',
  players: [
    { name: 'Ederson', number: 31, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Walker', number: 2, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Dias', number: 3, position: 'DEF', gridRow: 1, gridCol: 1, isCaptain: true },
    { name: 'Akanji', number: 25, position: 'DEF', gridRow: 1, gridCol: 2 },
    { name: 'Gvardiol', number: 24, position: 'DEF', gridRow: 1, gridCol: 3 },
    { name: 'Rodri', number: 16, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Kovačić', number: 8, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Bernardo Silva', number: 20, position: 'MID', gridRow: 3, gridCol: 0 },
    { name: 'De Bruyne', number: 17, position: 'MID', gridRow: 3, gridCol: 1 },
    { name: 'Foden', number: 47, position: 'MID', gridRow: 3, gridCol: 2 },
    { name: 'Haaland', number: 9, position: 'FWD', gridRow: 4, gridCol: 0 },
  ],
  substitutes: [
    { name: 'Ortega', number: 18, position: 'GK', gridRow: 0, gridCol: 0 },
    { name: 'Stones', number: 5, position: 'DEF', gridRow: 1, gridCol: 0 },
    { name: 'Aké', number: 6, position: 'DEF', gridRow: 1, gridCol: 1 },
    { name: 'Phillips', number: 4, position: 'MID', gridRow: 2, gridCol: 0 },
    { name: 'Grealish', number: 10, position: 'MID', gridRow: 2, gridCol: 1 },
    { name: 'Álvarez', number: 19, position: 'FWD', gridRow: 3, gridCol: 0 },
    { name: 'Doku', number: 11, position: 'FWD', gridRow: 3, gridCol: 1 },
  ],
}

export const liverpoolMancityH2H: HeadToHead = {
  homeWins: 4,
  draws: 2,
  awayWins: 3,
  avgGoals: { homeScored: 2.3, homeConceded: 1.4, awayScored: 1.8, awayConceded: 2.0 },
  matches: [
    { date: '2025-12-01', homeTeam: '曼城', awayTeam: '利物浦', score: { home: 1, away: 3 }, competition: 'Premier League' },
    { date: '2025-08-10', homeTeam: '利物浦', awayTeam: '曼城', score: { home: 1, away: 1 }, competition: 'Community Shield' },
    { date: '2025-03-15', homeTeam: '利物浦', awayTeam: '曼城', score: { home: 2, away: 1 }, competition: 'Premier League' },
    { date: '2024-11-24', homeTeam: '曼城', awayTeam: '利物浦', score: { home: 0, away: 2 }, competition: 'Premier League' },
    { date: '2024-03-10', homeTeam: '利物浦', awayTeam: '曼城', score: { home: 1, away: 1 }, competition: 'Premier League' },
  ],
}

export const liverpoolMancityEvents: MatchEvent[] = [
  { minute: 12, type: 'goal', team: 'home', playerName: 'Salah', detail: '助攻: Alexander-Arnold' },
  { minute: 28, type: 'yellow_card', team: 'away', playerName: 'Rodri' },
  { minute: 35, type: 'goal', team: 'away', playerName: 'Haaland', detail: '助攻: De Bruyne' },
  { minute: 42, type: 'yellow_card', team: 'home', playerName: 'Gravenberch' },
  { minute: 55, type: 'substitution', team: 'away', playerName: 'Grealish', detail: '换下: Foden' },
  { minute: 67, type: 'goal', team: 'home', playerName: 'Núñez', detail: '助攻: Díaz' },
  { minute: 72, type: 'substitution', team: 'home', playerName: 'Jota', detail: '换下: Núñez' },
  { minute: 78, type: 'yellow_card', team: 'away', playerName: 'Walker' },
  { minute: 80, type: 'substitution', team: 'away', playerName: 'Álvarez', detail: '换下: Kovačić' },
  { minute: 85, type: 'red_card', team: 'away', playerName: 'Walker', detail: '两黄变红' },
  { minute: 88, type: 'substitution', team: 'home', playerName: 'Gakpo', detail: '换下: Díaz' },
]

export const liverpoolMancityStats: MatchStats = {
  possession: [48, 52],
  shots: [14, 11],
  shotsOnTarget: [7, 4],
  corners: [5, 7],
  fouls: [11, 14],
  offsides: [2, 3],
  yellowCards: [1, 2],
  redCards: [0, 1],
}
