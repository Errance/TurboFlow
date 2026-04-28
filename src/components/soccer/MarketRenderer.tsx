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
  matchId?: string
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
  conflictReason?: string
  conflictWith?: string
  onReplaceConflict?: () => void
  bettingClosed?: boolean
}

const lockIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export default function MarketRenderer({
  market,
  displayTitle,
  matchId,
  onSelect,
  selectedKey,
  conflictReason,
  conflictWith,
  onReplaceConflict,
  bettingClosed,
}: Props) {
  const status = market.status ?? 'open'

  if (status === 'hidden') return null

  let content: React.ReactNode = null

  switch (market.type) {
    case 'buttonGroup':
      content = <ButtonGroupMarket data={market} matchId={matchId} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'oddsTable':
      content = <OddsTableMarket data={market} matchId={matchId} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'scoreGrid':
      content = <ScoreGridMarket data={market} matchId={matchId} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'playerList':
      content = <PlayerListMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'comboGrid':
      content = <ComboGridMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'rangeButtons':
      content = <RangeButtonsMarket data={market} matchId={matchId} onSelect={onSelect} selectedKey={selectedKey} />
      break
  }

  const isLocked = bettingClosed || status === 'suspended' || status === 'void' || status === 'settled' || status === 'upcoming' || status === 'cancelled'

  const overlayLabel = (() => {
    if (bettingClosed) return '比赛已开始，盘口已封盘'
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

        {conflictReason && status === 'open' && (
          <div className="absolute inset-0 bg-[var(--bg-card)]/85 flex items-center justify-center rounded-lg backdrop-blur-[1px] p-3">
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-amber-300">
                与投注单中「{conflictWith}」冲突
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">{conflictReason}</p>
              {onReplaceConflict && (
                <button
                  onClick={onReplaceConflict}
                  className="text-[10px] px-2 py-1 rounded bg-[#2DD4BF]/15 text-[#2DD4BF] hover:bg-[#2DD4BF]/25 transition-colors"
                >
                  移除冲突项后选择
                </button>
              )}
            </div>
          </div>
        )}

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
              {market.settlementResult === 'win' && `结算结果：${market.winningSelection}`}
              {market.settlementResult === 'void' && '作废退款'}
              {market.settlementResult === 'push' && '走盘退款'}
              {!market.settlementResult && '已结算'}
            </span>
          </div>
        )}

      </div>
    </MarketCard>
  )
}
