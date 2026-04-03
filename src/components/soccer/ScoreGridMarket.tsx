import type { ScoreGridMarket as SGData } from '../../data/soccer/types'

interface Props {
  data: SGData
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function ScoreGridMarket({ data, onSelect, selectedKey }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="w-10" />
            {data.awayRange.map((a) => (
              <th key={a} className="text-center py-1 px-1 text-[var(--text-secondary)] font-mono font-medium">
                {a}
              </th>
            ))}
          </tr>
          <tr>
            <td />
            <td colSpan={data.awayRange.length} className="text-center text-[10px] text-[var(--text-secondary)] pb-1">
              客队进球
            </td>
          </tr>
        </thead>
        <tbody>
          {data.homeRange.map((h) => (
            <tr key={h}>
              <td className="text-center py-1 px-1 text-[var(--text-secondary)] font-mono font-medium">
                {h}
              </td>
              {data.awayRange.map((a) => {
                const scoreKey = `${h}:${a}`
                const odd = data.odds[scoreKey]
                if (!odd) return <td key={a} className="py-1 px-1"><div className="w-full h-8 rounded bg-[var(--bg-control)]/50" /></td>
                const selKey = `${data.title}|${scoreKey}`
                const isSelected = selectedKey === selKey
                return (
                  <td key={a} className="py-1 px-1">
                    <button
                      onClick={() => onSelect(data.title, scoreKey, odd)}
                      className={`w-full h-8 rounded-lg font-mono font-medium tabular-nums transition-all text-center ${
                        isSelected
                          ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30'
                          : 'bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/30'
                      }`}
                    >
                      {odd.toFixed(odd >= 100 ? 0 : 2)}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr>
            <td className="text-center text-[10px] text-[var(--text-secondary)] pt-1 align-top" style={{ writingMode: 'vertical-rl' }}>
              主队进球
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
