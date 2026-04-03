import type { OddsTableMarket as OTData } from '../../data/soccer/types'

interface Props {
  data: OTData
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function OddsTableMarket({ data, onSelect, selectedKey }: Props) {
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
                      {odd.toFixed(2)}
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
