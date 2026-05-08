import type { OddsTableMarket as OTData } from '../../data/soccer/types'
import OddsDisplay from './OddsDisplay'
import { makeSelectionKey } from '../../services/oddsRegistry'

interface Props {
  data: OTData
  matchId?: string
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function OddsTableMarket({ data, matchId, onSelect, selectedKey }: Props) {
  const columnCount = Math.max(1, data.columns.length)

  return (
    <div className="space-y-2">
      {data.rows.map((row) => (
        <div
          key={row.line}
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {row.odds.map((odd, i) => {
            const label = data.columns[i] ?? ''
            const selection = `${label} ${row.line}`.trim()
            const key = `${data.title}|${selection}`
            const isSelected = selectedKey === key
            const selKey = matchId ? makeSelectionKey(matchId, data.title, selection) : undefined
            return (
              <button
                key={`${row.line}-${label}`}
                onClick={() => onSelect(data.title, selection, odd)}
                className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-all ${
                  isSelected
                    ? 'border-[#2DD4BF]/30 bg-[#2DD4BF]/15'
                    : 'border-[var(--border)] bg-[var(--bg-control)] hover:border-[var(--text-secondary)]/30'
                }`}
              >
                <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                  {selection}
                </span>
                <OddsDisplay
                  selectionKey={selKey}
                  fallbackOdds={odd}
                  className={`mt-0.5 text-sm font-semibold font-mono tabular-nums ${isSelected ? 'text-[#2DD4BF]' : 'text-red-500'}`}
                />
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
