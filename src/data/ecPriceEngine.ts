import type { ECAsset } from '../types/eventContract'

type PriceCallback = (price: number) => void

interface AssetState {
  price: number
  history: number[]
  subscribers: Set<PriceCallback>
}

const INITIAL_PRICES: Record<ECAsset, number> = {
  BTC: 87000,
  ETH: 2050,
}

const MAX_HISTORY = 900 // 15 min of 1s ticks
const TICK_INTERVAL = 500 // ms
const VOLATILITY = 0.0004

const assets: Record<ECAsset, AssetState> = {
  BTC: { price: INITIAL_PRICES.BTC, history: [INITIAL_PRICES.BTC], subscribers: new Set() },
  ETH: { price: INITIAL_PRICES.ETH, history: [INITIAL_PRICES.ETH], subscribers: new Set() },
}

let intervalId: ReturnType<typeof setInterval> | null = null
let running = false

function tick() {
  for (const key of Object.keys(assets) as ECAsset[]) {
    const state = assets[key]
    const delta = state.price * (Math.random() - 0.5) * VOLATILITY * 2
    state.price = Math.max(state.price + delta, 1)
    state.history.push(state.price)
    if (state.history.length > MAX_HISTORY) {
      state.history.shift()
    }
    for (const cb of state.subscribers) {
      cb(state.price)
    }
  }
}

function ensureRunning() {
  if (running) return
  running = true
  intervalId = setInterval(tick, TICK_INTERVAL)
}

export function getPrice(asset: ECAsset): number {
  return assets[asset].price
}

export function getPriceHistory(asset: ECAsset, count?: number): number[] {
  const h = assets[asset].history
  if (!count || count >= h.length) return [...h]
  return h.slice(-count)
}

export function subscribe(asset: ECAsset, callback: PriceCallback): () => void {
  ensureRunning()
  assets[asset].subscribers.add(callback)
  return () => {
    assets[asset].subscribers.delete(callback)
    const totalSubs = Object.values(assets).reduce((n, s) => n + s.subscribers.size, 0)
    if (totalSubs === 0 && intervalId) {
      clearInterval(intervalId)
      intervalId = null
      running = false
    }
  }
}

export function getAllPrices(): Record<ECAsset, number> {
  return { BTC: assets.BTC.price, ETH: assets.ETH.price }
}
