export type SportsTab = 'upcoming' | 'live' | 'results'

interface SportsSidebarProps {
  sportFilter: string
  leagueFilter: string
  sportTypes: string[]
  leaguesBySport: Record<string, string[]>
  expandedSport: string | null
  onSportToggle: (sport: string) => void
  onLeagueSelect: (sport: string, league: string) => void
  onSelectAll: () => void
  activeTab: SportsTab
  setActiveTab: (tab: SportsTab) => void
  eventCountBySport: Record<string, number>
  eventCountByLeague: Record<string, number>
  liveCountBySport: Record<string, number>
}

export default function SportsSidebar({
  sportFilter,
  leagueFilter,
  sportTypes,
  leaguesBySport,
  expandedSport,
  onSportToggle,
  onLeagueSelect,
  onSelectAll,
  activeTab,
  setActiveTab,
  eventCountBySport,
  eventCountByLeague,
  liveCountBySport,
}: SportsSidebarProps) {
  const tabs: { id: SportsTab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'live', label: 'Live' },
    { id: 'results', label: 'Results' },
  ]

  return (
    <nav className="space-y-1">
      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border-t border-[var(--border)] pt-3 space-y-0.5">
        <button
          onClick={onSelectAll}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            sportFilter === 'All'
              ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
          }`}
        >
          <span>All Sports</span>
        </button>

        {sportTypes.filter((s) => s !== 'All').map((sport) => {
          const isExpanded = expandedSport === sport
          const isActive = sportFilter === sport && leagueFilter === 'All'
          const leagues = leaguesBySport[sport] ?? []
          const count = eventCountBySport[sport] ?? 0
          const liveCount = liveCountBySport[sport] ?? 0

          return (
            <div key={sport}>
              <button
                onClick={() => onSportToggle(sport)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] font-medium'
                    : sportFilter === sport
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                  >
                    <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{sport}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {liveCount > 0 && (
                    <span className="text-[10px] text-[#E85A7E] font-mono">{liveCount} live</span>
                  )}
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">{count}</span>
                </div>
              </button>

              {isExpanded && leagues.length > 0 && (
                <div className="ml-5 pl-2 border-l border-[var(--border)] space-y-0.5 mt-0.5 mb-1">
                  <button
                    onClick={() => onLeagueSelect(sport, 'All')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                      sportFilter === sport && leagueFilter === 'All'
                        ? 'text-[#2DD4BF] font-medium'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    All {sport}
                  </button>
                  {leagues.map((league) => {
                    const leagueCount = eventCountByLeague[`${sport}:${league}`] ?? 0
                    return (
                      <button
                        key={league}
                        onClick={() => onLeagueSelect(sport, league)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${
                          sportFilter === sport && leagueFilter === league
                            ? 'text-[#2DD4BF] font-medium bg-[#2DD4BF]/5'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                        }`}
                      >
                        <span className="truncate">{league}</span>
                        <span className="text-[10px] font-mono shrink-0 ml-2">{leagueCount}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
