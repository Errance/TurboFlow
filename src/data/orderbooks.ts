import type { OrderbookSnapshot, OrderbookDelta } from '../types'

// --- Snapshots (seq = 1) ---

export const orderbookSnapshots: Record<string, OrderbookSnapshot> = {
  'mkt-btc-100k': {
    marketId: 'mkt-btc-100k',
    bids: [
      { price: 65, quantity: 320 },
      { price: 64.5, quantity: 185 },
      { price: 64, quantity: 420 },
      { price: 63.5, quantity: 95 },
      { price: 63, quantity: 275 },
      { price: 62.5, quantity: 150 },
      { price: 62, quantity: 380 },
      { price: 61.5, quantity: 210 },
    ],
    asks: [
      { price: 66, quantity: 195 },
      { price: 66.5, quantity: 340 },
      { price: 67, quantity: 125 },
      { price: 67.5, quantity: 280 },
      { price: 68, quantity: 165 },
      { price: 68.5, quantity: 410 },
      { price: 69, quantity: 90 },
      { price: 69.5, quantity: 235 },
    ],
    seq: 1,
  },
  'mkt-fed-rates': {
    marketId: 'mkt-fed-rates',
    bids: [
      { price: 42, quantity: 175 },
      { price: 41.5, quantity: 290 },
      { price: 41, quantity: 115 },
      { price: 40.5, quantity: 365 },
      { price: 40, quantity: 220 },
      { price: 39.5, quantity: 85 },
      { price: 39, quantity: 310 },
      { price: 38.5, quantity: 155 },
    ],
    asks: [
      { price: 43, quantity: 245 },
      { price: 43.5, quantity: 130 },
      { price: 44, quantity: 395 },
      { price: 44.5, quantity: 180 },
      { price: 45, quantity: 265 },
      { price: 45.5, quantity: 105 },
      { price: 46, quantity: 340 },
      { price: 46.5, quantity: 200 },
    ],
    seq: 1,
  },
}

// --- Delta sequences (seq 2..N, simulating live market activity) ---

export const orderbookDeltas: Record<string, OrderbookDelta[]> = {
  'mkt-btc-100k': [
    { marketId: 'mkt-btc-100k', seq: 2, side: 'bid', price: 65, quantity: 285 },
    { marketId: 'mkt-btc-100k', seq: 3, side: 'ask', price: 66, quantity: 220 },
    { marketId: 'mkt-btc-100k', seq: 4, side: 'bid', price: 64.5, quantity: 210 },
    { marketId: 'mkt-btc-100k', seq: 5, side: 'ask', price: 66.5, quantity: 295 },
    { marketId: 'mkt-btc-100k', seq: 6, side: 'bid', price: 64, quantity: 380 },
    { marketId: 'mkt-btc-100k', seq: 7, side: 'bid', price: 65, quantity: 310 },
    { marketId: 'mkt-btc-100k', seq: 8, side: 'ask', price: 67, quantity: 95 },
    { marketId: 'mkt-btc-100k', seq: 9, side: 'ask', price: 66, quantity: 175 },
    { marketId: 'mkt-btc-100k', seq: 10, side: 'bid', price: 63.5, quantity: 120 },
    { marketId: 'mkt-btc-100k', seq: 11, side: 'ask', price: 67.5, quantity: 245 },
    { marketId: 'mkt-btc-100k', seq: 12, side: 'bid', price: 62.5, quantity: 185 },
    { marketId: 'mkt-btc-100k', seq: 13, side: 'bid', price: 65, quantity: 265 },
    { marketId: 'mkt-btc-100k', seq: 14, side: 'ask', price: 66.5, quantity: 320 },
    { marketId: 'mkt-btc-100k', seq: 15, side: 'bid', price: 64, quantity: 410 },
    { marketId: 'mkt-btc-100k', seq: 16, side: 'ask', price: 68, quantity: 140 },
    { marketId: 'mkt-btc-100k', seq: 17, side: 'bid', price: 63, quantity: 230 },
    { marketId: 'mkt-btc-100k', seq: 18, side: 'ask', price: 66, quantity: 195 },
  ],
  'mkt-fed-rates': [
    { marketId: 'mkt-fed-rates', seq: 2, side: 'bid', price: 42, quantity: 155 },
    { marketId: 'mkt-fed-rates', seq: 3, side: 'ask', price: 43, quantity: 270 },
    { marketId: 'mkt-fed-rates', seq: 4, side: 'bid', price: 41.5, quantity: 305 },
    { marketId: 'mkt-fed-rates', seq: 5, side: 'ask', price: 43.5, quantity: 115 },
    { marketId: 'mkt-fed-rates', seq: 6, side: 'bid', price: 41, quantity: 95 },
    { marketId: 'mkt-fed-rates', seq: 7, side: 'bid', price: 42, quantity: 190 },
    { marketId: 'mkt-fed-rates', seq: 8, side: 'ask', price: 44, quantity: 360 },
    { marketId: 'mkt-fed-rates', seq: 9, side: 'ask', price: 43, quantity: 220 },
    { marketId: 'mkt-fed-rates', seq: 10, side: 'bid', price: 40.5, quantity: 340 },
    { marketId: 'mkt-fed-rates', seq: 11, side: 'ask', price: 44.5, quantity: 165 },
    { marketId: 'mkt-fed-rates', seq: 12, side: 'bid', price: 41, quantity: 130 },
    { marketId: 'mkt-fed-rates', seq: 13, side: 'bid', price: 42, quantity: 175 },
    { marketId: 'mkt-fed-rates', seq: 14, side: 'ask', price: 43.5, quantity: 145 },
    { marketId: 'mkt-fed-rates', seq: 15, side: 'bid', price: 40, quantity: 195 },
    { marketId: 'mkt-fed-rates', seq: 16, side: 'ask', price: 44, quantity: 385 },
    { marketId: 'mkt-fed-rates', seq: 17, side: 'bid', price: 41.5, quantity: 275 },
    { marketId: 'mkt-fed-rates', seq: 18, side: 'ask', price: 43, quantity: 255 },
    { marketId: 'mkt-fed-rates', seq: 19, side: 'bid', price: 39.5, quantity: 70 },
    { marketId: 'mkt-fed-rates', seq: 20, side: 'ask', price: 45, quantity: 240 },
  ],
}
