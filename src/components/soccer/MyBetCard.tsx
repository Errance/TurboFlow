/**
 * 注单卡片。支持：
 * - 状态 badge（placed 蓝 / live 红脉动 / settled 按 result 上色 / cashed_out 橙 / corrected 黄）
 * - placedAt 相对时间
 * - betCode 小字（点击复制）
 * - 单式简洁展示；串单可折叠明细
 * - Cash Out（placed / live 且未过期）
 * - 重投按钮（duplicateToSlip）
 * - corrected 黄色 banner + 差额展示
 * - push/void 腿重算赔率提示
 */

import { useMemo, useState } from 'react'
import type { MyBetItem, MyBetLeg, SettlementResult } from '../../data/soccer/types'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatOdds } from '../../utils/oddsFormat'
import { getSystemMeta } from '../../utils/systemBets'

interface Props {
  bet: MyBetItem
  onCashOut?: (bet: MyBetItem) => void
  onReplay?: (bet: MyBetItem) => void
  onCopyCode?: (code: string) => void
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function relativeTime(iso?: string): string {
  if (!iso) return '-'
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  if (diff < 0) return '刚刚'
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  return `${d} 天前`
}

const RESULT_LABEL: Partial<Record<SettlementResult, string>> = {
  win: '赢',
  loss: '输',
  push: '退款',
  void: '作废',
  half_win: '半赢',
  half_loss: '半输',
  dead_heat: '平分奖金',
}

function StatusBadge({ bet }: { bet: MyBetItem }) {
  const status = bet.status ?? 'settled'
  if (status === 'placed')
    return <Badge variant="neutral">已下注</Badge>
  if (status === 'live')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        进行中
      </span>
    )
  if (status === 'cashed_out')
    return <Badge variant="warning">已提前结清</Badge>
  if (status === 'corrected')
    return <Badge variant="warning">已修正</Badge>
  // settled
  const r = bet.settlementResult ?? bet.result
  if (r === 'win' || r === 'half_win' || r === 'dead_heat') return <Badge variant="success">{RESULT_LABEL[r]}</Badge>
  if (r === 'loss' || r === 'half_loss') return <Badge variant="danger">{RESULT_LABEL[r]}</Badge>
  if (r === 'push' || r === 'void') return <Badge variant="neutral">{RESULT_LABEL[r]}</Badge>
  return <Badge variant="neutral">已结算</Badge>
}

function recalcOddsDetail(leg: MyBetLeg): { effective: number; note?: string } {
  if (leg.result === 'push' || leg.result === 'void' || leg.oddsAfterRecalc === 1) {
    return { effective: 1, note: '退本按 1.00 参与计算' }
  }
  return { effective: leg.oddsAfterRecalc ?? leg.oddsAtPlacement }
}

export default function MyBetCard({ bet, onCashOut, onReplay, onCopyCode }: Props) {
  const [expanded, setExpanded] = useState(false)
  const oddsFormat = useSettingsStore((s) => s.oddsFormat)

  const legs = useMemo(() => bet.legs ?? [], [bet.legs])
  const isParlay = (bet.betType && bet.betType !== 'single') || legs.length > 1

  const effectiveTotalOdds = useMemo(() => {
    if (legs.length === 0) return bet.odds
    if (bet.betType === 'system') return bet.odds
    return legs.reduce((acc, l) => acc * recalcOddsDetail(l).effective, 1)
  }, [legs, bet.odds, bet.betType])

  const effectiveReturn =
    bet.betType === 'system'
      ? (bet.potentialReturn ?? (bet.unitStake ?? 0) * effectiveTotalOdds)
      : (bet.stake ?? bet.amount) * effectiveTotalOdds

  const canCashOut = (bet.status === 'placed' || bet.status === 'live') && bet.cashout
  const showReplay = !!onReplay && legs.length > 0

  return (
    <div className="bg-[var(--bg-control)] rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <StatusBadge bet={bet} />
            {bet.betType && bet.betType !== 'single' && (
              <span className="text-[10px] text-[var(--text-secondary)]">
                {bet.betType === 'accumulator'
                  ? '串关'
                  : `${bet.systemType ? getSystemMeta(bet.systemType).label : '复式'}${bet.systemLineCount ? ` · ${bet.systemLineCount} 注` : ''}`} · {legs.length} 项
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-primary)] truncate">{bet.matchLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-[var(--text-secondary)]">{relativeTime(bet.placedAt)}</p>
          {bet.betCode && (
            <button
              onClick={() => {
                if (onCopyCode && bet.betCode) onCopyCode(bet.betCode)
              }}
              className="text-[10px] font-mono text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
              title="点击复制注单编码"
            >
              {bet.betCode}
            </button>
          )}
        </div>
      </div>

      {!isParlay && (
        <>
          <p className="text-[11px] text-[var(--text-primary)]">{bet.marketTitle}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#2DD4BF]">{bet.selection}</span>
            <span className="text-xs font-mono text-[var(--text-primary)]">
              @{formatOdds(bet.odds, oddsFormat)}
            </span>
          </div>
        </>
      )}

      {isParlay && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>
              总赔率 {formatOdds(effectiveTotalOdds, oddsFormat)}
              {Math.abs(effectiveTotalOdds - bet.odds) > 0.01 && (
                <span className="ml-1 line-through text-[var(--text-secondary)]/60">
                  {formatOdds(bet.odds, oddsFormat)}
                </span>
              )}
            </span>
            <span>{expanded ? '收起明细' : `展开 ${legs.length} 项`}</span>
          </button>
          {expanded && (
            <div className="space-y-1.5 border-t border-[var(--border)] pt-2">
              {legs.map((l) => {
                const detail = recalcOddsDetail(l)
                return (
                  <div key={l.id} className="bg-[var(--bg-card)] rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{l.matchLabel}</p>
                      {l.result && (
                        <span
                          className={`text-[10px] ${
                            l.result === 'win' || l.result === 'half_win'
                              ? 'text-emerald-400'
                              : l.result === 'loss' || l.result === 'half_loss'
                                ? 'text-red-400'
                                : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {RESULT_LABEL[l.result] ?? l.result}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="min-w-0">
                        <p className="text-[11px] text-[var(--text-primary)] truncate">{l.marketTitle}</p>
                        <span className="text-[11px] text-[#2DD4BF]">{l.selection}</span>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <span className="text-[11px] font-mono text-[var(--text-primary)]">
                          @{formatOdds(detail.effective, oddsFormat)}
                        </span>
                        {detail.note && (
                          <p className="text-[9px] text-amber-400 mt-0.5">{detail.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <div className="border-t border-[var(--border)] pt-2 grid grid-cols-2 gap-2 text-[10px]">
        <KV label="投注" value={`${fmtMoney(bet.stake ?? bet.amount)} USDT`} />
        <KV
              label={bet.status === 'cashed_out' ? '已提前结清' : bet.status === 'settled' ? '返还' : '可能返还'}
          value={
            bet.status === 'cashed_out'
              ? `${fmtMoney(bet.payout)} USDT`
              : bet.status === 'settled'
                ? `${fmtMoney(bet.payout)} USDT`
                : `${fmtMoney(effectiveReturn)} USDT`
          }
          highlight={bet.status === 'cashed_out' || (bet.status === 'settled' && bet.payout > 0)}
        />
      </div>

      {bet.correction && (
        <div className="px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
          结果已修正 · {RESULT_LABEL[bet.correction.originalResult] ?? bet.correction.originalResult} →{' '}
          {RESULT_LABEL[bet.correction.newResult] ?? bet.correction.newResult}
          {bet.correction.diffPayout !== 0 && (
            <span className="ml-1 font-mono">
              差额 {bet.correction.diffPayout >= 0 ? '+' : ''}
              {fmtMoney(bet.correction.diffPayout)} USDT
            </span>
          )}
        </div>
      )}

      {(canCashOut || showReplay) && (
        <div className="flex gap-2 pt-1">
          {canCashOut && onCashOut && (
            <Button
              variant="primary"
              className="flex-1 !py-1.5 !text-xs"
              onClick={() => onCashOut(bet)}
            >
              提前结清 {bet.cashout ? fmtMoney(bet.cashout.availablePrice) : ''}
              {bet.cashout?.isSimulated ? ' · 参考报价' : ''}
            </Button>
          )}
          {showReplay && onReplay && (
            <Button
              variant="ghost"
              className="flex-1 !py-1.5 !text-xs"
              onClick={() => onReplay(bet)}
            >
              重投
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={`font-mono ${highlight ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'}`}
      >
        {value}
      </span>
    </div>
  )
}
