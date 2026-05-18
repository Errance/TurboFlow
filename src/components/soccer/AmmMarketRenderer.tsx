import type { Market } from '../../data/soccer/types'
import { isBinaryFutureMarket } from '../../data/soccer/types'
import {
  enumerateAmmMarketOutcomes,
  formatAmmPrice,
  formatProbability,
  formatSharePrice,
  type SoccerAmmOutcome,
  type SoccerAmmSubject,
} from '../../data/soccer/ammData'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'
import MarketCard from './MarketCard'

interface Props {
  market: Market
  displayTitle: string
  subject: SoccerAmmSubject
}

export default function AmmMarketRenderer({ market, displayTitle, subject }: Props) {
  const priceFormat = useSoccerAmmStore((state) => state.priceFormat)
  const selectedOutcome = useSoccerAmmStore((state) => state.selectedOutcome)
  const selectOutcome = useSoccerAmmStore((state) => state.selectOutcome)
  const positions = useSoccerAmmStore((state) => state.positions)
  const outcomes = enumerateAmmMarketOutcomes(market, subject)

  if ((market.status ?? 'open') === 'hidden') return null

  // v7.1：只要 outcome 已带 candidate/side，就必须走「候选 + 是/否双列」布局。
  // 这里同时看 market 原始 option 和枚举后的 outcome，避免系列赛路径市场回落成「法国 是」/「法国 否」两张旧卡片。
  const hasBinaryOutcomes = outcomes.some((outcome) => outcome.candidate && outcome.binarySide)
  const isBinaryFuture = market.type === 'buttonGroup' && (isBinaryFutureMarket(market) || hasBinaryOutcomes)
  const yesProbabilityTotal = outcomes
    .filter((outcome) => outcome.binarySide === 'yes')
    .reduce((sum, outcome) => sum + outcome.probability, 0)
  const seriesProbability = market.type === 'buttonGroup' ? market.seriesProbability : undefined
  const targetSlots = seriesProbability?.targetSlots
  const modelLabel = seriesProbability?.model === 'single-result' ? '唯一结果型' : seriesProbability?.model === 'multi-slot' ? '多名额型' : undefined
  const coverageTone = seriesProbability?.coverage === 'featured' ? '当前展示候选' : '全量候选'

  if (isBinaryFuture) {
    return (
      <MarketCard title={displayTitle}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-secondary)]">
            <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[#E85A7E]">系列赛 · 二元子市场</span>
            <span>每个候选独立结算；是 + 否在结算上严格互补</span>
            <span>
              已展示 YES 合计 {formatProbability(yesProbabilityTotal)}
              {targetSlots ? ` / 目标 ${formatProbability(targetSlots)}` : ''}
            </span>
            {modelLabel && <span>{modelLabel}</span>}
            {seriesProbability && <span>{coverageTone}：{seriesProbability.coverageLabel}</span>}
            <span>「否」侧标注「参考价」时，成交以交易面板最新报价为准</span>
          </div>
          <BinaryCandidateGrid
            outcomes={outcomes}
            selectedOutcomeId={selectedOutcome?.id}
            priceFormat={priceFormat}
            positions={positions}
            onSelect={(outcome) => selectOutcome(outcome)}
          />
        </div>
      </MarketCard>
    )
  }

  const totalProbability = outcomes.reduce((sum, item) => sum + item.probability, 0)
  const groups = Array.from(new Set(outcomes.map((item) => item.groupLabel ?? '')))

  return (
    <MarketCard title={displayTitle}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-secondary)]">
          <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[#2DD4BF]">即时报价</span>
          <span>总隐含概率 {formatProbability(totalProbability)}</span>
          <span>默认展示概率 + 份额价格，可切换欧洲赔率；成交以交易面板最新报价为准</span>
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

function BinaryCandidateGrid({
  outcomes,
  selectedOutcomeId,
  priceFormat,
  positions,
  onSelect,
}: {
  outcomes: SoccerAmmOutcome[]
  selectedOutcomeId?: string
  priceFormat: 'probability' | 'european'
  positions: ReturnType<typeof useSoccerAmmStore.getState>['positions']
  onSelect: (outcome: SoccerAmmOutcome) => void
}) {
  // 按 candidate 分组，组内 YES / NO 分别取一条
  const order: string[] = []
  const map = new Map<string, { yes?: SoccerAmmOutcome; no?: SoccerAmmOutcome; label: string }>()
  outcomes.forEach((outcome) => {
    if (!outcome.candidate || !outcome.binarySide) return
    if (!map.has(outcome.candidate)) {
      order.push(outcome.candidate)
      map.set(outcome.candidate, { label: outcome.label.replace(/\s*(是|否)\s*$/, '').trim() })
    }
    const entry = map.get(outcome.candidate)
    if (!entry) return
    if (outcome.binarySide === 'yes') entry.yes = outcome
    if (outcome.binarySide === 'no') entry.no = outcome
  })

  return (
    <div className="space-y-1.5">
      {order.map((candidate) => {
        const entry = map.get(candidate)!
        const yesPos = positions.find((item) => item.outcomeId === entry.yes?.id)
        const noPos = positions.find((item) => item.outcomeId === entry.no?.id)
        return (
          <div key={candidate} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{entry.label}</p>
              <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
                {(yesPos || noPos) ? (
                  <span>
                    {yesPos && <>已持 是 {yesPos.shares.toFixed(0)} 份</>}
                    {yesPos && noPos && ' · '}
                    {noPos && <>已持 否 {noPos.shares.toFixed(0)} 份</>}
                  </span>
                ) : (
                  <span>买入「是」押该候选成立；买入「否」押该候选不成立</span>
                )}
              </p>
            </div>
            <BinarySideButton
              outcome={entry.yes}
              side="yes"
              priceFormat={priceFormat}
              selected={selectedOutcomeId === entry.yes?.id}
              onSelect={onSelect}
            />
            <BinarySideButton
              outcome={entry.no}
              side="no"
              priceFormat={priceFormat}
              selected={selectedOutcomeId === entry.no?.id}
              onSelect={onSelect}
            />
          </div>
        )
      })}
    </div>
  )
}

function BinarySideButton({
  outcome,
  side,
  priceFormat,
  selected,
  onSelect,
}: {
  outcome?: SoccerAmmOutcome
  side: 'yes' | 'no'
  priceFormat: 'probability' | 'european'
  selected: boolean
  onSelect: (outcome: SoccerAmmOutcome) => void
}) {
  if (!outcome) {
    return (
      <div className="min-w-[78px] rounded-md border border-[var(--border)] bg-[var(--bg-card)]/40 px-3 py-1.5 text-center text-[10px] text-[var(--text-secondary)]">
        {side === 'yes' ? '是 · 暂无' : '否 · 暂无'}
      </div>
    )
  }
  const isPaused = outcome.status !== 'open'
  const sideLabel = side === 'yes' ? '是' : '否'
  const sideTone = side === 'yes' ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'
  return (
    <button
      onClick={() => !isPaused && onSelect(outcome)}
      disabled={isPaused}
      className={`min-w-[78px] rounded-md border px-3 py-1.5 text-center transition-all ${
        selected
          ? 'border-[#2DD4BF]/60 bg-[#2DD4BF]/20'
          : `border-[var(--border)] ${sideTone} hover:border-[var(--text-secondary)]/40`
      } ${isPaused ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <p className={`text-[10px] font-semibold ${selected ? 'text-[#2DD4BF]' : ''}`}>
        {sideLabel}
        {outcome.isReferencePrice && (
          <span className="ml-1 rounded-sm bg-amber-500/15 px-1 text-amber-300">参考价</span>
        )}
      </p>
      <p className={`mt-0.5 text-sm font-mono tabular-nums ${selected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
        {priceFormat === 'probability' ? formatSharePrice(outcome.probability) : formatAmmPrice(outcome.probability, priceFormat)}
      </p>
    </button>
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
                {priceFormat === 'probability' ? formatProbability(outcome.probability) : formatAmmPrice(outcome.probability, priceFormat)}
              </span>
            </div>
            {priceFormat === 'probability' && (
              <div className="mt-1 rounded-md bg-[#2DD4BF]/10 px-2 py-1 text-center text-[10px] font-semibold text-[#2DD4BF]">
                Buy {outcome.binarySide === 'no' ? 'No' : 'Yes'} {formatSharePrice(outcome.probability)}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
              <span>24h Vol. ${(outcome.volume24h / 1000).toFixed(1)}k</span>
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
