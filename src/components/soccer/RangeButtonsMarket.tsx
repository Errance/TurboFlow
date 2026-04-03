import type { RangeButtonsMarket as RBData } from '../../data/soccer/types'

interface Props {
  data: RBData
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function RangeButtonsMarket({ data, onSelect, selectedKey }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {data.options.map((opt) => {
        const key = `${data.title}|${opt.label}`
        const isSelected = selectedKey === key
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
            <span className={`text-xs font-semibold font-mono tabular-nums ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
              {opt.odds.toFixed(2)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
