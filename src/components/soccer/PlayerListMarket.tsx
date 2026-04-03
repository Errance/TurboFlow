import { useState } from 'react'
import type { PlayerListMarket as PLData } from '../../data/soccer/types'

interface Props {
  data: PLData
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function PlayerListMarket({ data, onSelect, selectedKey }: Props) {
  const [showAll, setShowAll] = useState(false)
  const hasTiers = data.tiers.length > 1
  const visiblePlayers = showAll ? data.players : data.players.slice(0, 8)

  return (
    <div>
      {hasTiers && (
        <div className="flex gap-4 mb-2 border-b border-[var(--border)] pb-2">
          <span className="text-[10px] text-[var(--text-secondary)] w-32 shrink-0">球员</span>
          {data.tiers.map((t) => (
            <span key={t} className="text-[10px] text-[var(--text-secondary)] text-center flex-1 font-mono">{t}</span>
          ))}
        </div>
      )}
      <div className="space-y-1">
        {visiblePlayers.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-primary)] w-32 shrink-0 truncate">{p.name}</span>
            <div className={`flex gap-1.5 flex-1 ${hasTiers ? '' : 'justify-end'}`}>
              {p.odds.map((odd, i) => {
                if (odd === 0) return <span key={i} className={hasTiers ? 'flex-1' : 'min-w-[56px]'} />
                const tierLabel = data.tiers[i] || ''
                const selection = tierLabel ? `${p.name} ${tierLabel}` : p.name
                const key = `${data.title}|${selection}`
                const isSelected = selectedKey === key
                return (
                  <button
                    key={i}
                    onClick={() => onSelect(data.title, selection, odd)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono font-medium tabular-nums transition-all text-center ${
                      hasTiers ? 'flex-1' : 'min-w-[56px]'
                    } ${
                      isSelected
                        ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30'
                        : 'bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/30'
                    }`}
                  >
                    {odd.toFixed(2)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {data.players.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-[#2DD4BF] hover:underline"
        >
          {showAll ? '收起' : `显示全部 ${data.players.length} 名球员`}
        </button>
      )}
    </div>
  )
}
