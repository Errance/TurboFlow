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
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-2 pr-2 w-24">
              线值
            </th>
            {data.columns.map((col) => (
              <th key={col} className="text-center text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-2 px-1">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.line}>
              <td className="py-1 pr-2 text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">
                {row.line}
              </td>
              {row.odds.map((odd, i) => {
                const selection = `${data.columns[i]} ${row.line}`
                const key = `${data.title}|${selection}`
                const isSelected = selectedKey === key
                const selKey = matchId ? makeSelectionKey(matchId, data.title, selection) : undefined
                return (
                  <td key={i} className="py-1 px-1">
                    <button
                      onClick={() => onSelect(data.title, selection, odd)}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-mono font-medium tabular-nums transition-all text-center ${
                        isSelected
                          ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30'
                          : 'bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/30'
                      }`}
                    >
                      <OddsDisplay selectionKey={selKey} fallbackOdds={odd} />
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
