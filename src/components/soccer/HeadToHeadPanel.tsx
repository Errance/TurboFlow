import type { HeadToHead } from '../../data/soccer/types'

interface Props {
  h2h: HeadToHead
  homeShort: string
  awayShort: string
}

export default function HeadToHeadPanel({ h2h, homeShort, awayShort }: Props) {
  const total = h2h.homeWins + h2h.draws + h2h.awayWins

  return (
    <div className="px-3 py-4 space-y-5">
      {/* Previous meetings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">历史交锋</h4>
          <span className="text-[10px] text-[var(--text-secondary)]">
            {Math.ceil((h2h.homeWins + h2h.draws + h2h.awayWins) / 3)}/{Math.ceil(total / 3)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-3xl font-bold text-emerald-400">{h2h.homeWins}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase">胜</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-3xl font-bold text-[var(--text-secondary)]">{h2h.draws}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase">平</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-3xl font-bold text-emerald-400">{h2h.awayWins}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase">胜</p>
          </div>
        </div>
        {/* Team labels */}
        <div className="flex items-center justify-between mt-1 px-2">
          <span className="text-[10px] text-[var(--text-secondary)]">{homeShort}</span>
          <span className="text-[10px] text-[var(--text-secondary)]">{awayShort}</span>
        </div>
      </div>

      {/* Average Goals */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">场均进球</h4>

        {/* Scored */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-emerald-400">{h2h.avgGoals.homeScored}</span>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase">进球</span>
            <span className="text-sm font-bold text-emerald-400">{h2h.avgGoals.awayScored}</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-control)]">
            <div
              className="bg-emerald-500 rounded-l-full"
              style={{ width: `${(h2h.avgGoals.homeScored / (h2h.avgGoals.homeScored + h2h.avgGoals.awayScored)) * 100}%` }}
            />
            <div
              className="bg-emerald-700 rounded-r-full"
              style={{ width: `${(h2h.avgGoals.awayScored / (h2h.avgGoals.homeScored + h2h.avgGoals.awayScored)) * 100}%` }}
            />
          </div>
        </div>

        {/* Conceded */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-red-400">{h2h.avgGoals.homeConceded}</span>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase">失球</span>
            <span className="text-sm font-bold text-red-400">{h2h.avgGoals.awayConceded}</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-control)]">
            <div
              className="bg-red-500 rounded-l-full"
              style={{ width: `${(h2h.avgGoals.homeConceded / (h2h.avgGoals.homeConceded + h2h.avgGoals.awayConceded)) * 100}%` }}
            />
            <div
              className="bg-red-700 rounded-r-full"
              style={{ width: `${(h2h.avgGoals.awayConceded / (h2h.avgGoals.homeConceded + h2h.avgGoals.awayConceded)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent matches list */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">近期赛果</h4>
        <div className="space-y-1.5">
          {h2h.matches.slice(0, 5).map((m, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[var(--bg-control)]/50 text-xs">
              <div className="shrink-0 w-20">
                <div className="text-[var(--text-secondary)]">{m.date.slice(0, 10)}</div>
                {m.competition && (
                  <div className="text-[9px] text-[var(--text-secondary)]/50 truncate">{m.competition}</div>
                )}
              </div>
              <span className="text-[var(--text-primary)] flex-1 text-center truncate">
                {m.homeTeam} <span className="font-bold font-mono">{m.score.home} - {m.score.away}</span> {m.awayTeam}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
