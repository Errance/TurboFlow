import { getContractById } from '../data/events'
import type { StrategyLeg } from '../types'

export interface StrategyLegMetric {
  legId: string
  contractId: string
  side: 'YES' | 'NO'
  weight: number
  entryPrice: number
  markPrice: number
  settledPrice?: number
  label: string
  eventTitle: string
  status: string
}

export interface StrategyValuation {
  metrics: StrategyLegMetric[]
  notional: number
  entryCost: number
  markValue: number
  pnl: number
  pnlPercent: number
  settledValue?: number
}

function sidePrice(yesPrice: number, noPrice: number, side: 'YES' | 'NO'): number {
  return side === 'YES' ? yesPrice : noPrice
}

function sideSettlementPrice(
  side: 'YES' | 'NO',
  settlementResult?: 'YES' | 'NO',
): number | undefined {
  if (!settlementResult) return undefined
  if (side === settlementResult) return 1
  return 0
}

export function evaluateStrategy(
  legs: StrategyLeg[],
  notional: number,
): StrategyValuation {
  const metrics: StrategyLegMetric[] = legs.map((leg) => {
    const found = getContractById(leg.contractId)
    const contract = found?.contract
    const event = found?.event
    const fallback = 0.5
    const markPrice = contract
      ? sidePrice(contract.yesPrice, contract.noPrice, leg.side)
      : fallback
    const entryPrice = leg.entryPrice ?? markPrice
    const settledPrice = contract
      ? sideSettlementPrice(leg.side, contract.settlementResult)
      : undefined
    return {
      legId: leg.id,
      contractId: leg.contractId,
      side: leg.side,
      weight: leg.weight,
      entryPrice,
      markPrice,
      settledPrice,
      label: contract?.label ?? leg.contractId,
      eventTitle: event?.title ?? 'Unknown Event',
      status: contract?.status ?? 'OPEN',
    }
  })

  const entryCost =
    notional * metrics.reduce((sum, leg) => sum + leg.weight * leg.entryPrice, 0)
  const markValue =
    notional * metrics.reduce((sum, leg) => sum + leg.weight * leg.markPrice, 0)
  const pnl = markValue - entryCost
  const pnlPercent = entryCost > 0 ? (pnl / entryCost) * 100 : 0

  const allSettled = metrics.every((leg) => typeof leg.settledPrice === 'number')
  const settledValue = allSettled
    ? notional * metrics.reduce((sum, leg) => sum + leg.weight * (leg.settledPrice ?? 0), 0)
    : undefined

  return {
    metrics,
    notional,
    entryCost,
    markValue,
    pnl,
    pnlPercent,
    settledValue,
  }
}
