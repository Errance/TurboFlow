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

export type ParlayMode = 'parlay' | 'bundle'

export interface Parlay {
  id: string
  legs: ParlayLeg[]
  stake: number
  /** 'parlay' = all-or-nothing, 'bundle' = each leg settles independently */
  mode: ParlayMode
  combinedOdds: number
  potentialPayout: number
  /** Actual total cost after rounding (may differ from stake) */
  actualCost: number
  /** Residual = stake - actualCost, returned to balance */
  residual: number
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
  placeParlay: (stake: number, mode?: ParlayMode) => Parlay | null
}

function computeCombinedOdds(legs: ParlayLeg[]): number {
  return legs.reduce((acc, leg) => acc / leg.price, 1)
}

const fixtureParlays: Parlay[] = [
  {
    id: 'parlay-fixture-1',
    legs: [
      { contractId: 'ctr-btc-100k-mar', eventId: 'mkt-btc-100k', side: 'YES', price: 0.65, eventTitle: 'Will BTC exceed $100K by March 2026?', contractLabel: 'BTC > $100K' },
      { contractId: 'ctr-eth-5k', eventId: 'mkt-eth-5k', side: 'YES', price: 0.40, eventTitle: 'Will ETH reach $5K by June 2026?', contractLabel: 'ETH > $5K' },
      { contractId: 'ctr-fed-q2', eventId: 'mkt-fed-rates', side: 'YES', price: 0.50, eventTitle: 'Will the Fed cut rates in Q2 2026?', contractLabel: 'Fed Rate Cut Q2' },
    ],
    stake: 150,
    mode: 'parlay',
    combinedOdds: 1 / (0.65 * 0.40 * 0.50),
    potentialPayout: 150 * (1 / (0.65 * 0.40 * 0.50)),
    actualCost: 77 * 0.65 + 125 * 0.40 + 100 * 0.50,
    residual: 150 - (77 * 0.65 + 125 * 0.40 + 100 * 0.50),
    createdAt: '2026-02-20T14:30:00.000Z',
    status: 'placed',
  },
]

export const useParlayStore = create<ParlayState>((set, get) => ({
  slip: [],
  slipOpen: false,
  placedParlays: [...fixtureParlays],

  addLeg: (leg) => {
    const { slip } = get()
    const toast = useToastStore.getState().addToast

    const sameContract = slip.find((l) => l.contractId === leg.contractId)
    if (sameContract && sameContract.side !== leg.side) {
      toast({ type: 'error', message: `Cannot bet both YES and NO on "${leg.contractLabel}"` })
      return
    }
    if (sameContract && sameContract.side === leg.side) {
      toast({ type: 'info', message: `"${leg.contractLabel} ${leg.side}" is already in your parlay` })
      return
    }

    const sameEventLeg = slip.find((l) => l.eventId === leg.eventId && l.contractId !== leg.contractId)
    if (sameEventLeg) {
      toast({
        type: 'info',
        message: `Note: "${leg.contractLabel}" is in the same event as "${sameEventLeg.contractLabel}". These may be correlated.`,
      })
    }

    const newSlip = [...slip, leg]
    set({ slip: newSlip })
    toast({
      type: 'success',
      message: `Added to Parlay: ${leg.contractLabel} ${leg.side} (${newSlip.length} leg${newSlip.length > 1 ? 's' : ''})`,
    })
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

  placeParlay: (stake, mode = 'parlay') => {
    const { slip, placedParlays } = get()
    if (slip.length < 2 || stake <= 0) return null

    const combinedOdds = computeCombinedOdds(slip)
    const potentialPayout = stake * combinedOdds
    const stakePerLeg = stake / slip.length

    let actualCost = 0
    const legDetails = slip.map((leg) => {
      const shares = Math.round(stakePerLeg / leg.price)
      const legCost = Math.round(shares * leg.price * 100) / 100
      actualCost += legCost
      return { leg, shares, legCost }
    })
    actualCost = Math.round(actualCost * 100) / 100
    const residual = Math.round((stake - actualCost) * 100) / 100

    const parlay: Parlay = {
      id: `parlay-${Date.now()}`,
      legs: [...slip],
      stake,
      mode,
      combinedOdds,
      potentialPayout,
      actualCost,
      residual,
      createdAt: new Date().toISOString(),
      status: 'placed',
    }

    legDetails.forEach(({ leg, shares }) => {
      usePortfolioStore.getState().executeTrade({
        contractId: leg.contractId,
        marketTitle: `${leg.eventTitle} — ${leg.contractLabel}`,
        side: leg.side,
        action: 'BUY',
        price: leg.price,
        quantity: shares,
        parlayId: parlay.id,
      })
    })

    const modeLabel = mode === 'parlay' ? 'Parlay' : 'Bundle'
    useToastStore.getState().addToast({
      type: 'success',
      message: `${modeLabel} placed: ${slip.length} legs, $${stake.toFixed(2)} stake, potential payout $${potentialPayout.toFixed(2)}`,
    })

    set({
      placedParlays: [parlay, ...placedParlays],
      slip: [],
      slipOpen: false,
    })

    return parlay
  },
}))
