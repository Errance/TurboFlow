import type { MatchLineup, MatchPlayer } from './types'

type P = { name: string; odds: number[] }

export interface PlayerMarkets {
  anytimeGoalscorer: P[]
  firstGoalscorer: P[]
  lastGoalscorer: P[]
  assists: P[]
  cards: P[]
  shotsOnTarget: P[]
  shots: P[]
}

const BASE_ODDS: Record<MatchPlayer['position'], number> = {
  FWD: 2.80,
  MID: 4.20,
  DEF: 8.00,
  GK: 30.00,
}

function seededRandom(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(31, h) + name.charCodeAt(i) | 0
  }
  return ((h >>> 0) % 100) / 100
}

function jitter(base: number, name: string, scale = 0.25): number {
  const r = seededRandom(name)
  const factor = 1 + (r - 0.5) * scale * 2
  return Math.round(factor * base * 100) / 100
}

function sortByOdds(list: P[]): P[] {
  return [...list].sort((a, b) => a.odds[0] - b.odds[0])
}

function buildAnytimeGoalscorer(players: MatchPlayer[]): P[] {
  return sortByOdds(players.map((p) => ({
    name: p.name,
    odds: [jitter(BASE_ODDS[p.position], p.name)],
  })))
}

function buildFirstGoalscorer(players: MatchPlayer[]): P[] {
  return sortByOdds(players.map((p) => ({
    name: p.name,
    odds: [jitter(BASE_ODDS[p.position] * 2.05, p.name)],
  })))
}

function buildAssists(players: MatchPlayer[]): P[] {
  const mids = players.filter((p) => p.position === 'MID' || p.position === 'FWD' || p.position === 'DEF')
  return sortByOdds(mids.map((p) => {
    const base = p.position === 'MID' ? 3.50 : p.position === 'FWD' ? 4.80 : 6.40
    const o1 = jitter(base, p.name)
    return { name: p.name, odds: [o1, Math.round(o1 * 5.2 * 100) / 100] }
  }))
}

function buildCards(players: MatchPlayer[]): P[] {
  const outfield = players.filter((p) => p.position !== 'GK')
  return sortByOdds(outfield.map((p) => {
    const base = p.position === 'DEF' ? 2.50 : p.position === 'MID' ? 3.00 : 3.80
    return { name: p.name, odds: [jitter(base, p.name)] }
  }))
}

function buildShotsOnTarget(players: MatchPlayer[]): P[] {
  const shooters = players.filter((p) => p.position !== 'GK')
  return sortByOdds(shooters.map((p) => {
    const base = p.position === 'FWD' ? 1.35 : p.position === 'MID' ? 1.55 : 2.20
    const o1 = jitter(base, p.name)
    return {
      name: p.name,
      odds: [o1, +(o1 * 2.1).toFixed(2), +(o1 * 5.8).toFixed(2), +(o1 * 14).toFixed(2), +(o1 * 35).toFixed(2)],
    }
  }))
}

function buildShots(players: MatchPlayer[]): P[] {
  const shooters = players.filter((p) => p.position !== 'GK')
  return sortByOdds(shooters.map((p) => {
    const base = p.position === 'FWD' ? 1.10 : p.position === 'MID' ? 1.20 : 1.45
    const o1 = jitter(base, p.name)
    return {
      name: p.name,
      odds: [o1, +(o1 * 1.6).toFixed(2), +(o1 * 2.8).toFixed(2), +(o1 * 5.5).toFixed(2), +(o1 * 13).toFixed(2), +(o1 * 28).toFixed(2)],
    }
  }))
}

export function createPlayerMarkets(homeLineup: MatchLineup, awayLineup: MatchLineup): PlayerMarkets {
  const allPlayers = [...homeLineup.players, ...homeLineup.substitutes, ...awayLineup.players, ...awayLineup.substitutes]

  return {
    anytimeGoalscorer: buildAnytimeGoalscorer(allPlayers),
    firstGoalscorer: buildFirstGoalscorer(allPlayers),
    lastGoalscorer: buildFirstGoalscorer(allPlayers),
    assists: buildAssists(allPlayers),
    cards: buildCards(allPlayers),
    shotsOnTarget: buildShotsOnTarget(allPlayers),
    shots: buildShots(allPlayers),
  }
}
