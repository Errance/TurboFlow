import type { SoccerMatch } from '../../data/soccer/types'
import Badge from '../ui/Badge'

interface Props {
  match: SoccerMatch
}

const timeSlots = ['HT', '(2x45 Min) FT', "15'", "30'", "45'", "60'", "75'", "90'"]

export default function MatchHeader({ match }: Props) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        {match.status === 'live' && (
          <>
            <Badge variant="danger">LIVE</Badge>
            {match.currentMinute && (
              <span className="text-xs font-mono text-red-400 animate-pulse">{match.currentMinute}'</span>
            )}
          </>
        )}
        {match.status === 'scheduled' && <Badge variant="success">即将开赛</Badge>}
        {match.status === 'finished' && <Badge variant="neutral">ENDED</Badge>}
        <span className="text-xs text-[var(--text-secondary)]">{match.league}</span>
        {match.venue && (
          <>
            <span className="text-[var(--text-secondary)]/30">·</span>
            <span className="text-[10px] text-[var(--text-secondary)]">{match.venue}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
              {match.homeTeam.shortName}
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)]">{match.homeTeam.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
              {match.awayTeam.shortName}
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)]">{match.awayTeam.name}</p>
          </div>
        </div>

        <div className="text-right space-y-3">
          {match.score ? (
            <>
              <p className={`text-2xl font-bold font-mono ${match.status === 'finished' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                {match.score.home}
              </p>
              <p className={`text-2xl font-bold font-mono ${match.status === 'finished' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                {match.score.away}
              </p>
            </>
          ) : (
            <div className="text-center">
              <p className="text-xs text-[var(--text-secondary)]">{match.date}</p>
              <p className="text-lg font-semibold font-mono text-[var(--text-primary)]">{match.time}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {timeSlots.map((label) => {
            const isActive = match.status === 'live' && match.currentMinute && (
              (label === 'HT' && match.currentMinute >= 45 && match.currentMinute <= 45) ||
              (label.endsWith("'") && parseInt(label) <= match.currentMinute)
            )
            return (
              <span
                key={label}
                className={`text-[10px] whitespace-nowrap px-2 py-1 rounded transition-colors
                  ${isActive
                    ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] font-medium'
                    : 'text-[var(--text-secondary)] bg-[var(--bg-control)]'
                  }`}
              >
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
