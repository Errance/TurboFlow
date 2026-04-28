import type { SoccerMatch } from '../../data/soccer/types'
import Badge from '../ui/Badge'

interface Props {
  match: SoccerMatch
}

const timeSlots = ["15'", "30'", 'HT', "45'", "60'", "75'", 'FT', "90'"]

function getSlotMinute(label: string): number {
  if (label === 'HT') return 45
  if (label === 'FT') return 90
  return parseInt(label)
}

export default function MatchHeader({ match }: Props) {
  const visibleScore =
    (match.status === 'live' ||
      match.status === 'interrupted' ||
      match.status === 'finished' ||
      match.status === 'abandoned')
      ? match.score
      : undefined

  const statusBadge = (() => {
    switch (match.status) {
      case 'live': return <Badge variant="danger">进行中</Badge>
      case 'scheduled': return <Badge variant="success">即将开赛</Badge>
      case 'finished': return <Badge variant="neutral">已结束</Badge>
      case 'interrupted': return <Badge variant="warning">中断</Badge>
      case 'abandoned': return <Badge variant="warning">腰斩</Badge>
      case 'postponed': return <Badge variant="warning">延期</Badge>
      case 'cancelled': return <Badge variant="neutral">取消</Badge>
      default: return null
    }
  })()

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        {statusBadge}
        {match.status === 'live' && match.currentMinute && (
          <span className="text-xs font-mono text-red-400 animate-pulse">{match.currentMinute}'</span>
        )}
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
          {visibleScore ? (
            <>
              <p className={`text-2xl font-bold font-mono ${match.status === 'finished' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                {visibleScore.home}
              </p>
              <p className={`text-2xl font-bold font-mono ${match.status === 'finished' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                {visibleScore.away}
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
            const slotMin = getSlotMinute(label)
            const isFinished = match.status === 'finished'
            const isLiveCurrent = match.status === 'live' && match.currentMinute &&
              slotMin <= match.currentMinute &&
              (label === 'HT'
                ? match.currentMinute >= 45 && match.currentMinute < 60
                : true)

            let cls = 'text-[var(--text-secondary)] bg-[var(--bg-control)]'
            if (isFinished) {
              cls = 'text-[var(--text-secondary)]/50 bg-[var(--bg-control)]/60'
            } else if (isLiveCurrent) {
              cls = 'bg-red-500/20 text-red-400 font-medium'
            }

            return (
              <span
                key={label}
                className={`text-[10px] whitespace-nowrap px-2 py-1 rounded transition-colors ${cls}`}
              >
                {isLiveCurrent && match.currentMinute && slotMin === Math.max(
                  ...timeSlots.map(getSlotMinute).filter(m => m <= match.currentMinute!)
                ) && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
                )}
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
