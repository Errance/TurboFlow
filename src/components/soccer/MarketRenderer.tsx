import type { Market } from '../../data/soccer/types'
import MarketCard from './MarketCard'
import ButtonGroupMarket from './ButtonGroupMarket'
import OddsTableMarket from './OddsTableMarket'
import ScoreGridMarket from './ScoreGridMarket'
import PlayerListMarket from './PlayerListMarket'
import ComboGridMarket from './ComboGridMarket'
import RangeButtonsMarket from './RangeButtonsMarket'

interface Props {
  market: Market
  displayTitle: string
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

const lockIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export default function MarketRenderer({ market, displayTitle, onSelect, selectedKey }: Props) {
  const status = market.status ?? 'open'

  if (status === 'hidden') return null

  let content: React.ReactNode = null

  switch (market.type) {
    case 'buttonGroup':
      content = <ButtonGroupMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'oddsTable':
      content = <OddsTableMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'scoreGrid':
      content = <ScoreGridMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'playerList':
      content = <PlayerListMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'comboGrid':
      content = <ComboGridMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'rangeButtons':
      content = <RangeButtonsMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
  }

  const isLocked = status === 'suspended' || status === 'void' || status === 'settled' || status === 'upcoming' || status === 'cancelled'

  const overlayLabel = (() => {
    switch (status) {
      case 'suspended': return '暂停'
      case 'void': return '作废'
      case 'upcoming': return '即将开放'
      case 'cancelled': return '已取消'
      default: return null
    }
  })()

  return (
    <MarketCard title={displayTitle}>
      <div className="relative">
        {content}

        {isLocked && status !== 'settled' && (
          <div className="absolute inset-0 bg-[var(--bg-card)]/70 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
              {lockIcon}
              {overlayLabel}
            </span>
          </div>
        )}

        {status === 'settled' && (
          <div className="absolute inset-0 bg-[var(--bg-card)]/50 rounded-lg pointer-events-none" />
        )}

        {status === 'settled' && (
          <div className="mt-2 px-2 py-1.5 rounded-lg border" style={{
            background: market.settlementResult === 'loss'
              ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            borderColor: market.settlementResult === 'loss'
              ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
          }}>
            <span className={`text-xs font-medium ${
              market.settlementResult === 'loss' ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {market.settlementResult === 'loss' && '未命中'}
              {market.settlementResult === 'win' && `结算: ${market.winningSelection}`}
              {market.settlementResult === 'void' && '作废退款'}
              {market.settlementResult === 'push' && '退款 (Push)'}
              {!market.settlementResult && '已结算'}
            </span>
          </div>
        )}

        {status === 'corrected' && market.winningSelection && (
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs text-amber-400 font-medium">
              结果已修正: {market.winningSelection}
            </span>
          </div>
        )}
      </div>
    </MarketCard>
  )
}
