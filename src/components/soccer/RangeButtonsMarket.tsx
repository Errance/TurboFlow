import type { RangeButtonsMarket as RBData } from '../../data/soccer/types'
import OddsDisplay from './OddsDisplay'
import { makeSelectionKey } from '../../services/oddsRegistry'

interface Props {
  data: RBData
  matchId?: string
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function RangeButtonsMarket({ data, matchId, onSelect, selectedKey }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {data.options.map((opt) => {
        const key = `${data.title}|${opt.label}`
        const isSelected = selectedKey === key
        const selKey = matchId ? makeSelectionKey(matchId, data.title, opt.label) : undefined
        return (
          <button
            key={opt.label}
            onClick={() => onSelect(data.title, opt.label, opt.odds)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-center transition-all min-w-[60px] ${
              isSelected
                ? 'bg-[#2DD4BF]/15 border border-[#2DD4BF]/30'
                : 'bg-[var(--bg-control)] border border-[var(--border)] hover:border-[var(--text-secondary)]/30'
            }`}
          >
            <span className={`text-xs font-medium ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]'}`}>
              {opt.label}
            </span>
            <OddsDisplay
              selectionKey={selKey}
              fallbackOdds={opt.odds}
              className={`text-xs font-semibold font-mono tabular-nums ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
