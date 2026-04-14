import type { NegRiskEvent, TradingSelection } from '../../data/clob/types'
import MarketCard from '../soccer/MarketCard'
import OrderBookMini from './OrderBookMini'

interface Props {
  event: NegRiskEvent
  selection: TradingSelection | null
  onSelect: (sel: TradingSelection) => void
}

function OddsTooltip({ price }: { price: number }) {
  const odds = price > 0 ? (100 / price).toFixed(2) : '—'
  return (
    <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[9px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
      赔率 {odds}
    </span>
  )
}

export default function NegRiskEventCard({ event, selection, onSelect }: Props) {
  const handleClick = (outcomeId: string, side: 'yes' | 'no') => {
    const outcome = event.outcomes.find(o => o.id === outcomeId)
    if (!outcome) return
    onSelect({
      marketId: event.id,
      outcomeId,
      question: event.title,
      outcomeLabel: outcome.label,
      side,
      currentYesPrice: outcome.yesPrice,
      currentNoPrice: outcome.noPrice,
    })
  }

  const selectedOutcome = event.outcomes.find(o => o.id === selection?.outcomeId)

  const isGrid = event.outcomes.length <= 4
  const isScoreGrid = event.outcomes.length > 10

  if (isGrid) {
    return (
      <MarketCard title={event.groupTitle}>
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {event.outcomes.map(o => {
              const isSelected = selection?.outcomeId === o.id
              return (
                <button
                  key={o.id}
                  onClick={() => handleClick(o.id, 'yes')}
                  className={`group relative flex-1 min-w-[80px] flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#2DD4BF]/15 border border-[#2DD4BF]/30'
                      : 'bg-[var(--bg-control)] border border-[var(--border)] hover:border-[var(--text-secondary)]/30'
                  }`}
                >
                  <span className={`text-[10px] ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]'}`}>
                    {o.label}
                  </span>
                  <span className={`text-sm font-semibold font-mono ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                    {o.yesPrice}¢
                  </span>
                  <OddsTooltip price={o.yesPrice} />
                </button>
              )
            })}
          </div>
          {selectedOutcome && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {selectedOutcome.label} · 订单簿
              </p>
              <OrderBookMini book={selectedOutcome.orderBook} depth={5} />
            </div>
          )}
        </div>
      </MarketCard>
    )
  }

  if (isScoreGrid) {
    return (
      <MarketCard title={event.groupTitle}>
        <div className="space-y-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
            {event.outcomes.map(o => {
              const isSelected = selection?.outcomeId === o.id
              return (
                <button
                  key={o.id}
                  onClick={() => handleClick(o.id, 'yes')}
                  className={`group relative flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all text-center ${
                    isSelected
                      ? 'bg-[#2DD4BF]/15 border border-[#2DD4BF]/30'
                      : 'bg-[var(--bg-control)] border border-[var(--border)] hover:border-[var(--text-secondary)]/30'
                  }`}
                >
                  <span className={`text-[10px] ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]'}`}>
                    {o.label}
                  </span>
                  <span className={`text-xs font-semibold font-mono ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                    {o.yesPrice}¢
                  </span>
                  <OddsTooltip price={o.yesPrice} />
                </button>
              )
            })}
          </div>
          {selectedOutcome && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {selectedOutcome.label} · 订单簿
              </p>
              <OrderBookMini book={selectedOutcome.orderBook} depth={5} />
            </div>
          )}
        </div>
      </MarketCard>
    )
  }

  return (
    <MarketCard title={event.groupTitle}>
      <div className="space-y-1">
        {event.outcomes.map(o => {
          const isSelected = selection?.outcomeId === o.id
          return (
            <div key={o.id}>
              <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                  isSelected ? 'bg-[#2DD4BF]/10' : 'hover:bg-[var(--bg-control)]'
                }`}
              >
                <span className={`flex-1 text-xs truncate ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                  {o.label}
                </span>
                <button
                  onClick={() => handleClick(o.id, 'yes')}
                  className={`group relative w-14 text-center px-1.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                    isSelected && selection.side === 'yes'
                      ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30'
                      : 'bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[#2DD4BF]/30'
                  }`}
                >
                  {o.yesPrice}¢
                  <OddsTooltip price={o.yesPrice} />
                </button>
                <button
                  onClick={() => handleClick(o.id, 'no')}
                  className={`group relative w-14 text-center px-1.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                    isSelected && selection.side === 'no'
                      ? 'bg-[#E85A7E]/20 text-[#E85A7E] border border-[#E85A7E]/30'
                      : 'bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[#E85A7E]/30'
                  }`}
                >
                  {o.noPrice}¢
                  <OddsTooltip price={o.noPrice} />
                </button>
                <div className="w-16 hidden sm:block">
                  <OrderBookMini book={o.orderBook} compact />
                </div>
              </div>
              {isSelected && (
                <div className="px-2 pt-2 pb-1 border-t border-[var(--border)] mt-1">
                  <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    {o.label} · 订单簿
                  </p>
                  <OrderBookMini book={o.orderBook} depth={5} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </MarketCard>
  )
}
