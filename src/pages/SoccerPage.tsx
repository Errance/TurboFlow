import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { leagues, matches } from '../data/soccer/mockData'
import { futuresCompetitions } from '../data/soccer/futuresData'
import MatchListCard from '../components/soccer/MatchListCard'
import { SoccerListSkeleton } from '../components/soccer/SoccerSkeletons'

export default function SoccerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedLeague, setSelectedLeague] = useState<string>(() => searchParams.get('league') ?? 'all')
  const [view, setView] = useState<'matches' | 'futures'>(() => searchParams.get('view') === 'futures' ? 'futures' : 'matches')
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    const leagueParam = searchParams.get('league')
    if (leagueParam && leagueParam !== selectedLeague) {
      setSelectedLeague(leagueParam)
    }
    const nextView = searchParams.get('view') === 'futures' ? 'futures' : 'matches'
    if (nextView !== view) setView(nextView)
  }, [searchParams])

  useEffect(() => {
    const id = window.setTimeout(() => setBootstrapped(true), 120)
    return () => window.clearTimeout(id)
  }, [])

  if (!bootstrapped) return <SoccerListSkeleton />

  const handleLeagueChange = (id: string) => {
    setSelectedLeague(id)
    if (id === 'all') {
      setSearchParams(view === 'futures' ? { view: 'futures' } : {})
    } else {
      setSearchParams(view === 'futures' ? { view: 'futures', league: id } : { league: id })
    }
  }

  const handleViewChange = (nextView: 'matches' | 'futures') => {
    setView(nextView)
    if (nextView === 'futures') {
      setSearchParams(selectedLeague === 'all' ? { view: 'futures' } : { view: 'futures', league: selectedLeague })
    } else {
      setSearchParams(selectedLeague === 'all' ? {} : { league: selectedLeague })
    }
  }

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
              onClick={() => handleLeagueChange('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedLeague === 'all'
                  ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              <span>全部赛事</span>
              <div className="flex items-center gap-1.5">
                {liveCount > 0 && (
                  <span className="text-[10px] text-[#E85A7E] font-mono">{liveCount} 场进行中</span>
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
                  onClick={() => handleLeagueChange(league.id)}
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

          {matches.some((m) => m.status === 'live') && (
            <div className="mt-6 border-t border-[var(--border)] pt-4">
              <h3 className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">正在进行</h3>
              <div className="space-y-1">
                {matches.filter((m) => m.status === 'live').slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#E85A7E]/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85A7E] animate-pulse shrink-0" />
                    <span className="text-[10px] text-[var(--text-primary)] truncate">
                      {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                    </span>
                    {m.score && (
                      <span className="text-[10px] text-[#E85A7E] font-mono ml-auto shrink-0">
                        {m.score.home}-{m.score.away}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {matches.some((m) => m.status === 'scheduled') && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <h3 className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">即将开赛</h3>
              <div className="space-y-1">
                {matches.filter((m) => m.status === 'scheduled').slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--bg-control)]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/50 shrink-0" />
                    <span className="text-[10px] text-[var(--text-primary)] truncate">
                      {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono ml-auto shrink-0">
                      {m.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Main content - Match list */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-1">
              {[
                { id: 'matches' as const, label: '比赛' },
                { id: 'futures' as const, label: '冠军与晋级' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                    view === item.id
                      ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {view === 'futures' && (
              <p className="text-xs text-[var(--text-secondary)]">冠军、晋级、赛季名次和两回合系列赛预测</p>
            )}
          </div>

          {view === 'matches' && Object.entries(groupedByLeague).map(([league, leagueMatches]) => (
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
                <span className="hidden sm:block w-[182px] shrink-0 text-center">胜平负</span>
                <span className="hidden md:block w-[118px] shrink-0 text-center">大小球</span>
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

          {view === 'futures' && (
            <div className="grid gap-4 lg:grid-cols-2">
              {futuresCompetitions.map((competition) => (
                <button
                  key={competition.id}
                  onClick={() => navigate(`/soccer/futures/${competition.id}`)}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-left transition-colors hover:border-[#2DD4BF]/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#2DD4BF]">{competition.region} · {competition.phase}</p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{competition.shortName}</h3>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{competition.headline}</p>
                    </div>
                    <span className="rounded-full bg-[var(--bg-control)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">
                      {competition.markets.length} 个市场
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {competition.markets.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-xl bg-[var(--bg-control)] px-3 py-2">
                        <p className="text-[10px] text-[var(--text-secondary)]">{item.group}</p>
                        <p className="mt-1 truncate text-xs text-[var(--text-primary)]">{item.market.title}</p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {view === 'matches' && filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">暂无赛事</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
