import type { ButtonGroupMarket as BGData } from '../../data/soccer/types'
import OddsDisplay from './OddsDisplay'
import { makeSelectionKey } from '../../services/oddsRegistry'

interface Props {
  data: BGData
  matchId?: string
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function ButtonGroupMarket({ data, matchId, onSelect, selectedKey }: Props) {
  return (
    <div className="flex gap-2">
      {data.options.map((opt) => {
        const key = `${data.title}|${opt.label}`
        const isSelected = selectedKey === key
        const selKey = matchId ? makeSelectionKey(matchId, data.title, opt.label) : undefined
        return (
          <button
            key={opt.label}
            onClick={() => onSelect(data.title, opt.label, opt.odds)}
            className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-center transition-all min-h-[52px] justify-center ${
              isSelected
                ? 'bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 text-[#2DD4BF]'
                : 'bg-[var(--bg-control)] border border-[var(--border)] hover:border-[var(--text-secondary)]/30'
            }`}
          >
            <span className={`text-xs leading-tight ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]'}`}>
              {opt.label}
            </span>
            <OddsDisplay
              selectionKey={selKey}
              fallbackOdds={opt.odds}
              className={`text-sm font-semibold font-mono tabular-nums ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
