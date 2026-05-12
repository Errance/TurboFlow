import type { Market } from '../../data/soccer/types'
import {
  enumerateAmmMarketOutcomes,
  formatAmmPrice,
  formatImpliedProbability,
  formatProbability,
  type SoccerAmmSubject,
} from '../../data/soccer/ammData'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'
import MarketCard from './MarketCard'

interface Props {
  market: Market
  displayTitle: string
  subject: SoccerAmmSubject
}

const statusCopy = {
  open: '可交易',
  paused: '暂停交易',
  closed: '已关闭',
  settled: '已结算',
  void: '作废退款',
}

export default function AmmMarketRenderer({ market, displayTitle, subject }: Props) {
  const priceFormat = useSoccerAmmStore((state) => state.priceFormat)
  const selectedOutcome = useSoccerAmmStore((state) => state.selectedOutcome)
  const selectOutcome = useSoccerAmmStore((state) => state.selectOutcome)
  const positions = useSoccerAmmStore((state) => state.positions)
  const outcomes = enumerateAmmMarketOutcomes(market, subject)

  if ((market.status ?? 'open') === 'hidden') return null

  const totalProbability = outcomes.reduce((sum, item) => sum + item.probability, 0)
  const groups = Array.from(new Set(outcomes.map((item) => item.groupLabel ?? '')))

  return (
    <MarketCard title={displayTitle}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-secondary)]">
          <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[#2DD4BF]">AMM 即时成交</span>
          <span>总隐含概率 {formatProbability(totalProbability)}</span>
          <span>主价格按 ¢ / share 展示，可切换欧洲赔率</span>
        </div>

        {groups.length > 1 && groups.some(Boolean) ? (
          <div className="space-y-3">
            {groups.map((group) => {
              const items = outcomes.filter((item) => (item.groupLabel ?? '') === group)
              if (items.length === 0) return null
              return (
                <div key={group || 'default'} className="space-y-2">
                  {group && <p className="text-xs font-medium text-[var(--text-primary)]">{group}</p>}
                  <OutcomeGrid
                    outcomes={items}
                    selectedOutcomeId={selectedOutcome?.id}
                    priceFormat={priceFormat}
                    positions={positions}
                    onSelect={(outcome) => selectOutcome(outcome)}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <OutcomeGrid
            outcomes={outcomes}
            selectedOutcomeId={selectedOutcome?.id}
            priceFormat={priceFormat}
            positions={positions}
            onSelect={(outcome) => selectOutcome(outcome)}
          />
        )}
      </div>
    </MarketCard>
  )
}

function OutcomeGrid({
  outcomes,
  selectedOutcomeId,
  priceFormat,
  positions,
  onSelect,
}: {
  outcomes: ReturnType<typeof enumerateAmmMarketOutcomes>
  selectedOutcomeId?: string
  priceFormat: 'probability' | 'european'
  positions: ReturnType<typeof useSoccerAmmStore.getState>['positions']
  onSelect: (outcome: ReturnType<typeof enumerateAmmMarketOutcomes>[number]) => void
}) {
  const columnClass = outcomes.length > 6 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'

  return (
    <div className={`grid gap-2 ${columnClass}`}>
      {outcomes.map((outcome) => {
        const isSelected = selectedOutcomeId === outcome.id
        const position = positions.find((item) => item.outcomeId === outcome.id)
        const isPaused = outcome.status !== 'open'
        return (
          <button
            key={outcome.id}
            onClick={() => !isPaused && onSelect(outcome)}
            disabled={isPaused}
            className={`min-h-[74px] rounded-lg border px-3 py-2 text-left transition-all ${
              isSelected
                ? 'border-[#2DD4BF]/40 bg-[#2DD4BF]/15'
                : 'border-[var(--border)] bg-[var(--bg-control)] hover:border-[var(--text-secondary)]/30'
            } ${isPaused ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                {outcome.label}
              </span>
              <span className={`text-sm font-semibold font-mono tabular-nums ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                {formatAmmPrice(outcome.probability, priceFormat)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
              <span>{statusCopy[outcome.status]}</span>
              <span>深度 {Math.round(outcome.liquidity).toLocaleString('en-US')}</span>
              {priceFormat === 'probability' && <span>{formatImpliedProbability(outcome.probability)}</span>}
              <span className={outcome.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {outcome.priceChange24h >= 0 ? '+' : ''}{formatProbability(outcome.priceChange24h)}
              </span>
            </div>
            {position && (
              <p className="mt-1 text-[10px] text-[#2DD4BF]">
                已持有 {position.shares.toFixed(2)} 份
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
