import { useState } from 'react'
import { leagues, matches } from '../data/soccer/mockData'
import MatchListCard from '../components/soccer/MatchListCard'

export default function SoccerPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('all')

  const filteredMatches = selectedLeague === 'all'
    ? matches
    : matches.filter((m) => m.leagueId === selectedLeague)

  const liveCount = matches.filter((m) => m.status === 'live').length
  const groupedByLeague = filteredMatches.reduce<Record<string, typeof matches>>((acc, m) => {
    ;(acc[m.league] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar - League navigation */}
        <nav className="md:w-56 shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            足球
          </h2>

          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedLeague('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedLeague === 'all'
                  ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              <span>全部赛事</span>
              <div className="flex items-center gap-1.5">
                {liveCount > 0 && (
                  <span className="text-[10px] text-[#E85A7E] font-mono">{liveCount} live</span>
                )}
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">{matches.length}</span>
              </div>
            </button>

            {leagues.map((league) => {
              const leagueMatches = matches.filter((m) => m.leagueId === league.id)
              const leagueLive = leagueMatches.filter((m) => m.status === 'live').length
              return (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedLeague === league.id
                      ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="truncate">{league.name}</span>
                    <span className="text-[10px] opacity-60">{league.country}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {leagueLive > 0 && (
                      <span className="text-[10px] text-[#E85A7E] font-mono">{leagueLive}</span>
                    )}
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">{leagueMatches.length}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <h3 className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">即将开赛</h3>
            <div className="space-y-1">
              {matches.filter((m) => m.status === 'live').slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#E85A7E]/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E85A7E] animate-pulse shrink-0" />
                  <span className="text-[10px] text-[var(--text-primary)] truncate">
                    {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                  </span>
                  <span className="text-[10px] text-[#E85A7E] font-mono ml-auto shrink-0">
                    {m.score?.home}-{m.score?.away}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content - Match list */}
        <div className="flex-1 min-w-0">
          {Object.entries(groupedByLeague).map(([league, leagueMatches]) => (
            <div key={league} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{league}</h3>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                  {leagueMatches.length} 场
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                <span className="w-12 shrink-0 text-center">时间</span>
                <span className="flex-1">比赛</span>
                <span className="hidden sm:block w-[182px] shrink-0 text-center">1x2</span>
                <span className="hidden md:block w-[118px] shrink-0 text-center">总进球</span>
                <span className="hidden lg:block w-[138px] shrink-0 text-center">亚盘</span>
                <span className="w-16 shrink-0 text-right">盘口</span>
              </div>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                {leagueMatches.map((match) => (
                  <MatchListCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}

          {filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">暂无赛事</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
