import type { ClobMarket, TradingSelection } from '../../data/clob/types'
import BinaryMarketCard from './BinaryMarketCard'
import NegRiskEventCard from './NegRiskEventCard'

interface Props {
  market: ClobMarket
  selection: TradingSelection | null
  onSelect: (sel: TradingSelection) => void
}

export default function ClobMarketRenderer({ market, selection, onSelect }: Props) {
  if (market.status === 'settled' || market.status === 'voided') {
    return (
      <div className="opacity-50 pointer-events-none">
        {market.type === 'binary'
          ? <BinaryMarketCard market={market} selection={selection} onSelect={onSelect} />
          : <NegRiskEventCard event={market} selection={selection} onSelect={onSelect} />
        }
        <div className="mt-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] text-amber-400 font-medium">
            {market.status === 'voided' ? '已作废' : '已结算'}
          </span>
        </div>
      </div>
    )
  }

  if (market.status === 'suspended') {
    return (
      <div className="relative">
        {market.type === 'binary'
          ? <BinaryMarketCard market={market} selection={selection} onSelect={onSelect} />
          : <NegRiskEventCard event={market} selection={selection} onSelect={onSelect} />
        }
        <div className="absolute inset-0 bg-[var(--bg-card)]/70 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <span className="text-sm font-medium text-[var(--text-secondary)]">暂停中</span>
        </div>
      </div>
    )
  }

  if (market.type === 'binary') {
    return <BinaryMarketCard market={market} selection={selection} onSelect={onSelect} />
  }

  return <NegRiskEventCard event={market} selection={selection} onSelect={onSelect} />
}
