/**
 * v4.5 预测大赛完整榜单页。
 *
 * 路径：`/soccer/predictions/:tournamentId/leaderboard`
 *
 * 字段：用户名 / 得分 / 占总分比例 / 投影派奖额
 * 排序：按得分（默认降序）/ 按 tiebreaker
 * 搜索：按用户名
 * 页头明确"按命中率分奖、名次仅供展示"
 */

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import {
  bracketTournaments,
  getBracketTournamentById,
  SAMPLE_FINAL_TOTAL_GOALS,
  sampleLeaderboard,
  sampleSelfRunningRow,
  type BracketTournament,
  type LeaderboardRow,
} from '../data/soccer/bracketData'

type SortKey = 'score' | 'tiebreaker'

const PAGE_SIZE = 25

export default function SoccerPredictionLeaderboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()

  const tournament: BracketTournament =
    getBracketTournamentById(tournamentId ?? '') ?? bracketTournaments[0]

  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered: LeaderboardRow[] = useMemo(() => {
    const all = sampleLeaderboard.filter((row) => row.tournamentId === tournament.id)
    // 把"我"也插入榜单（mock 中不在前 100，单独高亮）
    if (!all.some((r) => r.isSelf) && sampleSelfRunningRow.tournamentId === tournament.id) {
      all.push(sampleSelfRunningRow)
    }
    const lower = search.trim().toLowerCase()
    const matched = lower
      ? all.filter((r) => r.userName.toLowerCase().includes(lower))
      : all
    const sorted = [...matched].sort((a, b) => {
      if (sortKey === 'tiebreaker') {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        const aDistance = Math.abs((a.tiebreakerGuess ?? 99) - SAMPLE_FINAL_TOTAL_GOALS)
        const bDistance = Math.abs((b.tiebreakerGuess ?? 99) - SAMPLE_FINAL_TOTAL_GOALS)
        return aDistance - bDistance
      }
      return b.totalScore - a.totalScore
    })
    return sorted
  }, [sortKey, search, tournament.id])

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = filtered.length > visible.length

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button
          onClick={() => navigate('/soccer')}
          className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          足球
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button
          onClick={() => navigate('/soccer?view=pools')}
          className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          预测大赛
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button
          onClick={() => navigate(`/soccer/predictions/${tournament.id}`)}
          className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          {tournament.shortName}
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium">完整榜单</span>
      </nav>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 mb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          全员得分榜｜{tournament.shortName}
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)] leading-5">
          按命中率分奖：派奖 = (本人得分 / 全员总分) × 净池。<strong className="text-[var(--text-primary)]">名次仅供展示</strong>，不影响派奖额。
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="参赛人数" value={tournament.poolSnapshot.entrants.toLocaleString()} />
          <Stat label="净池" value={`${tournament.poolSnapshot.netPool.toLocaleString()} USDT`} />
          <Stat label="全员总分" value={tournament.poolSnapshot.aggregateScore.toLocaleString()} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="搜索用户名"
          className="flex-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#2DD4BF] focus:outline-none"
        />
        <div className="flex rounded-lg bg-[var(--bg-card)] border border-[var(--border)] p-0.5">
          {[
            { id: 'score' as const, label: '按得分' },
            { id: 'tiebreaker' as const, label: '同分 tiebreaker' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortKey(opt.id)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                sortKey === opt.id
                  ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-control)]/40 border-b border-[var(--border)]">
          <span className="w-12 shrink-0">名次</span>
          <span className="flex-1">用户</span>
          <span className="w-16 text-right">得分</span>
          <span className="w-20 text-right">占总分</span>
          <span className="w-24 text-right">投影派奖</span>
          <span className="w-16 text-right">tiebreaker</span>
        </div>
        {visible.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--text-secondary)]">未匹配到符合条件的用户</p>
          </div>
        )}
        {visible.map((row) => (
          <div
            key={`${row.rankDisplay}-${row.userName}`}
            className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-[var(--border)] last:border-b-0 ${
              row.isSelf ? 'bg-[#2DD4BF]/10' : ''
            }`}
          >
            <span className="w-12 shrink-0 font-mono text-[10px] text-[var(--text-secondary)]">
              #{row.rankDisplay}
            </span>
            <span
              className={`flex-1 truncate ${
                row.isSelf ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'
              }`}
            >
              {row.userName}
              {row.isSelf && <span className="ml-2 text-[10px] text-[#2DD4BF]/80">（你）</span>}
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-[var(--text-primary)]">
              {row.totalScore} 分
            </span>
            <span className="w-20 shrink-0 text-right font-mono text-[10px] text-[var(--text-secondary)]">
              {(row.scoreShare * 100).toFixed(2)}%
            </span>
            <span className="w-24 shrink-0 text-right font-mono text-[10px] text-[#2DD4BF]">
              {row.projectedPayout.toFixed(2)}
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-[10px] text-[var(--text-secondary)]">
              {row.tiebreakerGuess ?? '—'}
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => setPage((p) => p + 1)}>
            加载更多（剩余 {filtered.length - visible.length} 条）
          </Button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-mono text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
