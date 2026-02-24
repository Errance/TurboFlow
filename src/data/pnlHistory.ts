export interface PnlSnapshot {
  time: string
  value: number
}

export type PnlRange = '1D' | '1W' | '1M' | 'ALL'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function generateDailyPnl(): PnlSnapshot[] {
  const rand = seededRandom(314159)
  const points: PnlSnapshot[] = []
  let cumulative = 0
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 89)

  for (let d = 0; d < 90; d++) {
    const date = new Date(start)
    date.setDate(start.getDate() + d)
    const dateStr = date.toISOString().split('T')[0]

    const drift = 0.08
    const change = (rand() - 0.48) * 6 + drift
    cumulative += change
    points.push({ time: dateStr, value: Math.round(cumulative * 100) / 100 })
  }

  return points
}

function generateHourlyPnl(): PnlSnapshot[] {
  const rand = seededRandom(271828)
  const points: PnlSnapshot[] = []
  let cumulative = 7.0
  const now = new Date()
  const start = new Date(now)
  start.setHours(start.getHours() - 23, 0, 0, 0)

  for (let h = 0; h < 24; h++) {
    const date = new Date(start)
    date.setHours(start.getHours() + h)
    const dateStr = date.toISOString().split('T')[0]
    const timeStr = `${dateStr} ${String(date.getHours()).padStart(2, '0')}:00`

    const change = (rand() - 0.5) * 1.2
    cumulative += change
    points.push({ time: timeStr, value: Math.round(cumulative * 100) / 100 })
  }

  return points
}

let _daily: PnlSnapshot[] | null = null
let _hourly: PnlSnapshot[] | null = null

function getDailyData(): PnlSnapshot[] {
  if (!_daily) _daily = generateDailyPnl()
  return _daily
}

function getHourlyData(): PnlSnapshot[] {
  if (!_hourly) _hourly = generateHourlyPnl()
  return _hourly
}

export function getPnlHistory(range: PnlRange): PnlSnapshot[] {
  if (range === '1D') return getHourlyData()

  const daily = getDailyData()
  if (range === 'ALL') return daily
  if (range === '1M') return daily.slice(-30)
  if (range === '1W') return daily.slice(-7)
  return daily
}

export function getLatestPnl(): number {
  const daily = getDailyData()
  return daily[daily.length - 1]?.value ?? 0
}
