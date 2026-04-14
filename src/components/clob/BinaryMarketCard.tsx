import type { BinaryMarket, TradingSelection } from '../../data/clob/types'
import MarketCard from '../soccer/MarketCard'
import PriceButton from './PriceButton'
import OrderBookMini from './OrderBookMini'

interface Props {
  market: BinaryMarket
  selection: TradingSelection | null
  onSelect: (sel: TradingSelection) => void
}

export default function BinaryMarketCard({ market, selection, onSelect }: Props) {
  const isYesSelected = selection?.marketId === market.id && selection.side === 'yes'
  const isNoSelected = selection?.marketId === market.id && selection.side === 'no'
  const isSelected = isYesSelected || isNoSelected

  const handleClick = (side: 'yes' | 'no') => {
    onSelect({
      marketId: market.id,
      question: market.question,
      side,
      currentYesPrice: market.yesPrice,
      currentNoPrice: market.noPrice,
    })
  }

  return (
    <MarketCard title={market.groupTitle}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <PriceButton
            price={market.yesPrice}
            label="Yes"
            variant="yes"
            selected={isYesSelected}
            onClick={() => handleClick('yes')}
          />
          <PriceButton
            price={market.noPrice}
            label="No"
            variant="no"
            selected={isNoSelected}
            onClick={() => handleClick('no')}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-[var(--text-secondary)]">
          <span>{market.question}</span>
          <span className="font-mono">${(market.volume / 1000).toFixed(0)}k vol</span>
        </div>
        <OrderBookMini book={market.orderBook} compact />
        {isSelected && (
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">订单簿</p>
            <OrderBookMini book={market.orderBook} depth={5} />
          </div>
        )}
      </div>
    </MarketCard>
  )
}
