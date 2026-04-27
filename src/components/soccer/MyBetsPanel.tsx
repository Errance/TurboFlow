/**
 * 比赛详情页右栏的"我的投注"侧栏摘要。
 *
 * 从 Phase 5 起不再接受 props，改为直接读 myBetsStore，仅展示最近 5 条，
 * 底部提供「查看全部」跳 /soccer/mybets。
 *
 * 为保留向后兼容，props `bets` 仍可选：若传入则覆盖 store（用于局部预览 / 测试）。
 */

import { useNavigate } from 'react-router-dom'
import type { MyBetItem } from '../../data/soccer/types'
import Badge from '../ui/Badge'
import { useMyBetsStore } from '../../stores/myBetsStore'

interface Props {
  bets?: MyBetItem[]
  limit?: number
}

const resultConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' | 'info'; sign: string }> = {
  win: { label: '赢', variant: 'success', sign: '+' },
  loss: { label: '输', variant: 'danger', sign: '-' },
  push: { label: '退款', variant: 'neutral', sign: '' },
}

function realizedProfit(bet: MyBetItem): number | null {
  const status = bet.status ?? 'settled'
  const stake = bet.stake ?? bet.amount ?? 0
  if (status === 'cashed_out') return (bet.payout ?? 0) - stake
  if (status === 'corrected') return (bet.payout ?? 0) - stake + (bet.correction?.diffPayout ?? 0)
  if (status !== 'settled') return null
  return (bet.payout ?? 0) - stake
}

function statusBadge(bet: MyBetItem) {
  const status = bet.status ?? 'settled'
  if (status === 'placed') return <Badge variant="info">已下注</Badge>
  if (status === 'live')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        进行中
      </span>
    )
  if (status === 'cashed_out') return <Badge variant="warning">已兑付</Badge>
  if (status === 'corrected') return <Badge variant="warning">已修正</Badge>
  const r = bet.settlementResult ?? bet.result
  const cfg = resultConfig[r ?? 'win']
  return cfg ? <Badge variant={cfg.variant}>{cfg.label}</Badge> : <Badge variant="neutral">已结算</Badge>
}

export default function MyBetsPanel({ bets: external, limit = 5 }: Props) {
  const navigate = useNavigate()
  const storeBets = useMyBetsStore((s) => s.bets)
  const source = external ?? storeBets
  if (source.length === 0) return null

  const sliced = source.slice(0, limit)
  const totalProfit = source.reduce((sum, b) => sum + (realizedProfit(b) ?? 0), 0)
  const unsettledStake = source.reduce((sum, b) => {
    const status = b.status ?? 'settled'
    return status === 'placed' || status === 'live' || status === 'pending'
      ? sum + (b.stake ?? b.amount ?? 0)
      : sum
  }, 0)

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          我的投注
          <span className="ml-1.5 text-[10px] bg-[var(--border)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-full font-bold">
            {source.length}
          </span>
        </h3>
        <div className="text-right">
          <span
            className={`block text-xs font-mono font-semibold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            全部已实现 {totalProfit >= 0 ? '+' : ''}
            {totalProfit.toFixed(2)} USDT
          </span>
          {unsettledStake > 0 && (
            <span className="block text-[10px] text-[var(--text-secondary)]">
              未结算本金 {unsettledStake.toFixed(2)} USDT
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sliced.map((bet) => {
          const stake = bet.stake ?? bet.amount ?? 0
          const profitAmount = realizedProfit(bet)
          return (
            <div key={bet.id} className="bg-[var(--bg-control)] rounded-lg p-3">
              <div className="flex items-start justify-between mb-1">
                <p className="text-[10px] text-[var(--text-secondary)] truncate flex-1 mr-2">{bet.matchLabel}</p>
                {statusBadge(bet)}
              </div>
              <p className="text-xs text-[var(--text-primary)] mb-0.5 truncate">{bet.marketTitle}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#2DD4BF] truncate">{bet.selection}</span>
                <span className="text-xs font-mono text-[var(--text-secondary)] shrink-0">@{bet.odds.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[var(--border)]/50">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  投注 {stake.toFixed(2)} USDT
                </span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    bet.status === 'settled' && bet.result === 'win'
                      ? 'text-emerald-400'
                      : bet.status === 'settled' && bet.result === 'loss'
                        ? 'text-red-400'
                        : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {bet.status === 'cashed_out' && profitAmount !== null && `已兑付 ${bet.payout.toFixed(2)}`}
                  {bet.status === 'corrected' && profitAmount !== null && `修正后 ${profitAmount >= 0 ? '+' : ''}${profitAmount.toFixed(2)}`}
                  {bet.status === 'settled' && bet.result === 'win' && profitAmount !== null && `+${profitAmount.toFixed(2)}`}
                  {bet.status === 'settled' && bet.result === 'loss' && `-${stake.toFixed(2)}`}
                  {bet.status === 'settled' && bet.result === 'push' && `退还 ${stake.toFixed(2)}`}
                  {(bet.status === 'placed' || bet.status === 'live' || bet.status === 'pending') &&
                    (bet.potentialReturn ? `可能返还 ${bet.potentialReturn.toFixed(2)}` : '')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {source.length > limit && (
        <button
          onClick={() => navigate('/soccer/mybets')}
          className="mt-3 w-full text-[10px] text-[#2DD4BF] hover:underline"
        >
          查看全部 {source.length} 条 →
        </button>
      )}
      {source.length <= limit && (
        <button
          onClick={() => navigate('/soccer/mybets')}
          className="mt-3 w-full text-[10px] text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          前往注单中心 →
        </button>
      )}
    </div>
  )
}
