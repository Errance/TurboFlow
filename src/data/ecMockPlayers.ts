import type {
  ECAsset,
  ECDirection,
  ECGlobalBet,
  ECGlobalSettlement,
  ECLeaderboardEntry,
  ECTimeIncrement,
} from '../types/eventContract'
import { EC_BASE_PAYOUTS, EC_STRIKE_OFFSETS } from '../types/eventContract'
import { getPrice } from './ecPriceEngine'

const PLAYER_NAMES = [
  'CryptoWhale', 'BTCMaxi', 'SatoshiFan', 'DiamondHands', 'MoonShot',
  'DeFiKing', 'AltSeason', 'GasGuzzler', 'WenLambo', 'HodlGang',
  'BlockBuster', 'HashRate', 'TokenTiger', 'ChainLink', 'NodeRunner',
  'StakePool', 'YieldFarm', 'FlashLoan', 'RektProof', 'BearSlayer',
  'BullRunner', 'CandleKing', 'LiqHunter', 'PumpIt', 'AlphaLeaker',
  'SmartMoney', 'DumbMoney', 'PaperHand', 'IronFist', 'GigaBrain',
  'CopiumMax', 'FOMOBuyer', 'DipCatcher', 'TopSignal', 'BottomFisher',
  'Anon42069', 'Ngmi404', 'GmFrens', 'RugPuller', 'ShibArmy',
  'DogeKnight', 'EthMaxi', 'SolSurfer', 'ApeStrong', 'Wagmi99',
  'ZeroDay', 'OGMiner', 'NftFlip', 'L2Gang', 'RollupKid',
  'MEVBot', 'GweiLord', 'TxSniper', 'BridgePro', 'DaoVoter',
  'LPKing', 'PermaBull', 'ShortSqueeze', 'LevTrader', 'SpotOnly',
  'OnChain42', 'Mempool', 'Validator', 'Proposer', 'Attestor',
]

const ASSETS: ECAsset[] = ['BTC', 'ETH']
const DURATIONS: ECTimeIncrement[] = [60, 300, 900]
const AMOUNTS = [5, 10, 20, 50, 100, 200]

let nextGlobalId = 1

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

// --------------- Leaderboard seed ---------------

function generateLeaderboard(): ECLeaderboardEntry[] {
  const shuffled = [...PLAYER_NAMES].sort(() => Math.random() - 0.5).slice(0, 50)
  return shuffled.map((name, i) => ({
    rank: i + 1,
    playerName: name,
    maxStreak: Math.floor(randBetween(2, 22)),
    bestSinglePnl: Math.round(randBetween(20, 3000) * 100) / 100,
    totalPnl: Math.round(randBetween(50, 20000) * 100) / 100,
  })).sort((a, b) => b.totalPnl - a.totalPnl).map((e, i) => ({ ...e, rank: i + 1 }))
}

// --------------- Engine state ---------------

type SettlementListener = (s: ECGlobalSettlement) => void
type FeedListener = (b: ECGlobalBet) => void
type LeaderboardListener = (lb: ECLeaderboardEntry[]) => void

let feedInterval: ReturnType<typeof setInterval> | null = null
let leaderboardInterval: ReturnType<typeof setInterval> | null = null
const activeGlobalBets: Map<string, { bet: ECGlobalBet; timer: ReturnType<typeof setTimeout> }> = new Map()
const settlementListeners = new Set<SettlementListener>()
const feedListeners = new Set<FeedListener>()
const leaderboardListeners = new Set<LeaderboardListener>()
let currentLeaderboard = generateLeaderboard()

function generateBet(): ECGlobalBet {
  const asset = pick(ASSETS)
  const direction: ECDirection = Math.random() > 0.5 ? 'higher' : 'lower'
  const amount = pick(AMOUNTS)
  const duration = pick(DURATIONS)
  const price = getPrice(asset)
  const offset = EC_STRIKE_OFFSETS[duration]
  const basePayout = EC_BASE_PAYOUTS[duration]
  const drift = (Math.random() - 0.5) * 0.04
  const payout = Math.max(0.3, Math.min(0.95, basePayout + (direction === 'higher' ? drift : -drift)))
  const strikePrice = direction === 'higher'
    ? price * (1 + offset)
    : price * (1 - offset)

  const now = Date.now()
  const id = `global-${nextGlobalId++}`

  return {
    id,
    roundId: `ground-${now}`,
    playerName: pick(PLAYER_NAMES),
    asset,
    direction,
    amount,
    payout,
    strikePrice,
    entryPrice: price,
    duration,
    status: 'active',
    createdAt: now,
    endsAt: now + Math.round(randBetween(8, 15)) * 1000,
  }
}

function settleMockBet(bet: ECGlobalBet) {
  const settlementPrice = getPrice(bet.asset)
  const won = bet.direction === 'higher'
    ? settlementPrice > bet.strikePrice
    : settlementPrice < bet.strikePrice
  const pnl = won ? bet.amount * bet.payout : -bet.amount

  const settled: ECGlobalBet = {
    ...bet,
    status: won ? 'won' : 'lost',
    settlementPrice,
    pnl,
  }

  activeGlobalBets.delete(bet.id)

  for (const cb of feedListeners) cb(settled)

  const settlement: ECGlobalSettlement = {
    id: `gs-${bet.id}`,
    playerName: bet.playerName,
    asset: bet.asset,
    direction: bet.direction,
    pnl,
    price: settlementPrice,
    timestamp: Date.now(),
  }
  for (const cb of settlementListeners) cb(settlement)
}

function spawnBet() {
  const bet = generateBet()
  const ttl = bet.endsAt - bet.createdAt
  const timer = setTimeout(() => settleMockBet(bet), ttl)
  activeGlobalBets.set(bet.id, { bet, timer })
  for (const cb of feedListeners) cb(bet)
}

function refreshLeaderboard() {
  currentLeaderboard = currentLeaderboard.map((e) => ({
    ...e,
    maxStreak: Math.max(e.maxStreak, e.maxStreak + Math.floor(randBetween(-1, 2))),
    bestSinglePnl: Math.round((e.bestSinglePnl + randBetween(-20, 50)) * 100) / 100,
    totalPnl: Math.round((e.totalPnl + randBetween(-50, 150)) * 100) / 100,
  })).sort((a, b) => b.totalPnl - a.totalPnl).map((e, i) => ({ ...e, rank: i + 1 }))

  for (const cb of leaderboardListeners) cb(currentLeaderboard)
}

// --------------- Public API ---------------

export function startMockEngine() {
  if (feedInterval) return

  for (let i = 0; i < 5; i++) {
    setTimeout(spawnBet, i * 600)
  }

  feedInterval = setInterval(() => {
    spawnBet()
  }, randBetween(2000, 4000))

  leaderboardInterval = setInterval(refreshLeaderboard, 30000)
}

export function stopMockEngine() {
  if (feedInterval) { clearInterval(feedInterval); feedInterval = null }
  if (leaderboardInterval) { clearInterval(leaderboardInterval); leaderboardInterval = null }
  for (const { timer } of activeGlobalBets.values()) clearTimeout(timer)
  activeGlobalBets.clear()
}

export function onGlobalSettlement(cb: SettlementListener): () => void {
  settlementListeners.add(cb)
  return () => { settlementListeners.delete(cb) }
}

export function onGlobalFeed(cb: FeedListener): () => void {
  feedListeners.add(cb)
  return () => { feedListeners.delete(cb) }
}

export function onLeaderboardUpdate(cb: LeaderboardListener): () => void {
  leaderboardListeners.add(cb)
  return () => { leaderboardListeners.delete(cb) }
}

export function getLeaderboard(): ECLeaderboardEntry[] {
  return currentLeaderboard
}
