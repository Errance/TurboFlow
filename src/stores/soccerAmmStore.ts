import { create } from 'zustand'
import {
  SOCCER_AMM_DUST_THRESHOLD_USDT,
  quoteAmmTrade,
  seedAmmPositions,
  type SoccerAmmOutcome,
  type SoccerAmmPosition,
  type SoccerAmmPriceFormat,
  type SoccerAmmQuote,
  type SoccerAmmSide,
  type SoccerAmmTrade,
} from '../data/soccer/ammData'
import { useToastStore } from './toastStore'
import { useWalletStore } from './walletStore'
import { attachPersist, loadState } from './persist'

interface PersistedAmm {
  positions: SoccerAmmPosition[]
  trades: SoccerAmmTrade[]
  priceFormat: SoccerAmmPriceFormat
}

interface SoccerAmmState {
  selectedOutcome: SoccerAmmOutcome | null
  side: SoccerAmmSide
  priceFormat: SoccerAmmPriceFormat
  positions: SoccerAmmPosition[]
  trades: SoccerAmmTrade[]
  selectOutcome: (outcome: SoccerAmmOutcome, side?: SoccerAmmSide) => void
  clearSelection: () => void
  setSide: (side: SoccerAmmSide) => void
  setPriceFormat: (format: SoccerAmmPriceFormat) => void
  quote: (value: number, mode: 'collateral' | 'shares') => SoccerAmmQuote | null
  executeTrade: (quote: SoccerAmmQuote) => boolean
  getPosition: (outcomeId: string) => SoccerAmmPosition | undefined
  getPortfolioValue: () => number
  getUnrealizedPnl: () => number
}

const STORAGE_KEY = 'tf_soccer_amm'
const persisted = loadState<PersistedAmm>(STORAGE_KEY)

function makeTradeId() {
  return `rfq-trade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useSoccerAmmStore = create<SoccerAmmState>((set, get) => ({
  selectedOutcome: null,
  side: 'buy',
  priceFormat: persisted?.priceFormat ?? 'probability',
  positions: persisted?.positions ?? seedAmmPositions,
  trades: persisted?.trades ?? [],

  selectOutcome: (outcome, side = 'buy') => set({ selectedOutcome: outcome, side }),
  clearSelection: () => set({ selectedOutcome: null }),
  setSide: (side) => set({ side }),
  setPriceFormat: (priceFormat) => set({ priceFormat }),

  quote: (value, mode) => {
    const outcome = get().selectedOutcome
    if (!outcome || outcome.status !== 'open') return null
    if (get().side === 'sell') {
      const position = get().positions.find((item) => item.outcomeId === outcome.id)
      if (!position || position.shares <= 0) return null
      const shares = mode === 'shares' ? value : value / outcome.probability
      if (shares > position.shares) return null
    }
    return quoteAmmTrade(outcome, get().side, value, mode)
  },

  executeTrade: (quote) => {
    const outcome = get().selectedOutcome
    if (!outcome || outcome.status !== 'open') return false
    if (quote.expiresAt < Date.now()) {
      useToastStore.getState().addToast({ type: 'error', message: '报价已过期，请重新询价' })
      return false
    }

    const wallet = useWalletStore.getState()
    const side = get().side
    const totalCost = +(quote.collateral + quote.fee).toFixed(2)
    const netReturn = Math.max(0, +(quote.collateral - quote.fee).toFixed(2))
    const trade: SoccerAmmTrade = {
      id: makeTradeId(),
      side,
      outcomeId: outcome.id,
      marketTitle: outcome.marketTitle,
      outcomeLabel: outcome.label,
      shares: quote.shares,
      avgPrice: quote.avgPrice,
      collateral: side === 'buy' ? totalCost : netReturn,
      createdAt: new Date().toISOString(),
    }

    if (side === 'buy') {
      if (!wallet.deduct(totalCost)) {
        useToastStore.getState().addToast({ type: 'error', message: '余额不足，无法完成买入交易' })
        return false
      }
      wallet.releaseLocked(totalCost)
      set((state) => {
        const existing = state.positions.find((item) => item.outcomeId === outcome.id)
        const positions = existing
          ? state.positions.map((item) => {
              if (item.outcomeId !== outcome.id) return item
              const totalShares = item.shares + quote.shares
              const avgPrice = (item.shares * item.avgPrice + quote.shares * quote.avgPrice) / totalShares
              return {
                ...item,
                shares: +totalShares.toFixed(4),
                avgPrice: +avgPrice.toFixed(4),
                currentProbability: outcome.probability,
                updatedAt: new Date().toISOString(),
              }
            })
          : [
              {
                id: `rfq-pos-${outcome.id}`,
                outcomeId: outcome.id,
                subjectLabel: outcome.subject.label,
                marketTitle: outcome.marketTitle,
                outcomeLabel: outcome.label,
                shares: quote.shares,
                avgPrice: quote.avgPrice,
                currentProbability: outcome.probability,
                realizedPnl: 0,
                updatedAt: new Date().toISOString(),
              },
              ...state.positions,
            ]
        return { positions, trades: [trade, ...state.trades] }
      })
      useToastStore.getState().addToast({ type: 'success', message: 'RFQ 买入已成交，持仓已更新' })
      return true
    }

    const position = get().positions.find((item) => item.outcomeId === outcome.id)
    if (!position || quote.shares > position.shares) {
      useToastStore.getState().addToast({ type: 'error', message: '可卖份额不足，请调整卖出数量' })
      return false
    }

    wallet.credit(netReturn)
    const realized = +((quote.avgPrice - position.avgPrice) * quote.shares - quote.fee).toFixed(2)
    trade.realizedPnl = realized
    set((state) => {
      const nextPositions = state.positions.flatMap((item) => {
        if (item.outcomeId !== outcome.id) return [item]
        const nextShares = +(item.shares - quote.shares).toFixed(4)
        const residualValue = nextShares * outcome.probability
        if (nextShares <= 0 || residualValue < SOCCER_AMM_DUST_THRESHOLD_USDT) return []
        return [{
          ...item,
          shares: nextShares,
          currentProbability: outcome.probability,
          realizedPnl: +(item.realizedPnl + realized).toFixed(2),
          updatedAt: new Date().toISOString(),
        }]
      })
      return { positions: nextPositions, trades: [trade, ...state.trades] }
    })
    useToastStore.getState().addToast({ type: 'success', message: 'RFQ 卖出已成交，资金已回到可用余额' })
    return true
  },

  getPosition: (outcomeId) => get().positions.find((item) => item.outcomeId === outcomeId),
  getPortfolioValue: () => +get().positions.reduce((sum, item) => sum + item.shares * item.currentProbability, 0).toFixed(2),
  getUnrealizedPnl: () => +get().positions.reduce((sum, item) => sum + item.shares * (item.currentProbability - item.avgPrice), 0).toFixed(2),
}))

attachPersist(useSoccerAmmStore, STORAGE_KEY, (state) => ({
  positions: state.positions,
  trades: state.trades,
  priceFormat: state.priceFormat,
}))
