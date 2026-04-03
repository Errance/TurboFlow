import type { ComboGridMarket as CGData } from '../../data/soccer/types'

interface Props {
  data: CGData
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function ComboGridMarket({ data, onSelect, selectedKey }: Props) {
  const hasMultipleCols = data.colHeaders.length > 1 && data.colHeaders[0] !== ''
  const cols = hasMultipleCols ? data.colHeaders.length : 1

  if (!hasMultipleCols) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {data.cells.filter(c => c.odds > 0).map((cell) => {
          const key = `${data.title}|${cell.label}`
          const isSelected = selectedKey === key
          return (
            <button
              key={cell.label}
              onClick={() => onSelect(data.title, cell.label, cell.odds)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-center transition-all ${
                isSelected
                  ? 'bg-[#2DD4BF]/15 border border-[#2DD4BF]/30'
                  : 'bg-[var(--bg-control)] border border-[var(--border)] hover:border-[var(--text-secondary)]/30'
              }`}
            >
              <span className={`text-[10px] leading-tight ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]'}`}>
                {cell.label}
              </span>
              <span className={`text-xs font-semibold font-mono tabular-nums ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                {cell.odds.toFixed(2)}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="w-24" />
            {data.colHeaders.map((col) => (
              <th key={col} className="text-center text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-2 px-1">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rowHeaders.map((row, ri) => (
            <tr key={row}>
              <td className="py-1 pr-2 text-xs text-[var(--text-secondary)] whitespace-nowrap">{row}</td>
              {Array.from({ length: cols }).map((_, ci) => {
                const idx = ri * cols + ci
                const cell = data.cells[idx]
                if (!cell || cell.odds === 0) return <td key={ci} className="py-1 px-1" />
                const key = `${data.title}|${cell.label}`
                const isSelected = selectedKey === key
                return (
                  <td key={ci} className="py-1 px-1">
                    <button
                      onClick={() => onSelect(data.title, cell.label, cell.odds)}
                      className={`w-full px-2 py-1.5 rounded-lg font-mono font-medium tabular-nums transition-all text-center ${
                        isSelected
                          ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30'
                          : 'bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/30'
                      }`}
                    >
                      {cell.odds.toFixed(2)}
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
