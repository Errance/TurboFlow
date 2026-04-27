import { useState } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'

type TabId = 'totalPnl' | 'bestSinglePnl' | 'maxStreak'

const TABS: { id: TabId; label: string }[] = [
  { id: 'totalPnl', label: '总盈利' },
  { id: 'bestSinglePnl', label: '最佳交易' },
  { id: 'maxStreak', label: '连胜' },
]

const PAGE_SIZE = 10

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-black">🥇</span>
  if (rank === 2) return <span className="text-gray-400 font-black">🥈</span>
  if (rank === 3) return <span className="text-amber-600 font-black">🥉</span>
  return <span className="text-[var(--text-tertiary)] font-medium">#{rank}</span>
}

export default function Leaderboard({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  const leaderboard = useEventContractStore((s) => s.leaderboard)
  const [activeTab, setActiveTab] = useState<TabId>('totalPnl')
  const [page, setPage] = useState(0)

  const sorted = [...leaderboard]
    .sort((a, b) => {
      if (activeTab === 'totalPnl') return b.totalPnl - a.totalPnl
      if (activeTab === 'maxStreak') return b.maxStreak - a.maxStreak
      return b.bestSinglePnl - a.bestSinglePnl
    })
    .map((e, i) => ({ ...e, rank: i + 1 }))

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const topPlayer = sorted[0]

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setPage(0)
  }

  return (
    <div className="mb-3">
      {/* Collapsed / Toggle button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--text-tertiary)]/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <span className="text-xs font-semibold">排行榜</span>
          {topPlayer && !expanded && (
            <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
              #1 {topPlayer.playerName} · +${topPlayer.totalPnl.toLocaleString()}
            </span>
          )}
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform text-[var(--text-tertiary)] ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Expanded content — full-width, natural height */}
      {expanded && (
        <div className="mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[#2DD4BF]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#2DD4BF] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 px-2 text-left text-[var(--text-tertiary)] font-semibold w-10">#</th>
                <th className="py-2 px-2 text-left text-[var(--text-tertiary)] font-semibold">用户</th>
                {activeTab === 'totalPnl' && (
                  <>
                    <th className="py-2 px-2 text-right text-[var(--text-tertiary)] font-semibold">连胜</th>
                    <th className="py-2 px-2 text-right text-[var(--text-tertiary)] font-semibold">最佳交易</th>
                    <th className="py-2 px-2 text-right text-[#2DD4BF] font-semibold">总盈利</th>
                  </>
                )}
                {activeTab === 'bestSinglePnl' && (
                  <>
                    <th className="py-2 px-2 text-right text-[var(--text-tertiary)] font-semibold">连胜</th>
                    <th className="py-2 px-2 text-right text-[var(--text-tertiary)] font-semibold">总盈利</th>
                    <th className="py-2 px-2 text-right text-[#2DD4BF] font-semibold">最佳交易</th>
                  </>
                )}
                {activeTab === 'maxStreak' && (
                  <>
                    <th className="py-2 px-2 text-right text-[var(--text-tertiary)] font-semibold">最佳交易</th>
                    <th className="py-2 px-2 text-right text-[var(--text-tertiary)] font-semibold">总盈利</th>
                    <th className="py-2 px-2 text-right text-[#2DD4BF] font-semibold">连胜</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {pageData.map((entry) => (
                <tr
                  key={entry.playerName}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    entry.rank <= 3 ? 'bg-yellow-400/[0.03]' : ''
                  }`}
                >
                  <td className="py-1.5 px-2"><RankCell rank={entry.rank} /></td>
                  <td className="py-1.5 px-2 font-medium text-[var(--text-primary)] truncate max-w-[120px]">
                    {entry.playerName}
                  </td>
                  {activeTab === 'totalPnl' && (
                    <>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--text-tertiary)]">
                        {entry.maxStreak} 连胜
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--text-tertiary)]">
                        +${entry.bestSinglePnl.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums font-bold text-[#2DD4BF]">
                        +${entry.totalPnl.toLocaleString()}
                      </td>
                    </>
                  )}
                  {activeTab === 'bestSinglePnl' && (
                    <>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--text-tertiary)]">
                        {entry.maxStreak} 连胜
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--text-tertiary)]">
                        +${entry.totalPnl.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums font-bold text-[#2DD4BF]">
                        +${entry.bestSinglePnl.toLocaleString()}
                      </td>
                    </>
                  )}
                  {activeTab === 'maxStreak' && (
                    <>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--text-tertiary)]">
                        +${entry.bestSinglePnl.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--text-tertiary)]">
                        +${entry.totalPnl.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums font-bold text-[#2DD4BF]">
                        {entry.maxStreak} 连胜
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-2 border-t border-[var(--border)]">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-2 py-0.5 text-[10px] rounded hover:bg-[var(--border)] disabled:opacity-30 text-[var(--text-secondary)]"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-6 h-6 text-[10px] rounded ${
                    i === page
                      ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] font-bold'
                      : 'hover:bg-[var(--border)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="px-2 py-0.5 text-[10px] rounded hover:bg-[var(--border)] disabled:opacity-30 text-[var(--text-secondary)]"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
