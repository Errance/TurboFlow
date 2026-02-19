export interface LeaderboardEntry {
  rank: number
  username: string
  pnl: number         // USDC, can be negative
  accuracy: number    // percentage 0-100
  volume: number      // USDC
  markets: number     // number of markets traded
}

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, username: 'whale_alpha', pnl: 24350, accuracy: 72, volume: 890000, markets: 156 },
  { rank: 2, username: 'prediction_king', pnl: 18920, accuracy: 68, volume: 720000, markets: 203 },
  { rank: 3, username: 'macro_trader', pnl: 15780, accuracy: 65, volume: 560000, markets: 89 },
  { rank: 4, username: 'degen_oracle', pnl: 12450, accuracy: 71, volume: 430000, markets: 312 },
  { rank: 5, username: 'signal_hunter', pnl: 9870, accuracy: 63, volume: 380000, markets: 67 },
  { rank: 6, username: 'polymath_pm', pnl: 7230, accuracy: 59, volume: 290000, markets: 145 },
  { rank: 7, username: 'news_sniper', pnl: 5640, accuracy: 66, volume: 210000, markets: 78 },
  { rank: 8, username: 'quant_steve', pnl: 4120, accuracy: 61, volume: 185000, markets: 234 },
  { rank: 9, username: 'event_driven', pnl: 2890, accuracy: 57, volume: 150000, markets: 92 },
  { rank: 10, username: 'sports_savant', pnl: 1560, accuracy: 64, volume: 120000, markets: 178 },
  { rank: 11, username: 'crypto_bear', pnl: -340, accuracy: 48, volume: 95000, markets: 45 },
  { rank: 12, username: 'moonshot_mike', pnl: -1280, accuracy: 42, volume: 78000, markets: 56 },
  { rank: 13, username: 'lucky_seven', pnl: -2150, accuracy: 39, volume: 62000, markets: 34 },
  { rank: 14, username: 'fomo_trader', pnl: -3900, accuracy: 35, volume: 210000, markets: 289 },
  { rank: 15, username: 'paper_hands', pnl: -5200, accuracy: 31, volume: 45000, markets: 23 },
]
