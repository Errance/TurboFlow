import type {
  Market, MatchTab, ButtonGroupMarket as BGM, OddsTableMarket as OTM,
  ScoreGridMarket as SGM, ComboGridMarket as CGM, RangeButtonsMarket as RBM,
  PlayerListMarket as PLM,
} from '../soccer/types'
import type {
  BinaryMarket, NegRiskEvent, Outcome, ClobMarket, ClobTab, OrderBook, OrderBookLevel,
} from './types'

let _idCounter = 0
function uid(prefix = 'm'): string {
  return `${prefix}-${++_idCounter}-${Math.random().toString(36).slice(2, 6)}`
}

export function convertOddsToPrice(odds: number): number {
  if (odds <= 1) return 99
  const raw = Math.round(100 / odds)
  return Math.max(1, Math.min(99, raw))
}

function isHalfLine(line: string): boolean {
  const n = parseFloat(line.replace(/[^0-9.\-]/g, ''))
  if (isNaN(n)) return false
  return n % 1 !== 0 && (n * 4) % 1 === 0
}

function isStrictHalfLine(line: string): boolean {
  const n = parseFloat(line.replace(/[^0-9.\-]/g, ''))
  if (isNaN(n)) return false
  return n % 1 === 0.5
}

function randomVolume(): number {
  return Math.floor(5000 + Math.random() * 50000)
}

export function generateOrderBook(yesPrice: number, depth = 5): OrderBook {
  const bids: OrderBookLevel[] = []
  const asks: OrderBookLevel[] = []

  for (let i = 0; i < depth; i++) {
    const bidPrice = Math.max(1, yesPrice - 1 - i)
    const askPrice = Math.min(99, yesPrice + 1 + i)
    bids.push({ price: bidPrice, quantity: Math.floor(50 + Math.random() * 500) })
    asks.push({ price: askPrice, quantity: Math.floor(50 + Math.random() * 500) })
  }

  return {
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price),
  }
}

function makeBinary(question: string, groupTitle: string, odds: number): BinaryMarket {
  const yesPrice = convertOddsToPrice(odds)
  return {
    type: 'binary',
    id: uid('bin'),
    question,
    groupTitle,
    yesPrice,
    noPrice: 100 - yesPrice,
    volume: randomVolume(),
    volume24h: randomVolume(),
    lastTradePrice: yesPrice,
    orderBook: generateOrderBook(yesPrice),
    status: 'open',
  }
}

function makeNegRisk(title: string, groupTitle: string, options: { label: string; odds: number }[]): NegRiskEvent {
  const filtered = options.filter(o => o.odds > 0 && o.label !== '-')
  const rawPrices = filtered.map(o => convertOddsToPrice(o.odds))
  const sum = rawPrices.reduce((a, b) => a + b, 0)
  const normalized = rawPrices.map(p => Math.max(1, Math.round(p * 100 / sum)))

  const outcomes: Outcome[] = filtered.map((o, i) => ({
    id: uid('out'),
    label: o.label,
    yesPrice: normalized[i],
    noPrice: 100 - normalized[i],
    volume: randomVolume(),
    volume24h: randomVolume(),
    lastTradePrice: normalized[i],
    orderBook: generateOrderBook(normalized[i]),
  }))

  return {
    type: 'negRisk',
    id: uid('neg'),
    title,
    groupTitle,
    outcomes,
    status: 'open',
  }
}

// ============ Market Converters ============

function convertButtonGroup(m: BGM): ClobMarket | null {
  if (m.options.length === 2) {
    return makeBinary(`${m.title}: ${m.options[0].label}?`, m.title, m.options[0].odds)
  }
  if (m.options.length >= 3) {
    return makeNegRisk(m.title, m.title, m.options)
  }
  return null
}

const DELETED_MARKETS = new Set([
  '平局返还', '双胜彩',
  '上半场 - 平局返还', '上半场 - 双胜彩',
  '下半场 - 平局返还', '下半场 - 双胜彩',
  '多进球', '进球范围',
])

function shouldDeleteMarket(title: string): boolean {
  if (DELETED_MARKETS.has(title)) return true
  if (title.includes('多进球') && !title.includes('1x2')) return true
  return false
}

function convertOddsTable(m: OTM): ClobMarket[] {
  if (m.columns.length === 3) return []

  const results: ClobMarket[] = []
  for (const row of m.rows) {
    const lineParts = row.line.split('/')
    const mainLine = lineParts[0].trim()

    if (m.columns.length === 2) {
      if (!isStrictHalfLine(mainLine) && !isHalfLine(mainLine)) continue

      const question = `${m.title} ${row.line}`
      results.push(makeBinary(question, m.title, row.odds[0]))
    }
  }
  return results
}

function convertScoreGrid(m: SGM): NegRiskEvent {
  const options = Object.entries(m.odds)
    .filter(([, odds]) => odds > 0)
    .map(([label, odds]) => ({ label, odds }))
  return makeNegRisk(m.title, m.title, options)
}

function convertComboGrid(m: CGM): NegRiskEvent {
  const options = m.cells
    .filter(c => c.odds > 0 && c.label !== '-')
    .map(c => ({ label: c.label, odds: c.odds }))
  return makeNegRisk(m.title, m.title, options)
}

function convertRangeButtons(m: RBM): NegRiskEvent {
  return makeNegRisk(m.title, m.title, m.options)
}

function convertPlayerList(m: PLM): BinaryMarket[] {
  const top10 = m.players.slice(0, 10)
  return top10.map(p =>
    makeBinary(`${p.name} 进球?`, m.title, p.odds[0])
  )
}

// ============ Single Market Converter ============

function convertMarket(m: Market): ClobMarket[] {
  if (shouldDeleteMarket(m.title)) return []

  switch (m.type) {
    case 'buttonGroup':
      if (shouldDeleteMarket(m.title)) return []
      const bg = convertButtonGroup(m)
      return bg ? [bg] : []

    case 'oddsTable':
      return convertOddsTable(m)

    case 'scoreGrid':
      return [convertScoreGrid(m)]

    case 'comboGrid':
      return [convertComboGrid(m)]

    case 'rangeButtons':
      return [convertRangeButtons(m)]

    case 'playerList':
      if (m.title === '任何时间进球队员') {
        return convertPlayerList(m)
      }
      return []

    default:
      return []
  }
}

// ============ Tab Builder ============

const DELETED_TABS = new Set(['bet-builder', 'goalscorer', 'players', 'minutes'])

const TAB_ORDER = ['home', 'goals', 'halves', 'asian', 'corners', 'cards', 'specials']
const TAB_LABELS: Record<string, string> = {
  home: '主页', goals: '进球', halves: '上半场/下半场',
  asian: '亚洲盘', corners: '角球', cards: '罚牌', specials: '特殊投注',
}

export function buildClobTabs(oldTabs: MatchTab[]): ClobTab[] {
  const goalscorerTab = oldTabs.find(t => t.id === 'goalscorer')
  let goalscorerBinaries: BinaryMarket[] = []
  if (goalscorerTab) {
    const anytimeMarket = goalscorerTab.markets.find(
      m => m.type === 'playerList' && m.title === '任何时间进球队员'
    )
    if (anytimeMarket) {
      goalscorerBinaries = convertPlayerList(anytimeMarket as PLM)
    }
  }

  const clobTabs: ClobTab[] = []

  for (const tabId of TAB_ORDER) {
    const oldTab = oldTabs.find(t => t.id === tabId)
    if (!oldTab && tabId !== 'specials') continue
    if (DELETED_TABS.has(tabId)) continue

    const markets: ClobMarket[] = []
    const seen = new Set<string>()

    if (oldTab) {
      for (const m of oldTab.markets) {
        if (seen.has(m.title)) continue
        seen.add(m.title)
        markets.push(...convertMarket(m))
      }
    }

    if (tabId === 'specials' && goalscorerBinaries.length > 0) {
      markets.push(...goalscorerBinaries)
    }

    if (markets.length > 0) {
      clobTabs.push({
        id: tabId,
        label: TAB_LABELS[tabId] ?? oldTab?.label ?? tabId,
        markets,
      })
    }
  }

  return clobTabs
}

export function countMarkets(tabs: ClobTab[]): number {
  let count = 0
  for (const tab of tabs) {
    for (const m of tab.markets) {
      if (m.type === 'binary') count++
      else count += m.outcomes.length
    }
  }
  return count
}

export function extractMoneyline(tabs: ClobTab[]): { home: number; draw: number; away: number } {
  const homeTab = tabs.find(t => t.id === 'home')
  if (!homeTab) return { home: 33, draw: 33, away: 34 }
  const m1x2 = homeTab.markets.find(m => m.type === 'negRisk' && m.title === '胜平负') as NegRiskEvent | undefined
  if (!m1x2 || m1x2.outcomes.length < 3) return { home: 33, draw: 33, away: 34 }
  return {
    home: m1x2.outcomes[0].yesPrice,
    draw: m1x2.outcomes[1].yesPrice,
    away: m1x2.outcomes[2].yesPrice,
  }
}

export function extractTotalLine(tabs: ClobTab[]): { line: number; overPrice: number; underPrice: number } {
  for (const tab of tabs) {
    for (const m of tab.markets) {
      if (m.type === 'binary' && m.question.includes('合计') && m.question.includes('2.5')) {
        return { line: 2.5, overPrice: m.yesPrice, underPrice: m.noPrice }
      }
    }
  }
  return { line: 2.5, overPrice: 49, underPrice: 51 }
}

export function extractAsianLine(tabs: ClobTab[]): { line: string; homePrice: number; awayPrice: number } {
  for (const tab of tabs) {
    for (const m of tab.markets) {
      if (m.type === 'binary' && m.groupTitle === '亚洲让分盘' && m.question.includes('-0.5')) {
        return { line: '-0.5 / 0.5', homePrice: m.yesPrice, awayPrice: m.noPrice }
      }
    }
  }
  return { line: '-0.5 / 0.5', homePrice: 45, awayPrice: 55 }
}
