import { create } from 'zustand'
import { usePortfolioStore } from './portfolioStore'
import { useToastStore } from './toastStore'

export interface ParlayLeg {
  contractId: string
  eventId: string
  side: 'YES' | 'NO'
  price: number
  eventTitle: string
  contractLabel: string
}

export interface Parlay {
  id: string
  legs: ParlayLeg[]
  stake: number
  combinedOdds: number
  potentialPayout: number
  createdAt: string
  status: 'pending' | 'placed' | 'settled'
}

interface ParlayState {
  slip: ParlayLeg[]
  slipOpen: boolean
  placedParlays: Parlay[]

  addLeg: (leg: ParlayLeg) => void
  removeLeg: (contractId: string) => void
  clearSlip: () => void
  hasLeg: (contractId: string) => boolean
  toggleSlip: () => void
  openSlip: () => void
  closeSlip: () => void
  placeParlay: (stake: number) => Parlay | null
}

function computeCombinedOdds(legs: ParlayLeg[]): number {
  return legs.reduce((acc, leg) => acc / leg.price, 1)
}

export const useParlayStore = create<ParlayState>((set, get) => ({
  slip: [],
  slipOpen: false,
  placedParlays: [],

  addLeg: (leg) => {
    const existing = get().slip.find((l) => l.contractId === leg.contractId)
    if (existing) {
      set({
        slip: get().slip.map((l) =>
          l.contractId === leg.contractId ? leg : l,
        ),
      })
      useToastStore.getState().addToast({
        type: 'success',
        message: `Updated: ${leg.contractLabel} → ${leg.side}`,
      })
    } else {
      const newSlip = [...get().slip, leg]
      set({ slip: newSlip })
      useToastStore.getState().addToast({
        type: 'success',
        message: `Added to Parlay: ${leg.contractLabel} ${leg.side} (${newSlip.length} leg${newSlip.length > 1 ? 's' : ''})`,
      })
    }
  },

  removeLeg: (contractId) => {
    const newSlip = get().slip.filter((l) => l.contractId !== contractId)
    set({ slip: newSlip })
    if (newSlip.length === 0) set({ slipOpen: false })
  },

  clearSlip: () => set({ slip: [], slipOpen: false }),

  hasLeg: (contractId) => get().slip.some((l) => l.contractId === contractId),

  toggleSlip: () => set({ slipOpen: !get().slipOpen }),
  openSlip: () => set({ slipOpen: true }),
  closeSlip: () => set({ slipOpen: false }),

  placeParlay: (stake) => {
    const { slip, placedParlays } = get()
    if (slip.length < 2 || stake <= 0) return null

    const combinedOdds = computeCombinedOdds(slip)
    const potentialPayout = stake * combinedOdds

    const parlay: Parlay = {
      id: `parlay-${Date.now()}`,
      legs: [...slip],
      stake,
      combinedOdds,
      potentialPayout,
      createdAt: new Date().toISOString(),
      status: 'placed',
    }

    const sharesPerLeg = Math.round(stake / slip.length / slip[0].price)

    slip.forEach((leg) => {
      usePortfolioStore.getState().executeTrade({
        contractId: leg.contractId,
        marketTitle: `${leg.eventTitle} — ${leg.contractLabel}`,
        side: leg.side,
        price: leg.price,
        quantity: sharesPerLeg,
      })
    })

    useToastStore.getState().addToast({
      type: 'success',
      message: `Parlay placed: ${slip.length} legs, $${stake.toFixed(2)} stake, potential payout $${potentialPayout.toFixed(2)}`,
    })

    set({
      placedParlays: [parlay, ...placedParlays],
      slip: [],
      slipOpen: false,
    })

    return parlay
  },
}))
