import type { MatchStats } from '../../data/soccer/types'

interface Props {
  stats: MatchStats
  homeShort: string
  awayShort: string
}

const statLabels: [keyof MatchStats, string][] = [
  ['possession', '控球率'],
  ['shots', '射门'],
  ['shotsOnTarget', '射正'],
  ['corners', '角球'],
  ['fouls', '犯规'],
  ['offsides', '越位'],
  ['yellowCards', '黄牌'],
  ['redCards', '红牌'],
]

export default function MatchStatsBar({ stats, homeShort, awayShort }: Props) {
  return (
    <div className="px-3 py-4 space-y-3">
      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
        <span>{homeShort}</span>
        <span>Statistics</span>
        <span>{awayShort}</span>
      </div>

      {statLabels.map(([key, label]) => {
        const [home, away] = stats[key]
        const total = home + away || 1
        const homePct = (home / total) * 100
        const isPercent = key === 'possession'

        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[var(--text-primary)] w-8 text-left">
                {isPercent ? `${home}%` : home}
              </span>
              <span className="text-[var(--text-secondary)] text-[10px]">{label}</span>
              <span className="font-bold text-[var(--text-primary)] w-8 text-right">
                {isPercent ? `${away}%` : away}
              </span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
              <div
                className="bg-[#2DD4BF] rounded-l-full transition-all"
                style={{ width: `${homePct}%` }}
              />
              <div
                className="bg-[var(--text-secondary)]/40 rounded-r-full transition-all"
                style={{ width: `${100 - homePct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
