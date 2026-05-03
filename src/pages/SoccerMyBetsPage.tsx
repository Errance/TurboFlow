/**
 * 我的注单页。
 *
 * 功能：
 * - 状态筛选：全部、待结算、已结算、提前结清
 * - 日期范围：今天 / 7 天 / 30 天 / 全部
 * - 分页：20/页，底部"加载更多"
 * - Cash Out
 * - 重投
 * - 导出 CSV
 *
 * Cash Out 使用本地模拟报价。
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyBetsStore } from '../stores/myBetsStore'
import { useSoccerBracketEntryStore } from '../stores/soccerBracketEntryStore'
import { useToastStore } from '../stores/toastStore'
import MyBetCard from '../components/soccer/MyBetCard'
import PredictionEntryCard from '../components/soccer/PredictionEntryCard'
import Button from '../components/ui/Button'
import type { MyBetItem } from '../data/soccer/types'
import {
  bracketTournaments,
  getBracketTournamentById,
  sampleEntries,
} from '../data/soccer/bracketData'

type TopTab = 'bets' | 'pools'
type StatusFilter = 'all' | 'unsettled' | 'settled_any' | 'cashed_out'
type DateFilter = 'today' | '7d' | '30d' | 'all'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'unsettled', label: '待结算' },
  { id: 'settled_any', label: '已结算' },
  { id: 'cashed_out', label: '提前结清' },
]

const DATE_TABS: { id: DateFilter; label: string }[] = [
  { id: 'today', label: '今天' },
  { id: '7d', label: '7 天' },
  { id: '30d', label: '30 天' },
  { id: 'all', label: '全部' },
]

const PAGE_SIZE = 20

function cashoutPrice(bet: MyBetItem): number {
  const stake = bet.stake ?? bet.amount ?? 0
  const odds = bet.odds ?? 1
  if (bet.status === 'live') {
    const seed = Array.from(bet.id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
    const factor = 0.55 + (seed % 20) / 100
    return +(stake * odds * factor).toFixed(2)
  }
  return +(stake * 0.9).toFixed(2)
}

function quoteExpiresAt(): string {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString()
}

function dateFloor(filter: DateFilter): string | null {
  if (filter === 'all') return null
  const now = Date.now()
  if (filter === 'today') {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  if (filter === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  if (filter === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  return null
}

export default function SoccerMyBetsPage() {
  const navigate = useNavigate()
  const [topTab, setTopTab] = useState<TopTab>('bets')
  const [statusTab, setStatusTab] = useState<StatusFilter>('all')
  const [dateTab, setDateTab] = useState<DateFilter>('7d')
  const [page, setPage] = useState(1)

  const bets = useMyBetsStore((s) => s.bets)
  const cashout = useMyBetsStore((s) => s.cashout)
  const exportCsv = useMyBetsStore((s) => s.exportCsv)
  const duplicateToSlip = useMyBetsStore((s) => s.duplicateToSlip)
  const update = useMyBetsStore((s) => s.update)
  const addToast = useToastStore((s) => s.addToast)

  const filtered = useMemo(() => {
    const floor = dateFloor(dateTab)
    return bets
      .filter((b) => {
        if (floor && b.placedAt && b.placedAt < floor) return false
        if (statusTab === 'all') return true
        if (statusTab === 'unsettled')
          return b.status === 'placed' || b.status === 'live' || b.status === 'pending'
        if (statusTab === 'settled_any')
          return b.status === 'settled' || b.status === 'cashed_out'
        return b.status === statusTab
      })
      .sort((a, b) => (a.placedAt ?? '') < (b.placedAt ?? '') ? 1 : -1)
  }, [bets, statusTab, dateTab])

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = filtered.length > visible.length

  const handleCashOut = (bet: MyBetItem) => {
    const price = bet.cashout?.availablePrice ?? cashoutPrice(bet)
    const ok = window.confirm(
      `是否按当前参考结算价 ${price.toFixed(2)} USDT 提前结清本注单（单号：${bet.betCode ?? bet.id}）？结清后无法撤销。`,
    )
    if (!ok) return
    const done = cashout(bet.id, price)
    addToast({
      type: done ? 'success' : 'error',
      message: done ? `已提前结清，${price.toFixed(2)} USDT 已计入可用余额` : '当前注单不支持提前结清',
    })
  }

  const handleReplay = (bet: MyBetItem) => {
    const ok = duplicateToSlip(bet.id)
    if (ok) {
      addToast({ type: 'success', message: '已加入投注单' })
    } else {
      addToast({ type: 'error', message: '该注单暂无可重新投注的选项' })
    }
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      addToast({ type: 'info', message: `已复制 ${code}` })
    } catch {
      addToast({ type: 'error', message: '复制失败，请手动复制注单号' })
    }
  }

  const handleExport = () => {
    const csv = exportCsv()
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    a.href = url
    a.download = `mybets-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 给待结算注单补一份可见的参考提前结清价。
  useEffect(() => {
    for (const b of bets) {
      if (b.cashout && !b.cashout.needsRequote) continue
      if (b.status !== 'placed' && b.status !== 'live') continue
      const price = cashoutPrice(b)
      update(b.id, {
        cashout: {
          availablePrice: price,
          minutesUntilExpire: 10,
          expiresAt: quoteExpiresAt(),
          isSimulated: true,
        },
      })
    }
    // 仅按 bet 数量变化兜底；避免循环写入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bets.length])

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button
          onClick={() => navigate('/soccer')}
          className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          足球
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium">我的注单</span>
      </nav>

      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">我的注单</h1>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
            提前结清报价为参考报价，刷新后将更新。
          </p>
        </div>
        {topTab === 'bets' && (
          <Button variant="ghost" onClick={handleExport} className="!py-1.5 !text-xs">
            导出记录
          </Button>
        )}
      </div>

      {/* Top tab: 传统注单 / 预测大赛 */}
      <div className="mb-4 flex rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-1 w-fit">
        {[
          { id: 'bets' as const, label: '传统注单' },
          { id: 'pools' as const, label: '我的预测大赛' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTopTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              topTab === t.id
                ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {topTab === 'bets' && (
        <>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setStatusTab(t.id)
                  setPage(1)
                }}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  statusTab === t.id
                    ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {DATE_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setDateTab(t.id)
                  setPage(1)
                }}
                className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                  dateTab === t.id
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-[var(--text-secondary)]">当前无符合条件的注单</p>
            </div>
          )}

          <div className="space-y-3">
            {visible.map((b) => (
              <MyBetCard
                key={b.id}
                bet={b}
                onCashOut={handleCashOut}
                onReplay={handleReplay}
                onCopyCode={handleCopyCode}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => setPage((p) => p + 1)}>
                加载更多（剩余 {filtered.length - visible.length} 条）
              </Button>
            </div>
          )}
        </>
      )}

      {topTab === 'pools' && <PoolEntriesPanel />}
    </div>
  )
}

// -----------------------------------------------------------------------------
// 我的预测大赛 panel：列出所有 entry，状态机独立于传统注单
// -----------------------------------------------------------------------------

function PoolEntriesPanel() {
  const addToast = useToastStore((s) => s.addToast)
  const entries = useSoccerBracketEntryStore((s) => s.entries)
  const withdrawEntry = useSoccerBracketEntryStore((s) => s.withdrawEntry)

  // mock 演示：按状态分组展示，同一赛事下多个状态都有示例
  const groups = [
    { key: 'active', label: '进行中 / 已锁定 / 已提交', match: (s: string) => s === 'submitted' || s === 'locked' },
    { key: 'settled', label: '已结算', match: (s: string) => s === 'settled' },
    { key: 'draft', label: '草稿', match: (s: string) => s === 'draft' },
    { key: 'refunded', label: '已退款', match: (s: string) => s === 'refunded' },
  ]

  // 去重：每个赛事的同一状态保留最新一条（mock 中 self-locked 和 self-running 都是同一 entry 的不同形态，只展示其中一个）
  const seen = new Set<string>()
  const storeEntries = Object.values(entries)
  const visibleEntries = [...storeEntries, ...sampleEntries].filter((e) => {
    if (e.status === 'locked' && e.totalScore === undefined) return false
    const key = `${e.tournamentId}|${e.status}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (visibleEntries.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[var(--text-secondary)]">还没有参加过任何预测大赛</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-[10px] text-[var(--text-secondary)] leading-5">
        预测大赛走独立结算，与传统注单互不冲销。锁前可全额撤回入场费，锁后无法取消，按命中率分奖。
      </p>
      {groups.map((g) => {
        const items = visibleEntries.filter((e) => g.match(e.status))
        if (items.length === 0) return null
        return (
          <div key={g.key}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{g.label}</h3>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">{items.length}</span>
            </div>
            <div className="space-y-3">
              {items.map((entry) => {
                const tournament = getBracketTournamentById(entry.tournamentId) ?? bracketTournaments[0]
                return (
                  <PredictionEntryCard
                    key={entry.id}
                    entry={entry}
                    tournament={tournament}
                    onWithdraw={() => {
                      withdrawEntry(entry.tournamentId)
                      addToast({
                        type: 'success',
                        message: `已撤回，${tournament.entryFee.toFixed(2)} ${tournament.currency} 已退回钱包（演示）`,
                      })
                    }}
                    onReplay={() => addToast({
                      type: 'info',
                      message: '尚未开放下届赛事报名（演示）',
                    })}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
