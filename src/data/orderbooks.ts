import type { OrderbookSnapshot, OrderbookDelta } from '../types'
import { events } from './events'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function generateSnapshot(contractId: string, yesPrice: number): OrderbookSnapshot {
  const rand = seededRandom(hashString(contractId))
  const clamp = (v: number) => Math.round(Math.max(0.01, Math.min(0.99, v)) * 1000) / 1000

  const step = yesPrice >= 0.1 ? 0.005 + rand() * 0.01 : 0.005
  const levels = 8

  const bids: { price: number; quantity: number }[] = []
  const asks: { price: number; quantity: number }[] = []

  const bestBid = clamp(yesPrice - step * 0.5)
  const bestAsk = clamp(yesPrice + step * 0.5)

  for (let i = 0; i < levels; i++) {
    const bidPrice = clamp(bestBid - i * step)
    const askPrice = clamp(bestAsk + i * step)
    if (bidPrice >= 0.01) {
      bids.push({ price: Math.round(bidPrice * 1000) / 1000, quantity: 50 + Math.round(rand() * 450) })
    }
    if (askPrice <= 0.99) {
      asks.push({ price: Math.round(askPrice * 1000) / 1000, quantity: 50 + Math.round(rand() * 450) })
    }
  }

  bids.sort((a, b) => b.price - a.price)
  asks.sort((a, b) => a.price - b.price)

  return { marketId: contractId, bids, asks, seq: 1 }
}

function generateDeltas(contractId: string, snapshot: OrderbookSnapshot): OrderbookDelta[] {
  const rand = seededRandom(hashString(contractId + '-deltas'))
  const count = 12 + Math.round(rand() * 8)
  const deltas: OrderbookDelta[] = []

  const allPrices = [...snapshot.bids.map((l) => ({ price: l.price, side: 'bid' as const })), ...snapshot.asks.map((l) => ({ price: l.price, side: 'ask' as const }))]
  if (allPrices.length === 0) return deltas

  for (let i = 0; i < count; i++) {
    const pick = allPrices[Math.floor(rand() * allPrices.length)]
    deltas.push({
      marketId: contractId,
      seq: i + 2,
      side: pick.side,
      price: pick.price,
      quantity: 30 + Math.round(rand() * 470),
    })
  }

  return deltas
}

export const orderbookSnapshots: Record<string, OrderbookSnapshot> = {}
export const orderbookDeltas: Record<string, OrderbookDelta[]> = {}

for (const event of events) {
  for (const contract of event.contracts) {
    const yp = contract.yesPrice
    if (yp <= 0.01 || yp >= 0.99) continue

    const snap = generateSnapshot(contract.id, yp)
    orderbookSnapshots[contract.id] = snap
    orderbookDeltas[contract.id] = generateDeltas(contract.id, snap)
  }
}
