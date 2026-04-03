import { useState, useMemo } from 'react'
import type { SoccerMatch } from '../../data/soccer/types'
import Badge from '../ui/Badge'
import FormationPitch from './FormationPitch'
import KickoffCountdown from './KickoffCountdown'
import HeadToHeadPanel from './HeadToHeadPanel'
import MatchTimeline from './MatchTimeline'
import MatchStatsBar from './MatchStatsBar'

interface Props {
  match: SoccerMatch
}

type InfoTab = 'lineups' | 'h2h' | 'stats'

export default function MatchInfoPanel({ match }: Props) {
  const [activeTab, setActiveTab] = useState<InfoTab>('lineups')

  const kickoffDate = useMemo(() => {
    if (match.status !== 'scheduled') return null
    const now = new Date()
    const target = new Date(now)
    const [h, m] = match.time.split(':').map(Number)
    target.setHours(h, m, 0, 0)
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1)
    }
    return target
  }, [match.time, match.status])

  const hasLineups = !!(match.homeLineup && match.awayLineup)
  const hasH2H = !!match.headToHead
  const hasStats = !!match.stats
  const hasEvents = !!(match.events && match.events.length > 0)

  const tabs: { id: InfoTab; label: string; available: boolean }[] = [
    { id: 'lineups', label: '阵容', available: hasLineups },
    { id: 'h2h', label: 'H2H', available: hasH2H },
    { id: 'stats', label: '统计', available: hasStats || hasEvents },
  ]

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--border)] flex items-center justify-center text-[8px] font-bold text-[var(--text-primary)]">
              {match.homeTeam.shortName}
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{match.homeTeam.shortName}</span>
          </div>
          <div className="text-center">
            {match.status === 'scheduled' && (
              <span className="text-[10px] text-[var(--text-secondary)]">{match.date} | {match.time}</span>
            )}
            {match.status === 'live' && match.score && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{match.score.home}</span>
                <span className="text-xs text-[var(--text-secondary)]">-</span>
                <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{match.score.away}</span>
              </div>
            )}
            {match.status === 'finished' && match.score && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{match.score.home}</span>
                <span className="text-xs text-[var(--text-secondary)]">-</span>
                <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{match.score.away}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{match.awayTeam.shortName}</span>
            <div className="w-6 h-6 rounded-full bg-[var(--border)] flex items-center justify-center text-[8px] font-bold text-[var(--text-primary)]">
              {match.awayTeam.shortName}
            </div>
          </div>
        </div>

        {/* Status line */}
        <div className="flex items-center justify-center gap-2">
          {match.status === 'live' && (
            <>
              <Badge variant="danger">LIVE</Badge>
              {match.currentMinute && (
                <span className="text-xs text-[var(--text-secondary)] font-mono">{match.currentMinute}'</span>
              )}
            </>
          )}
          {match.status === 'finished' && <Badge variant="neutral">ENDED</Badge>}
          {match.status === 'scheduled' && <Badge variant="success">即将开赛</Badge>}
        </div>

        {/* Timeline bar */}
        <div className="mt-3">
          <div className="flex items-center gap-0.5">
            <div className="text-[9px] text-[var(--text-secondary)] w-8">{match.homeTeam.shortName}</div>
            <div className="flex-1 relative h-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-[var(--border)]" />
              </div>
              {['15', '30', '45', '60', '75', '90'].map((min) => {
                const pct = (parseInt(min) / 90) * 100
                return (
                  <div key={min} className="absolute top-0 h-full flex flex-col items-center justify-end" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-px h-1.5 bg-[var(--border)]" />
                  </div>
                )
              })}
              {match.status === 'live' && match.currentMinute && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"
                  style={{ left: `${Math.min((match.currentMinute / 90) * 100, 100)}%`, transform: 'translate(-50%, -50%)' }}
                />
              )}
              {match.status === 'finished' && (
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  <div className="w-full h-px bg-[var(--text-secondary)]/40" />
                </div>
              )}
            </div>
            <div className="text-[9px] text-[var(--text-secondary)] w-8 text-right">{match.awayTeam.shortName}</div>
          </div>
          <div className="flex justify-between px-8 mt-0.5">
            {['15\'', '30\'', '45\'', '60\'', '75\'', '90\''].map((l) => (
              <span key={l} className="text-[8px] text-[var(--text-secondary)]/50">{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Kickoff countdown (scheduled only) */}
      {match.status === 'scheduled' && kickoffDate && (
        <div className="border-b border-[var(--border)]">
          <KickoffCountdown kickoffDate={kickoffDate} />
        </div>
      )}

      {/* Referee info */}
      {match.referee && (
        <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
          <span>Referee: {match.referee}</span>
        </div>
      )}

      {/* Inline events for live match */}
      {match.status === 'live' && hasEvents && (
        <div className="border-b border-[var(--border)] max-h-40 overflow-y-auto">
          <MatchTimeline events={match.events!} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)]">
        {tabs.filter((t) => t.available).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
              ${activeTab === tab.id
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#2DD4BF] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-[500px] overflow-y-auto">
        {activeTab === 'lineups' && hasLineups && (
          <div className="p-3">
            <FormationPitch
              homeLineup={match.homeLineup!}
              awayLineup={match.awayLineup!}
              homeShort={match.homeTeam.shortName}
              awayShort={match.awayTeam.shortName}
            />
          </div>
        )}

        {activeTab === 'h2h' && hasH2H && (
          <HeadToHeadPanel
            h2h={match.headToHead!}
            homeShort={match.homeTeam.shortName}
            awayShort={match.awayTeam.shortName}
          />
        )}

        {activeTab === 'stats' && (
          <div>
            {hasStats && (
              <MatchStatsBar
                stats={match.stats!}
                homeShort={match.homeTeam.shortName}
                awayShort={match.awayTeam.shortName}
              />
            )}
            {hasEvents && match.status === 'finished' && (
              <div className="border-t border-[var(--border)]">
                <MatchTimeline events={match.events!} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
