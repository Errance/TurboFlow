import type { MatchLineup, MatchPlayer, MatchEvent, HeadToHead, MatchStats } from './types'

// ─── Helper: auto-assign gridRow/gridCol from formation ───

type StarterDef = [string, number] | [string, number, true]
type SubDef = [string, number, MatchPlayer['position']]

function createLineup(
  formation: string,
  manager: string,
  starters: StarterDef[],
  subs: SubDef[],
): MatchLineup {
  const lines = formation.split('-').map(Number)
  const rowSizes = [1, ...lines] // prepend GK row

  const posForRow = (row: number): MatchPlayer['position'] => {
    if (row === 0) return 'GK'
    if (row === 1) return 'DEF'
    if (row === rowSizes.length - 1) return 'FWD'
    return 'MID'
  }

  const players: MatchPlayer[] = []
  let idx = 0
  for (let row = 0; row < rowSizes.length; row++) {
    for (let col = 0; col < rowSizes[row]; col++) {
      const s = starters[idx]
      if (!s) break
      players.push({
        name: s[0], number: s[1], position: posForRow(row),
        gridRow: row, gridCol: col, ...(s[2] ? { isCaptain: true } : {}),
      })
      idx++
    }
  }

  const subPlayers: MatchPlayer[] = subs.map((s, i) => ({
    name: s[0], number: s[1], position: s[2],
    gridRow: s[2] === 'GK' ? 0 : s[2] === 'DEF' ? 1 : s[2] === 'MID' ? 2 : 3,
    gridCol: i % 3,
  }))

  return { formation, manager, players, substitutes: subPlayers }
}

type H2HResult = [string, string, string, number, number, string]

function createH2H(homeName: string, _awayName: string, results: H2HResult[]): HeadToHead {
  let hw = 0, d = 0, aw = 0, hs = 0, hc = 0, as2 = 0, ac = 0
  const matches = results.map(([date, ht, at, hg, ag, comp]) => {
    const isHome = ht === homeName
    if (hg > ag) { if (isHome) hw++; else aw++ }
    else if (hg < ag) { if (isHome) aw++; else hw++ }
    else d++
    if (isHome) { hs += hg; hc += ag; as2 += ag; ac += hg }
    else { hs += ag; hc += hg; as2 += hg; ac += ag }
    return { date, homeTeam: ht, awayTeam: at, score: { home: hg, away: ag }, competition: comp }
  })
  const n = results.length || 1
  return {
    homeWins: hw, draws: d, awayWins: aw,
    avgGoals: {
      homeScored: +(hs / n).toFixed(1), homeConceded: +(hc / n).toFixed(1),
      awayScored: +(as2 / n).toFixed(1), awayConceded: +(ac / n).toFixed(1),
    },
    matches,
  }
}

function createStats(data: Partial<MatchStats> & Pick<MatchStats, 'possession' | 'shots'>): MatchStats {
  return {
    shotsOnTarget: [Math.round(data.shots[0] * 0.45), Math.round(data.shots[1] * 0.45)],
    corners: [5, 4],
    fouls: [10, 11],
    offsides: [2, 1],
    yellowCards: [1, 2],
    redCards: [0, 0],
    ...data,
  }
}

// ═══════════════════════════════════════════════════════════════
// BRASILEIRO SERIE A
// ═══════════════════════════════════════════════════════════════

// ─── Botafogo vs Mirassol (scheduled) ───

export const botafogoLineup = createLineup('4-3-3', 'Artur Jorge', [
  ['John', 1],
  ['Ponte, Mateo', 2], ['Bastos', 3, true], ['Barboza, Alex', 4], ['Telles, Alex', 6],
  ['Medina, Cristian', 8], ['Savarino', 10], ['Eduardo Carlos', 14],
  ['Villalba Jaume', 7], ['Suárez, Tiquinho', 9], ['Dos Santos Jr.', 11],
], [
  ['Gatito Fernández', 12, 'GK'],
  ['Danilo', 15, 'DEF'], ['Halter', 16, 'DEF'],
  ['Montoro, Alvaro', 20, 'MID'], ['Cardoso', 22, 'MID'],
  ['Julian Fogaca', 17, 'FWD'], ['Arthur Izaque', 30, 'FWD'],
])

export const mirassolLineup = createLineup('4-2-3-1', 'Mozart Santos', [
  ['Alex Muralha', 1],
  ['Daniel Borges', 2], ['Ferraresi, Navel', 3], ['Joao Victor', 4, true], ['Reinaldo', 6],
  ['Negueba', 5], ['Chico', 8],
  ['Galdino, Everton', 7], ['Lukas Mugni', 10], ['Fernandes, Nathan', 11],
  ['Ramos, Chris', 9],
], [
  ['Vanderlei', 12, 'GK'],
  ['Igor B.', 13, 'DEF'], ['Yuri', 14, 'DEF'],
  ['José Aldo', 15, 'MID'], ['Vitinho', 18, 'MID'],
  ['Almeida Toledo', 19, 'FWD'],
])

export const botafogoMirassolH2H = createH2H('RJ博塔弗戈', '米拉索尔', [
  ['2025-10-08', 'RJ博塔弗戈', '米拉索尔', 2, 0, 'Brasileiro Serie A'],
  ['2025-05-14', '米拉索尔', 'RJ博塔弗戈', 1, 1, 'Brasileiro Serie A'],
  ['2024-11-20', 'RJ博塔弗戈', '米拉索尔', 3, 1, 'Brasileiro Serie A'],
  ['2024-06-02', '米拉索尔', 'RJ博塔弗戈', 0, 2, 'Brasileiro Serie A'],
  ['2023-09-10', 'RJ博塔弗戈', '米拉索尔', 1, 0, 'Copa do Brasil'],
])

// ─── Palmeiras vs Gremio (scheduled) ───

export const palmeirasLineup = createLineup('4-3-3', 'Abel Ferreira', [
  ['Weverton', 21],
  ['Marcos Rocha', 2], ['Gustavo Gómez', 15, true], ['Murilo', 26], ['Piquerez', 22],
  ['Zé Rafael', 8], ['Richard Ríos', 27], ['Raphael Veiga', 23],
  ['Artur', 7], ['Flaco López', 42], ['Estêvão', 41],
], [
  ['Marcelo Lomba', 12, 'GK'],
  ['Mayke', 12, 'DEF'], ['Luan', 13, 'DEF'],
  ['Caio Paulista', 16, 'MID'], ['Gabriel Menino', 25, 'MID'],
  ['Rony', 10, 'FWD'], ['Endrick', 9, 'FWD'],
])

export const gremioLineup = createLineup('4-2-3-1', 'Luis Castro', [
  ['Marchesín', 1],
  ['João Pedro', 2], ['Rodrigo Ely', 3], ['Kannemann', 4, true], ['Reinaldo', 6],
  ['Villasanti', 5], ['Pepê', 8],
  ['Cristaldo', 10], ['Pavón', 7], ['Nathan', 11],
  ['Luis Suárez', 9],
], [
  ['Caíque', 33, 'GK'],
  ['Rodrigo Caio', 13, 'DEF'], ['Fábio', 14, 'DEF'],
  ['Carballo', 20, 'MID'], ['Du Queiroz', 22, 'MID'],
  ['Diego Costa', 19, 'FWD'],
])

export const palmeirasGremioH2H = createH2H('帕尔梅拉斯', '格雷米奥', [
  ['2025-11-15', '帕尔梅拉斯', '格雷米奥', 3, 1, 'Brasileiro Serie A'],
  ['2025-07-22', '格雷米奥', '帕尔梅拉斯', 2, 1, 'Brasileiro Serie A'],
  ['2024-11-10', '帕尔梅拉斯', '格雷米奥', 1, 1, 'Brasileiro Serie A'],
  ['2024-06-18', '格雷米奥', '帕尔梅拉斯', 2, 0, 'Copa do Brasil'],
  ['2024-03-05', '帕尔梅拉斯', '格雷米奥', 2, 1, 'Brasileiro Serie A'],
])

// ─── Flamengo vs Corinthians (live 65', 1-0) ───

export const flamengoLineup = createLineup('4-4-2', 'Tite', [
  ['Rossi', 1],
  ['Wesley', 2], ['Fabrício Bruno', 4], ['Léo Pereira', 3, true], ['Ayrton Lucas', 6],
  ['Gerson', 8], ['Pulgar', 5], ['Arrascaeta', 14], ['Everton Ribeiro', 7],
  ['Pedro', 9], ['Gabigol', 10],
], [
  ['Santos', 33, 'GK'],
  ['Matheuzinho', 13, 'DEF'], ['David Luiz', 23, 'DEF'],
  ['Thiago Maia', 15, 'MID'], ['Lorran', 19, 'MID'],
  ['Bruno Henrique', 27, 'FWD'],
])

export const corinthiansLineup = createLineup('4-3-3', 'António Oliveira', [
  ['Cássio', 12],
  ['Fagner', 23, true], ['Félix Torres', 3], ['Cacá', 4], ['Hugo', 6],
  ['Raniele', 8], ['Rodrigo Garro', 10], ['Breno Bidon', 27],
  ['Wesley', 36], ['Yuri Alberto', 9], ['Romero', 11],
], [
  ['Matheus Donelli', 32, 'GK'],
  ['Raul Gustavo', 13, 'DEF'],
  ['Fausto Vera', 14, 'MID'], ['Igor Coronado', 77, 'MID'],
  ['Giovane', 35, 'FWD'],
])

export const flamengoCorinthiansH2H = createH2H('弗拉门戈', '科林蒂安', [
  ['2025-10-20', '弗拉门戈', '科林蒂安', 2, 0, 'Brasileiro Serie A'],
  ['2025-06-14', '科林蒂安', '弗拉门戈', 1, 1, 'Brasileiro Serie A'],
  ['2024-11-02', '弗拉门戈', '科林蒂安', 3, 1, 'Copa do Brasil Final'],
  ['2024-10-19', '科林蒂安', '弗拉门戈', 0, 1, 'Copa do Brasil Final'],
  ['2024-07-07', '弗拉门戈', '科林蒂安', 1, 1, 'Brasileiro Serie A'],
])

export const flamengoCorinthiansEvents: MatchEvent[] = [
  { minute: 23, type: 'goal', team: 'home', playerName: 'Pedro', detail: '助攻: Arrascaeta' },
  { minute: 31, type: 'yellow_card', team: 'away', playerName: 'Félix Torres' },
  { minute: 45, type: 'yellow_card', team: 'home', playerName: 'Pulgar' },
  { minute: 52, type: 'substitution', team: 'away', playerName: 'Igor Coronado', detail: '换下: Breno Bidon' },
  { minute: 58, type: 'yellow_card', team: 'away', playerName: 'Raniele' },
]

export const flamengoCorinthiansStats = createStats({
  possession: [62, 38], shots: [11, 5], shotsOnTarget: [5, 2],
  corners: [6, 2], fouls: [8, 12], offsides: [2, 1], yellowCards: [1, 2], redCards: [0, 0],
})

// ─── Santos vs Bahia (live 32', 0-0) ───

export const santosLineup = createLineup('4-3-3', 'Fábio Carille', [
  ['João Paulo', 1],
  ['JP Chermont', 2], ['Gil', 4, true], ['Jair', 3], ['Escobar', 6],
  ['Diego Pituca', 5], ['João Schmidt', 8], ['Giuliano', 10],
  ['Soteldo', 7], ['Marcos Leonardo', 9], ['Angelo', 11],
], [
  ['Vladimir', 12, 'GK'],
  ['Hayner', 13, 'DEF'], ['Alex', 14, 'DEF'],
  ['Carabajal', 20, 'MID'], ['Lucas Braga', 18, 'MID'],
  ['Patati', 30, 'FWD'],
])

export const bahiaLineup = createLineup('4-2-3-1', 'Rogério Ceni', [
  ['Marcos Felipe', 1],
  ['Gilberto', 2], ['Gabriel Xavier', 3, true], ['Kanu', 4], ['Luciano Juba', 6],
  ['Caio Alexandre', 5], ['Jean Lucas', 8],
  ['Thaciano', 10], ['Everton Ribeiro', 7], ['Biel', 11],
  ['Everaldo', 9],
], [
  ['Danilo Fernandes', 12, 'GK'],
  ['Cicinho', 13, 'DEF'], ['Cuesta', 14, 'DEF'],
  ['Rezende', 15, 'MID'], ['Carlos de Pena', 22, 'MID'],
  ['Ademir', 19, 'FWD'],
])

export const santosBahiaH2H = createH2H('桑托斯', '巴伊亚', [
  ['2025-09-18', '桑托斯', '巴伊亚', 1, 2, 'Brasileiro Serie A'],
  ['2025-05-04', '巴伊亚', '桑托斯', 3, 1, 'Brasileiro Serie A'],
  ['2024-10-15', '桑托斯', '巴伊亚', 0, 0, 'Brasileiro Serie A'],
  ['2024-05-22', '巴伊亚', '桑托斯', 2, 2, 'Copa do Brasil'],
  ['2023-11-08', '桑托斯', '巴伊亚', 1, 0, 'Brasileiro Serie A'],
])

export const santosBahiaEvents: MatchEvent[] = [
  { minute: 12, type: 'yellow_card', team: 'away', playerName: 'Caio Alexandre' },
  { minute: 28, type: 'yellow_card', team: 'home', playerName: 'Jair' },
]

export const santosBahiaStats = createStats({
  possession: [45, 55], shots: [4, 6], shotsOnTarget: [1, 2],
  corners: [2, 3], fouls: [6, 5], offsides: [1, 0], yellowCards: [1, 1], redCards: [0, 0],
})

// ─── Vasco vs Atletico MG (finished 0-1) ───

export const vascoLineup = createLineup('4-3-3', 'Ramón Díaz', [
  ['Léo Jardim', 1],
  ['Paulo Henrique', 2], ['Maicon', 4, true], ['Léo', 3], ['Lucas Piton', 6],
  ['Sforza', 5], ['Payet', 10], ['Galdames', 8],
  ['Adson', 7], ['Vegetti', 99], ['David', 11],
], [
  ['Ivan', 12, 'GK'],
  ['João Victor', 13, 'DEF'], ['Medel', 14, 'DEF'],
  ['Hugo Moura', 20, 'MID'], ['Praxedes', 18, 'MID'],
  ['Rossi', 17, 'FWD'],
])

export const atleticoMGLineup = createLineup('4-2-3-1', 'Gabriel Milito', [
  ['Everson', 22],
  ['Saravia', 2], ['Bruno Fuchs', 4], ['Junior Alonso', 3, true], ['Guilherme Arana', 6],
  ['Otávio', 5], ['Alan Franco', 8],
  ['Paulinho', 10], ['Scarpa', 7], ['Pedrinho', 11],
  ['Hulk', 9],
], [
  ['Matheus Mendes', 1, 'GK'],
  ['Mariano', 13, 'DEF'], ['Igor Rabello', 14, 'DEF'],
  ['Zaracho', 20, 'MID'], ['Battaglia', 15, 'MID'],
  ['Eduardo Vargas', 19, 'FWD'],
])

export const vascoAtleticoMGH2H = createH2H('瓦斯科达伽马', '米内罗竞技', [
  ['2025-10-05', '瓦斯科达伽马', '米内罗竞技', 1, 2, 'Brasileiro Serie A'],
  ['2025-06-10', '米内罗竞技', '瓦斯科达伽马', 1, 0, 'Brasileiro Serie A'],
  ['2024-10-22', '瓦斯科达伽马', '米内罗竞技', 2, 2, 'Brasileiro Serie A'],
  ['2024-05-30', '米内罗竞技', '瓦斯科达伽马', 3, 1, 'Copa do Brasil'],
  ['2024-02-14', '瓦斯科达伽马', '米内罗竞技', 0, 1, 'Brasileiro Serie A'],
])

export const vascoAtleticoMGEvents: MatchEvent[] = [
  { minute: 18, type: 'yellow_card', team: 'home', playerName: 'Sforza' },
  { minute: 34, type: 'yellow_card', team: 'away', playerName: 'Otávio' },
  { minute: 56, type: 'goal', team: 'away', playerName: 'Hulk', detail: '助攻: Scarpa' },
  { minute: 62, type: 'substitution', team: 'home', playerName: 'Rossi', detail: '换下: Adson' },
  { minute: 68, type: 'yellow_card', team: 'home', playerName: 'Maicon' },
  { minute: 75, type: 'substitution', team: 'away', playerName: 'Eduardo Vargas', detail: '换下: Hulk' },
  { minute: 82, type: 'substitution', team: 'home', playerName: 'Praxedes', detail: '换下: Galdames' },
  { minute: 88, type: 'yellow_card', team: 'away', playerName: 'Saravia' },
]

export const vascoAtleticoMGStats = createStats({
  possession: [52, 48], shots: [12, 10], shotsOnTarget: [3, 5],
  corners: [6, 4], fouls: [14, 11], offsides: [3, 1], yellowCards: [2, 2], redCards: [0, 0],
})

// ═══════════════════════════════════════════════════════════════
// PREMIER LEAGUE
// ═══════════════════════════════════════════════════════════════

// ─── Arsenal vs Chelsea (live 78', 2-1) ───

export const arsenalLineup = createLineup('4-3-3', 'Mikel Arteta', [
  ['Raya', 22],
  ['White', 4], ['Saliba', 2], ['Gabriel', 6, true], ['Zinchenko', 35],
  ['Ødegaard', 8], ['Rice', 41], ['Havertz', 29],
  ['Saka', 7], ['Jesus', 9], ['Martinelli', 11],
], [
  ['Ramsdale', 1, 'GK'],
  ['Tomiyasu', 18, 'DEF'], ['Kiwior', 15, 'DEF'],
  ['Jorginho', 20, 'MID'], ['Smith Rowe', 10, 'MID'],
  ['Trossard', 19, 'FWD'], ['Nketiah', 14, 'FWD'],
])

export const chelseaLineup = createLineup('4-2-3-1', 'Enzo Maresca', [
  ['Sánchez', 1],
  ['James', 24, true], ['Fofana', 2], ['Colwill', 26], ['Cucurella', 3],
  ['Caicedo', 25], ['Fernández', 8],
  ['Madueke', 11], ['Palmer', 20], ['Neto', 7],
  ['Jackson', 15],
], [
  ['Petrović', 28, 'GK'],
  ['Gusto', 27, 'DEF'], ['Badiashile', 5, 'DEF'],
  ['Gallagher', 23, 'MID'], ['Chukwuemeka', 17, 'MID'],
  ['Mudryk', 10, 'FWD'], ['Sterling', 14, 'FWD'],
])

export const arsenalChelseaH2H = createH2H('阿森纳', '切尔西', [
  ['2025-12-06', '切尔西', '阿森纳', 1, 2, 'Premier League'],
  ['2025-08-15', '阿森纳', '切尔西', 0, 0, 'Premier League'],
  ['2025-04-23', '切尔西', '阿森纳', 2, 2, 'Premier League'],
  ['2024-10-28', '阿森纳', '切尔西', 5, 0, 'Premier League'],
  ['2024-04-21', '切尔西', '阿森纳', 1, 0, 'Premier League'],
])

export const arsenalChelseaEvents: MatchEvent[] = [
  { minute: 15, type: 'goal', team: 'home', playerName: 'Saka', detail: '助攻: Ødegaard' },
  { minute: 28, type: 'yellow_card', team: 'away', playerName: 'Caicedo' },
  { minute: 37, type: 'goal', team: 'away', playerName: 'Palmer', detail: '点球' },
  { minute: 45, type: 'yellow_card', team: 'home', playerName: 'Rice' },
  { minute: 52, type: 'substitution', team: 'away', playerName: 'Mudryk', detail: '换下: Neto' },
  { minute: 63, type: 'goal', team: 'home', playerName: 'Havertz', detail: '助攻: Martinelli' },
  { minute: 70, type: 'substitution', team: 'home', playerName: 'Trossard', detail: '换下: Jesus' },
  { minute: 74, type: 'yellow_card', team: 'away', playerName: 'Fofana' },
]

export const arsenalChelseaStats = createStats({
  possession: [58, 42], shots: [16, 9], shotsOnTarget: [7, 4],
  corners: [8, 3], fouls: [9, 13], offsides: [2, 3], yellowCards: [1, 2], redCards: [0, 0],
})

// ─── Liverpool vs Man City (finished 2-1) ───

export const liverpoolLineup = createLineup('4-3-3', 'Arne Slot', [
  ['Alisson', 1],
  ['Alexander-Arnold', 66], ['Van Dijk', 4, true], ['Konaté', 5], ['Robertson', 26],
  ['Gravenberch', 38], ['Mac Allister', 10], ['Szoboszlai', 8],
  ['Salah', 11], ['Núñez', 9], ['Díaz', 7],
], [
  ['Kelleher', 62, 'GK'],
  ['Gomez', 12, 'DEF'], ['Tsimikas', 21, 'DEF'],
  ['Jones', 17, 'MID'], ['Elliott', 19, 'MID'],
  ['Jota', 20, 'FWD'], ['Gakpo', 18, 'FWD'],
])

export const mancityLineup = createLineup('4-2-3-1', 'Pep Guardiola', [
  ['Ederson', 31],
  ['Walker', 2], ['Dias', 3, true], ['Akanji', 25], ['Gvardiol', 24],
  ['Rodri', 16], ['Kovačić', 8],
  ['Bernardo Silva', 20], ['De Bruyne', 17], ['Foden', 47],
  ['Haaland', 9],
], [
  ['Ortega', 18, 'GK'],
  ['Stones', 5, 'DEF'], ['Aké', 6, 'DEF'],
  ['Phillips', 4, 'MID'], ['Grealish', 10, 'MID'],
  ['Álvarez', 19, 'FWD'], ['Doku', 11, 'FWD'],
])

export const liverpoolMancityH2H = createH2H('利物浦', '曼城', [
  ['2025-12-01', '曼城', '利物浦', 1, 3, 'Premier League'],
  ['2025-08-10', '利物浦', '曼城', 1, 1, 'Community Shield'],
  ['2025-03-15', '利物浦', '曼城', 2, 1, 'Premier League'],
  ['2024-11-24', '曼城', '利物浦', 0, 2, 'Premier League'],
  ['2024-03-10', '利物浦', '曼城', 1, 1, 'Premier League'],
])

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

export const liverpoolMancityStats = createStats({
  possession: [48, 52], shots: [14, 11], shotsOnTarget: [7, 4],
  corners: [5, 7], fouls: [11, 14], offsides: [2, 3], yellowCards: [1, 2], redCards: [0, 1],
})

// ─── Man United vs Tottenham (scheduled) ───

export const manunitedLineup = createLineup('4-2-3-1', 'Erik ten Hag', [
  ['Onana', 24],
  ['Dalot', 20], ['Varane', 19], ['Martínez', 6, true], ['Shaw', 23],
  ['Casemiro', 18], ['Mainoo', 37],
  ['Garnacho', 17], ['Fernandes', 8], ['Rashford', 10],
  ['Højlund', 11],
], [
  ['Bayındır', 1, 'GK'],
  ['Lindelöf', 2, 'DEF'], ['Wan-Bissaka', 29, 'DEF'],
  ['McTominay', 39, 'MID'], ['Mount', 7, 'MID'],
  ['Antony', 21, 'FWD'], ['Martial', 9, 'FWD'],
])

export const tottenhamLineup = createLineup('4-3-3', 'Ange Postecoglou', [
  ['Vicario', 1],
  ['Porro', 23], ['Romero', 17, true], ['Van de Ven', 37], ['Udogie', 13],
  ['Bissouma', 38], ['Sarr', 29], ['Maddison', 10],
  ['Kulusevski', 21], ['Son', 7], ['Richarlison', 9],
], [
  ['Forster', 20, 'GK'],
  ['Emerson', 12, 'DEF'], ['Davies', 33, 'DEF'],
  ['Bentancur', 30, 'MID'], ['Lo Celso', 18, 'MID'],
  ['Johnson', 22, 'FWD'], ['Werner', 16, 'FWD'],
])

export const manunitedTottenhamH2H = createH2H('曼联', '热刺', [
  ['2025-11-30', '热刺', '曼联', 2, 1, 'Premier League'],
  ['2025-09-14', '曼联', '热刺', 3, 2, 'Premier League'],
  ['2025-01-15', '热刺', '曼联', 0, 2, 'FA Cup'],
  ['2024-09-28', '曼联', '热刺', 0, 3, 'Premier League'],
  ['2024-04-07', '热刺', '曼联', 2, 2, 'Premier League'],
])

// ─── Newcastle vs Brighton (finished 3-2) ───

export const newcastleLineup = createLineup('4-3-3', 'Eddie Howe', [
  ['Pope', 22],
  ['Trippier', 2], ['Botman', 4], ['Schär', 5, true], ['Burn', 33],
  ['Tonali', 8], ['Guimarães', 39], ['Joelinton', 7],
  ['Gordon', 10], ['Isak', 14], ['Barnes', 11],
], [
  ['Dubravka', 1, 'GK'],
  ['Lascelles', 6, 'DEF'], ['Targett', 13, 'DEF'],
  ['Longstaff', 36, 'MID'], ['Willock', 28, 'MID'],
  ['Murphy', 23, 'FWD'], ['Wilson', 9, 'FWD'],
])

export const brightonLineup = createLineup('4-2-3-1', 'Roberto De Zerbi', [
  ['Verbruggen', 1],
  ['Veltman', 34], ['Dunk', 5, true], ['Van Hecke', 29], ['Estupiñán', 30],
  ['Gilmour', 4], ['Gross', 13],
  ['Adingra', 7], ['Joao Pedro', 9], ['Mitoma', 22],
  ['Welbeck', 18],
], [
  ['Steele', 20, 'GK'],
  ['Webster', 3, 'DEF'], ['Lamptey', 2, 'DEF'],
  ['Dahoud', 8, 'MID'], ['Baleba', 45, 'MID'],
  ['Ferguson', 14, 'FWD'], ['Enciso', 10, 'FWD'],
])

export const newcastleBrightonH2H = createH2H('纽卡斯尔', '布莱顿', [
  ['2025-11-08', '布莱顿', '纽卡斯尔', 1, 1, 'Premier League'],
  ['2025-04-19', '纽卡斯尔', '布莱顿', 2, 0, 'Premier League'],
  ['2024-12-04', '布莱顿', '纽卡斯尔', 3, 1, 'Premier League'],
  ['2024-05-11', '纽卡斯尔', '布莱顿', 1, 1, 'Premier League'],
  ['2023-09-02', '布莱顿', '纽卡斯尔', 3, 1, 'Premier League'],
])

export const newcastleBrightonEvents: MatchEvent[] = [
  { minute: 8, type: 'goal', team: 'home', playerName: 'Isak', detail: '助攻: Trippier' },
  { minute: 22, type: 'goal', team: 'away', playerName: 'Joao Pedro', detail: '助攻: Mitoma' },
  { minute: 31, type: 'yellow_card', team: 'away', playerName: 'Gilmour' },
  { minute: 44, type: 'goal', team: 'home', playerName: 'Gordon', detail: '助攻: Guimarães' },
  { minute: 53, type: 'goal', team: 'away', playerName: 'Welbeck', detail: '头球' },
  { minute: 60, type: 'substitution', team: 'away', playerName: 'Ferguson', detail: '换下: Welbeck' },
  { minute: 72, type: 'yellow_card', team: 'home', playerName: 'Tonali' },
  { minute: 77, type: 'goal', team: 'home', playerName: 'Isak', detail: '助攻: Gordon' },
  { minute: 82, type: 'substitution', team: 'home', playerName: 'Wilson', detail: '换下: Barnes' },
  { minute: 89, type: 'yellow_card', team: 'away', playerName: 'Van Hecke' },
]

export const newcastleBrightonStats = createStats({
  possession: [44, 56], shots: [15, 13], shotsOnTarget: [8, 6],
  corners: [4, 7], fouls: [12, 9], offsides: [1, 2], yellowCards: [1, 2], redCards: [0, 0],
})

// ═══════════════════════════════════════════════════════════════
// UEFA CHAMPIONS LEAGUE
// ═══════════════════════════════════════════════════════════════

// ─── Real Madrid vs Barcelona (scheduled) ───

export const realmadridLineup = createLineup('4-3-3', 'Carlo Ancelotti', [
  ['Courtois', 1],
  ['Carvajal', 2], ['Militão', 3], ['Rüdiger', 22, true], ['Mendy', 23],
  ['Valverde', 15], ['Tchouaméni', 18], ['Bellingham', 5],
  ['Rodrygo', 11], ['Mbappé', 9], ['Vinícius Jr.', 7],
], [
  ['Lunin', 13, 'GK'],
  ['Nacho', 6, 'DEF'], ['Alaba', 4, 'DEF'],
  ['Camavinga', 12, 'MID'], ['Modrić', 10, 'MID'],
  ['Joselu', 14, 'FWD'], ['Güler', 19, 'FWD'],
])

export const barcelonaLineup = createLineup('4-3-3', 'Hansi Flick', [
  ['ter Stegen', 1],
  ['Koundé', 23], ['Araújo', 4, true], ['Cubarsí', 2], ['Balde', 3],
  ['Pedri', 8], ['De Jong', 21], ['Gavi', 6],
  ['Yamal', 19], ['Lewandowski', 9], ['Raphinha', 11],
], [
  ['Iñaki Peña', 13, 'GK'],
  ['Christensen', 15, 'DEF'], ['Marcos Alonso', 17, 'DEF'],
  ['Fermín', 16, 'MID'], ['Oriol Romeu', 18, 'MID'],
  ['Ferrán Torres', 7, 'FWD'], ['Vitor Roque', 14, 'FWD'],
])

export const realmadridBarcelonaH2H = createH2H('皇家马德里', '巴塞罗那', [
  ['2025-10-26', '巴塞罗那', '皇家马德里', 1, 2, 'La Liga'],
  ['2025-05-03', '皇家马德里', '巴塞罗那', 3, 2, 'Copa del Rey Final'],
  ['2025-01-12', '皇家马德里', '巴塞罗那', 2, 1, 'Spanish Super Cup'],
  ['2024-10-28', '皇家马德里', '巴塞罗那', 0, 4, 'La Liga'],
  ['2024-04-21', '巴塞罗那', '皇家马德里', 3, 2, 'La Liga'],
])

// ─── PSG vs Bayern Munich (live 41', 1-1) ───

export const psgLineup = createLineup('4-3-3', 'Luis Enrique', [
  ['Donnarumma', 99],
  ['Hakimi', 2], ['Marquinhos', 5, true], ['Skriniar', 37], ['Nuno Mendes', 25],
  ['Vitinha', 17], ['Zaïre-Emery', 33], ['Lee Kang-in', 19],
  ['Dembélé', 10], ['Gonçalo Ramos', 9], ['Barcola', 29],
], [
  ['Navas', 1, 'GK'],
  ['Beraldo', 31, 'DEF'], ['Hernández', 21, 'DEF'],
  ['Ugarte', 4, 'MID'], ['Soler', 28, 'MID'],
  ['Kolo Muani', 23, 'FWD'], ['Asensio', 11, 'FWD'],
])

export const bayernLineup = createLineup('4-2-3-1', 'Thomas Tuchel', [
  ['Neuer', 1],
  ['Kimmich', 6], ['Upamecano', 2], ['Kim Min-jae', 3, true], ['Davies', 19],
  ['Goretzka', 8], ['Musiala', 42],
  ['Sané', 10], ['Müller', 25], ['Coman', 11],
  ['Kane', 9],
], [
  ['Ulreich', 26, 'GK'],
  ['Mazraoui', 40, 'DEF'], ['De Ligt', 4, 'DEF'],
  ['Laimer', 27, 'MID'], ['Gravenberch', 38, 'MID'],
  ['Tel', 39, 'FWD'], ['Gnabry', 7, 'FWD'],
])

export const psgBayernH2H = createH2H('巴黎圣日耳曼', '拜仁慕尼黑', [
  ['2025-11-06', '拜仁慕尼黑', '巴黎圣日耳曼', 2, 1, 'Champions League'],
  ['2025-02-14', '巴黎圣日耳曼', '拜仁慕尼黑', 0, 1, 'Champions League'],
  ['2024-03-08', '拜仁慕尼黑', '巴黎圣日耳曼', 2, 0, 'Champions League R16'],
  ['2023-02-15', '巴黎圣日耳曼', '拜仁慕尼黑', 0, 1, 'Champions League R16'],
  ['2023-03-08', '拜仁慕尼黑', '巴黎圣日耳曼', 2, 0, 'Champions League R16'],
])

export const psgBayernEvents: MatchEvent[] = [
  { minute: 11, type: 'goal', team: 'home', playerName: 'Dembélé', detail: '助攻: Hakimi' },
  { minute: 20, type: 'yellow_card', team: 'away', playerName: 'Upamecano' },
  { minute: 33, type: 'goal', team: 'away', playerName: 'Kane', detail: '助攻: Musiala' },
  { minute: 38, type: 'yellow_card', team: 'home', playerName: 'Skriniar' },
]

export const psgBayernStats = createStats({
  possession: [52, 48], shots: [8, 7], shotsOnTarget: [4, 3],
  corners: [4, 3], fouls: [5, 6], offsides: [1, 2], yellowCards: [1, 1], redCards: [0, 0],
})

// ═══════════════════════════════════════════════════════════════
// LA LIGA
// ═══════════════════════════════════════════════════════════════

// ─── Atletico Madrid vs Real Sociedad (finished 2-0) ───

export const atleticoMadridLineup = createLineup('3-5-2', 'Diego Simeone', [
  ['Oblak', 13],
  ['Savić', 15], ['Giménez', 2, true], ['Hermoso', 22],
  ['Llorente', 14], ['Koke', 6], ['De Paul', 5], ['Barrios', 17], ['Carrasco', 21],
  ['Griezmann', 7], ['Morata', 9],
], [
  ['Grbić', 1, 'GK'],
  ['Witsel', 20, 'DEF'], ['Mandava', 23, 'DEF'],
  ['Gallagher', 4, 'MID'], ['Riquelme', 16, 'MID'],
  ['Correa', 10, 'FWD'], ['Memphis', 19, 'FWD'],
])

export const realSociedadLineup = createLineup('4-3-3', 'Imanol Alguacil', [
  ['Remiro', 1],
  ['Gorosabel', 2], ['Zubeldia', 4], ['Le Normand', 6, true], ['Muñoz', 3],
  ['Zubimendi', 8], ['Merino', 5], ['Brais Méndez', 10],
  ['Oyarzabal', 7], ['Sadiq', 9], ['Kubo', 14],
], [
  ['Marrero', 13, 'GK'],
  ['Aramburu', 22, 'DEF'], ['Elustondo', 24, 'DEF'],
  ['Illarramendi', 18, 'MID'], ['Turrientes', 15, 'MID'],
  ['Barrenetxea', 19, 'FWD'], ['Becker', 11, 'FWD'],
])

export const atleticoMadridRealSociedadH2H = createH2H('马德里竞技', '皇家社会', [
  ['2025-10-26', '皇家社会', '马德里竞技', 1, 1, 'La Liga'],
  ['2025-04-13', '马德里竞技', '皇家社会', 2, 1, 'La Liga'],
  ['2024-12-08', '皇家社会', '马德里竞技', 0, 2, 'La Liga'],
  ['2024-05-19', '马德里竞技', '皇家社会', 3, 1, 'La Liga'],
  ['2023-11-25', '皇家社会', '马德里竞技', 1, 0, 'La Liga'],
])

export const atleticoMadridRealSociedadEvents: MatchEvent[] = [
  { minute: 22, type: 'yellow_card', team: 'away', playerName: 'Zubimendi' },
  { minute: 38, type: 'goal', team: 'home', playerName: 'Griezmann', detail: '助攻: Koke' },
  { minute: 51, type: 'yellow_card', team: 'home', playerName: 'De Paul' },
  { minute: 58, type: 'substitution', team: 'away', playerName: 'Barrenetxea', detail: '换下: Sadiq' },
  { minute: 66, type: 'yellow_card', team: 'away', playerName: 'Merino' },
  { minute: 73, type: 'goal', team: 'home', playerName: 'Morata', detail: '助攻: Griezmann' },
  { minute: 80, type: 'substitution', team: 'home', playerName: 'Correa', detail: '换下: Morata' },
  { minute: 85, type: 'substitution', team: 'away', playerName: 'Becker', detail: '换下: Kubo' },
  { minute: 90, type: 'yellow_card', team: 'home', playerName: 'Savić' },
]

export const atleticoMadridRealSociedadStats = createStats({
  possession: [40, 60], shots: [11, 14], shotsOnTarget: [6, 3],
  corners: [3, 8], fouls: [15, 10], offsides: [1, 2], yellowCards: [2, 2], redCards: [0, 0],
})

// ─── Sevilla vs Villarreal (scheduled) ───

export const sevillaLineup = createLineup('4-3-3', 'Quique Sánchez Flores', [
  ['Bono', 13],
  ['Navas', 16], ['Badé', 3], ['Gudelj', 6, true], ['Acuña', 19],
  ['Rakitić', 10], ['Fernando', 5], ['Suso', 8],
  ['Ocampos', 7], ['En-Nesyri', 15], ['Gil', 21],
], [
  ['Dmitrović', 1, 'GK'],
  ['Montiel', 2, 'DEF'], ['Nianzou', 4, 'DEF'],
  ['Jordán', 24, 'MID'], ['Oliver Torres', 17, 'MID'],
  ['Rafa Mir', 9, 'FWD'], ['Lamela', 11, 'FWD'],
])

export const villarrealLineup = createLineup('4-4-2', 'Marcelino', [
  ['Pepe Reina', 25],
  ['Foyth', 2], ['Albiol', 3, true], ['Pau Torres', 4], ['Pedraza', 16],
  ['Parejo', 10], ['Coquelin', 6], ['Baena', 8], ['Chukwueze', 11],
  ['Moreno', 7], ['Jackson', 9],
], [
  ['Jorgensen', 1, 'GK'],
  ['Mandi', 22, 'DEF'], ['Cardona', 23, 'DEF'],
  ['Terrats', 15, 'MID'], ['Trigueros', 14, 'MID'],
  ['Pino', 19, 'FWD'], ['Sörloth', 17, 'FWD'],
])

export const sevillaVillarrealH2H = createH2H('塞维利亚', '比利亚雷亚尔', [
  ['2025-10-20', '比利亚雷亚尔', '塞维利亚', 2, 1, 'La Liga'],
  ['2025-04-06', '塞维利亚', '比利亚雷亚尔', 1, 1, 'La Liga'],
  ['2024-12-15', '比利亚雷亚尔', '塞维利亚', 3, 2, 'La Liga'],
  ['2024-05-05', '塞维利亚', '比利亚雷亚尔', 2, 1, 'La Liga'],
  ['2023-10-28', '比利亚雷亚尔', '塞维利亚', 0, 0, 'La Liga'],
])

// ─── Valencia vs Getafe (scheduled) ───

export const valenciaLineup = createLineup('4-4-2', 'Rubén Baraja', [
  ['Mamardashvili', 25],
  ['Thierry', 2], ['Diakhaby', 12], ['Mosquera', 4, true], ['Gayà', 14],
  ['Guillamón', 6], ['Pepelu', 18], ['Almeida', 8], ['Diego López', 11],
  ['Hugo Duro', 9], ['Mir', 7],
], [
  ['Rivero', 1, 'GK'],
  ['Cenk Özkacar', 15, 'DEF'], ['Foulquier', 17, 'DEF'],
  ['Javi Guerra', 20, 'MID'], ['André Almeida', 28, 'MID'],
  ['Rafa Mir', 22, 'FWD'],
])

export const getafeLineup = createLineup('4-4-2', 'José Bordalás', [
  ['David Soria', 13],
  ['Iglesias', 2], ['Djené', 6, true], ['Duarte', 4], ['Nyom', 12],
  ['Arambarri', 18], ['Maksimović', 23], ['Aleñá', 8], ['Jankto', 14],
  ['Borja Mayoral', 9], ['Enes Ünal', 7],
], [
  ['Yáñez', 1, 'GK'],
  ['Suárez', 22, 'DEF'], ['Alderete', 15, 'DEF'],
  ['González', 20, 'MID'], ['Portu', 10, 'MID'],
  ['Latasa', 19, 'FWD'],
])

export const valenciaGetafeH2H = createH2H('瓦伦西亚', '赫塔费', [
  ['2025-10-26', '赫塔费', '瓦伦西亚', 1, 0, 'La Liga'],
  ['2025-03-29', '瓦伦西亚', '赫塔费', 2, 2, 'La Liga'],
  ['2024-12-14', '赫塔费', '瓦伦西亚', 0, 1, 'La Liga'],
  ['2024-05-18', '瓦伦西亚', '赫塔费', 1, 0, 'La Liga'],
  ['2023-10-07', '赫塔费', '瓦伦西亚', 2, 1, 'La Liga'],
])
