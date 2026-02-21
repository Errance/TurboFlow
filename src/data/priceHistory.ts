export interface PricePoint {
  time: string
  yes: number
  no: number
}

function generateHistory(
  startPrice: number,
  days: number,
  volatility: number,
  seed: number,
): PricePoint[] {
  const points: PricePoint[] = []
  let price = startPrice
  let s = seed

  const baseDate = new Date('2025-11-20T00:00:00Z')

  for (let d = 0; d < days; d++) {
    const date = new Date(baseDate.getTime() + d * 86400000)
    const dateStr = date.toISOString().split('T')[0]

    s = (s * 1103515245 + 12345) & 0x7fffffff
    const rand = (s / 0x7fffffff - 0.5) * 2

    const drift = (d / days) * (startPrice > 50 ? 3 : -2)
    price += rand * volatility + drift * 0.05
    price = Math.max(5, Math.min(95, price))
    const yes = Math.round(price * 100) / 100
    points.push({ time: dateStr, yes, no: Math.round((100 - yes) * 100) / 100 })
  }

  return points
}

const staticHistories: Record<string, PricePoint[]> = {
  'mkt-btc-100k': generateHistory(58, 90, 2.5, 42),
  'mkt-fed-rates': generateHistory(38, 90, 1.8, 77),
  'mkt-eth-merge': generateHistory(70, 75, 2.0, 13),
  'mkt-us-gdp': generateHistory(50, 60, 1.5, 99),
  'mkt-apple-ar': generateHistory(30, 90, 3.0, 55),
  'mkt-tsla-400': generateHistory(60, 90, 4.0, 31),
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const dynamicCache: Record<string, PricePoint[]> = {}

export function getPriceHistory(marketId: string): PricePoint[] {
  if (staticHistories[marketId]) return staticHistories[marketId]
  if (dynamicCache[marketId]) return dynamicCache[marketId]
  const h = hashString(marketId)
  const startPrice = 20 + (h % 60)
  const days = 45 + (h % 60)
  const volatility = 1.0 + (h % 30) / 10
  dynamicCache[marketId] = generateHistory(startPrice, days, volatility, h)
  return dynamicCache[marketId]
}

export const priceHistories: Record<string, PricePoint[]> = staticHistories
