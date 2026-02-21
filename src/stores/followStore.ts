import { create } from 'zustand'

export interface Forecaster {
  id: string
  username: string
  accuracy: number
  totalForecasts: number
  pnl: number
  bio: string
}

interface FollowState {
  following: Set<string>
  forecasters: Forecaster[]
  toggleFollow: (forecasterId: string) => void
  isFollowing: (forecasterId: string) => boolean
}

const mockForecasters: Forecaster[] = [
  { id: 'fc-1', username: 'CryptoOracle', accuracy: 72, totalForecasts: 148, pnl: 45200, bio: 'Crypto & macro specialist. 4 years of on-chain analysis.' },
  { id: 'fc-2', username: 'MacroHawk', accuracy: 68, totalForecasts: 95, pnl: 32100, bio: 'Former rates trader. Focus on Fed policy and yield curve.' },
  { id: 'fc-3', username: 'SportsEdge', accuracy: 65, totalForecasts: 220, pnl: 28700, bio: 'Statistical sports modeling. NBA, NFL, MLB.' },
  { id: 'fc-4', username: 'PoliSci_Prof', accuracy: 71, totalForecasts: 67, pnl: 19500, bio: 'Political science professor. Election and policy markets.' },
  { id: 'fc-5', username: 'VixWhisperer', accuracy: 63, totalForecasts: 183, pnl: 15800, bio: 'Volatility trader. Options-implied probability analysis.' },
  { id: 'fc-6', username: 'TechForecast', accuracy: 66, totalForecasts: 112, pnl: 22400, bio: 'Tech industry insider. AI, chips, and regulation markets.' },
  { id: 'fc-7', username: 'DataDriven42', accuracy: 70, totalForecasts: 89, pnl: 18200, bio: 'Quantitative approach. Bayesian updating on public signals.' },
  { id: 'fc-8', username: 'GeopolitiQ', accuracy: 64, totalForecasts: 76, pnl: 12900, bio: 'Geopolitical risk analyst. Defense and foreign policy markets.' },
]

export const useFollowStore = create<FollowState>((set, get) => ({
  following: new Set<string>(),
  forecasters: mockForecasters,

  toggleFollow: (forecasterId) => {
    set((state) => {
      const next = new Set(state.following)
      if (next.has(forecasterId)) {
        next.delete(forecasterId)
      } else {
        next.add(forecasterId)
      }
      return { following: next }
    })
  },

  isFollowing: (forecasterId) => {
    return get().following.has(forecasterId)
  },
}))
