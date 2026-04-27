import { useState, useMemo } from 'react'
import { leaderboardData } from '../data/leaderboard'
import Card from '../components/ui/Card'

type TimeFilter = 'monthly' | 'all-time'

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors = ['text-[#FFD700]', 'text-[#C0C0C0]', 'text-[#CD7F32]']
    return (
      <span className={`text-sm font-bold ${colors[rank - 1]} w-6 text-center`}>
        {rank}
      </span>
    )
  }
  return <span className="text-sm text-[var(--text-secondary)] w-6 text-center">{rank}</span>
}

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time')

  const data = useMemo(() => {
    if (timeFilter === 'monthly') {
      return leaderboardData.map((entry) => ({
        ...entry,
        pnl: Math.round(entry.pnl * 0.3),
        volume: Math.round(entry.volume * 0.25),
      }))
    }
    return leaderboardData
  }, [timeFilter])

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">排行榜</h1>

      {/* Time filter */}
      <div className="flex gap-1 mb-5">
        {(['monthly', 'all-time'] as TimeFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setTimeFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
              timeFilter === f
                ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
            }`}
          >
            {f === 'monthly' ? '本月' : '全部时间'}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-3 text-xs font-medium text-[var(--text-secondary)] border-b border-[var(--border)]">
          <span>排名</span>
          <span>交易员</span>
          <span className="text-right">盈亏</span>
          <span className="text-right">准确率</span>
          <span className="text-right">成交量</span>
          <span className="text-right">市场数</span>
        </div>

        {/* Rows */}
        {data.map((entry) => (
          <div
            key={entry.rank}
            className="grid grid-cols-3 md:grid-cols-6 gap-2 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--border)]/30 transition-colors items-center"
          >
            <div className="flex items-center gap-2 md:col-span-1">
              <RankBadge rank={entry.rank} />
              <span className="text-sm text-[var(--text-primary)] font-medium md:hidden truncate">{entry.username}</span>
            </div>
            <span className="hidden md:block text-sm text-[var(--text-primary)]">{entry.username}</span>
            <span className={`text-right text-sm font-mono tabular-nums ${entry.pnl >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
              {entry.pnl >= 0 ? '+' : ''}{formatVolume(entry.pnl)}
            </span>
            <span className="text-right text-sm font-mono tabular-nums text-[var(--text-primary)] hidden md:block">
              {entry.accuracy}%
            </span>
            <span className="text-right text-sm font-mono tabular-nums text-[var(--text-secondary)] hidden md:block">
              {formatVolume(entry.volume)}
            </span>
            <span className="text-right text-sm font-mono tabular-nums text-[var(--text-secondary)] hidden md:block">
              {entry.markets}
            </span>
          </div>
        ))}
      </div>

      {/* Incentives cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M4 6l4-4 4 4" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">交易量奖励</h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            按月度交易量获得额外奖励。交易量等级越高，对应奖励比例越高。
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">月交易量 $10K-$50K</span>
              <span className="text-[#2DD4BF] font-mono">+5% 奖励</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">月交易量 $50K-$200K</span>
              <span className="text-[#2DD4BF] font-mono">+10% 奖励</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">月交易量 $200K 以上</span>
              <span className="text-[#2DD4BF] font-mono">+20% 奖励</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="6" width="4" height="8" rx="0.5" stroke="#F59E0B" strokeWidth="1.2" />
                <rect x="6" y="2" width="4" height="12" rx="0.5" stroke="#F59E0B" strokeWidth="1.2" />
                <rect x="10" y="4" width="4" height="10" rx="0.5" stroke="#F59E0B" strokeWidth="1.2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">流动性奖励</h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            通过提交限价委托并收窄买卖价差获得流动性奖励。
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">有效限价委托</span>
              <span className="text-[#F59E0B] font-mono">每次成交 0.1%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">最优档委托</span>
              <span className="text-[#F59E0B] font-mono">2 倍系数</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">重点市场奖励</span>
              <span className="text-[#F59E0B] font-mono">额外 +50%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
