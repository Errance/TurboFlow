import { useMemo, useState } from 'react'
import type { SoccerMatch } from '../../data/soccer/types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useSoccerBetSlipStore, type ExtendedBetSlipItem } from '../../stores/soccerBetSlipStore'

interface Props {
  /** 当前页面所属比赛的 id。用于高亮"当前场"分组与 suspended 校验。 */
  currentMatchId: string
  /** 当前场 suspended 的 marketTitle 集合（SoccerMatchPage 传入）。 */
  suspendedMarkets?: Set<string>
  /** 当前场的比赛状态，决定是否显示"比赛已结束"遮罩。 */
  matchStatus?: SoccerMatch['status']
}

const ENDED_STATUSES = new Set(['finished', 'abandoned', 'cancelled', 'corrected'])

const STATUS_MESSAGES: Record<string, string> = {
  finished: '比赛已结束，所有盘口已结算',
  abandoned: '比赛异常结束，盘口按规则结算',
  cancelled: '比赛已取消，所有盘口作废退款',
  corrected: '比赛结果已修正',
}

type Group = { matchId: string; matchLabel: string; items: ExtendedBetSlipItem[] }

function groupByMatch(items: ExtendedBetSlipItem[], currentMatchId: string): Group[] {
  const map = new Map<string, Group>()
  for (const it of items) {
    const g = map.get(it.matchId)
    if (g) {
      g.items.push(it)
    } else {
      map.set(it.matchId, { matchId: it.matchId, matchLabel: it.matchLabel, items: [it] })
    }
  }
  // 当前场置顶，其余按第一次添加时间升序
  const groups = Array.from(map.values())
  groups.sort((a, b) => {
    if (a.matchId === currentMatchId) return -1
    if (b.matchId === currentMatchId) return 1
    return (a.items[0]?.addedAt ?? 0) - (b.items[0]?.addedAt ?? 0)
  })
  return groups
}

export default function SoccerBetSlip({ currentMatchId, suspendedMarkets, matchStatus }: Props) {
  const [amount, setAmount] = useState('')

  const items = useSoccerBetSlipStore((s) => s.items)
  const removeById = useSoccerBetSlipStore((s) => s.removeById)
  const clearMatch = useSoccerBetSlipStore((s) => s.clearMatch)
  const clearAll = useSoccerBetSlipStore((s) => s.clearAll)

  const totalOdds = useMemo(
    () => items.reduce((acc, item) => acc * item.odds, 1),
    [items]
  )
  const payout = amount ? (parseFloat(amount) * totalOdds).toFixed(2) : '0.00'

  const isMatchEnded = matchStatus ? ENDED_STATUSES.has(matchStatus) : false
  const hasCurrentMatchItems = items.some((it) => it.matchId === currentMatchId)
  const hasSuspendedInSlip = items.some(
    (it) => it.matchId === currentMatchId && suspendedMarkets?.has(it.marketTitle)
  )

  const groups = useMemo(() => groupByMatch(items, currentMatchId), [items, currentMatchId])
  const crossMatchCount = groups.filter((g) => g.matchId !== currentMatchId).length

  if (items.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">投注单</h3>
        {isMatchEnded && matchStatus ? (
          <p className="text-xs text-[var(--text-secondary)] text-center py-6">
            {STATUS_MESSAGES[matchStatus] ?? '比赛已结束'}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)] text-center py-6">
            点击赔率按钮添加选项
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          投注单
          <span className="ml-1.5 text-[10px] bg-[#2DD4BF] text-[#0B0B0F] px-1.5 py-0.5 rounded-full font-bold">
            {items.length}
          </span>
          {crossMatchCount > 0 && (
            <span className="ml-1.5 text-[10px] text-[var(--text-secondary)] font-normal">
              · 跨 {groups.length} 场
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {hasCurrentMatchItems && crossMatchCount > 0 && (
            <button
              onClick={() => clearMatch(currentMatchId)}
              className="text-xs text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors"
              title="清空当前场的选项"
            >
              清空当前场
            </button>
          )}
          <button
            onClick={clearAll}
            className="text-xs text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors"
          >
            清空全部
          </button>
        </div>
      </div>

      {isMatchEnded && matchStatus && hasCurrentMatchItems && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400 font-medium">{STATUS_MESSAGES[matchStatus] ?? '比赛已结束'}</p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {groups.map((g) => {
          const isCurrent = g.matchId === currentMatchId
          return (
            <div key={g.matchId}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] truncate">
                  {isCurrent ? '当前场' : '其他比赛'} · {g.matchLabel}
                </p>
                {!isCurrent && (
                  <button
                    onClick={() => clearMatch(g.matchId)}
                    className="text-[10px] text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors ml-2 shrink-0"
                  >
                    移除
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {g.items.map((item) => {
                  const isSuspended = isCurrent && suspendedMarkets?.has(item.marketTitle)
                  return (
                    <div
                      key={item.id}
                      className={`bg-[var(--bg-control)] rounded-lg p-3 relative group ${isSuspended || (isCurrent && isMatchEnded) ? 'opacity-50' : ''}`}
                    >
                      <button
                        onClick={() => removeById(item.id)}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[#E85A7E] hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs"
                        aria-label="移除选项"
                      >
                        ×
                      </button>
                      <p className="text-xs text-[var(--text-primary)] mb-0.5 pr-6">{item.marketTitle}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#2DD4BF]">{item.selection}</span>
                        <span className="text-sm font-bold font-mono text-[var(--text-primary)]">{item.odds.toFixed(2)}</span>
                      </div>
                      {isSuspended && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          盘口已暂停
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-3 pb-3 border-b border-[var(--border)]">
          <span>组合赔率 {groups.length > 1 ? '(跨场串关)' : '(同场串关)'}</span>
          <span className="font-mono font-semibold text-[var(--text-primary)]">{totalOdds.toFixed(2)}</span>
        </div>
      )}

      <Input
        label="投注金额"
        type="number"
        placeholder="0.00"
        suffix="USDT"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-3"
      />

      <div className="flex items-center justify-between text-xs mb-4">
        <span className="text-[var(--text-secondary)]">预计返还</span>
        <span className="font-mono font-semibold text-[#2DD4BF]">{payout} USDT</span>
      </div>

      <Button
        fullWidth
        disabled={!amount || parseFloat(amount) <= 0 || hasSuspendedInSlip || isMatchEnded}
      >
        {hasSuspendedInSlip ? '包含暂停盘口' : isMatchEnded ? '当前比赛已结束' : '确认投注'}
      </Button>
    </div>
  )
}
