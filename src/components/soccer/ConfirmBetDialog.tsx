import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import type { ExtendedBetSlipItem } from '../../stores/soccerBetSlipStore'
import type { BetType } from '../../data/soccer/types'
import { formatOdds } from '../../utils/oddsFormat'
import { useSettingsStore } from '../../stores/settingsStore'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onAcceptOddsChange: (itemId: string) => void
  onAcceptAllOddsChanges: () => void
  items: ExtendedBetSlipItem[]
  betType: BetType
  stake: number
  totalStake?: number
  totalOdds: number
  potentialReturn: number
  submitting?: boolean
}

const BET_TYPE_LABEL: Record<BetType, string> = {
  multi_single: '多笔单注',
  accumulator: '串关',
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ConfirmBetDialog({
  isOpen,
  onClose,
  onConfirm,
  onAcceptOddsChange,
  onAcceptAllOddsChanges,
  items,
  betType,
  stake,
  totalStake,
  totalOdds,
  potentialReturn,
  submitting,
}: Props) {
  const oddsFormat = useSettingsStore((s) => s.oddsFormat)
  const finalStake = totalStake ?? stake
  const profit = +(potentialReturn - finalStake).toFixed(2)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isOpen) return
    setNow(Date.now())
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isOpen])

  const itemsNeedingAcceptance = useMemo(() => {
    return items.filter((it) => {
      const quoteExpired = it.quoteState === 'needs_refresh' || !it.oddsLockedUntil || it.oddsLockedUntil <= now
      return quoteExpired || it.oddsCurrent !== it.oddsAtAdd
    })
  }, [items, now])
  const hasBlockingOddsChange = itemsNeedingAcceptance.length > 0
  const primaryButtonLabel = submitting
    ? '提交中…'
    : hasBlockingOddsChange
      ? '接受最新报价'
      : '确认投注'
  const handlePrimaryAction = () => {
    if (hasBlockingOddsChange) {
      onAcceptAllOddsChanges()
      return
    }
    onConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="确认投注">
      <div className="space-y-3">
        <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">投注方式</span>
            <span className="text-[var(--text-primary)] font-medium">
              {BET_TYPE_LABEL[betType]} · {items.length} 项
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">确认要求</span>
            <span className="text-[var(--text-primary)] font-medium">
              {hasBlockingOddsChange ? '请先接受最新报价' : '请核对后提交'}
            </span>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-2">
          {items.map((it) => {
            const oddsChanged = it.oddsCurrent !== it.oddsAtAdd
            const quoteExpired = it.quoteState === 'needs_refresh' || !it.oddsLockedUntil || it.oddsLockedUntil <= now
            const needsAccept = oddsChanged || quoteExpired
            return (
              <div key={it.id} className="bg-[var(--bg-control)] rounded-md px-2.5 py-1.5">
                <p className="text-[10px] text-[var(--text-secondary)] truncate">{it.matchLabel}</p>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-primary)] truncate">{it.marketTitle}</p>
                    <span className="text-xs text-[#2DD4BF]">{it.selection}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)] ml-2 shrink-0">
                    {formatOdds(it.oddsCurrent, oddsFormat)}
                  </span>
                </div>
                {needsAccept && (
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-amber-300">
                      {oddsChanged
                        ? `赔率 ${formatOdds(it.oddsAtAdd, oddsFormat)} → ${formatOdds(it.oddsCurrent, oddsFormat)}`
                        : '报价已过期，请接受最新报价'}
                    </span>
                    <button
                      onClick={() => onAcceptOddsChange(it.id)}
                      className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-[#2DD4BF]/15 text-[#2DD4BF] hover:bg-[#2DD4BF]/25 transition-colors"
                    >
                      接受
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {hasBlockingOddsChange && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
            <span className="text-[10px] text-amber-300">
              报价已更新。接受最新报价后，请再次核对金额和可能返还。
            </span>
          </div>
        )}

        <div className="space-y-1.5 text-xs">
          {betType === 'accumulator' && <Row label="总赔率" value={formatOdds(totalOdds, oddsFormat)} mono />}
          <Row label={betType === 'multi_single' ? '单笔金额' : '投注金额'} value={`${fmtMoney(stake)} USDT`} mono />
          {betType === 'multi_single' && <Row label="合计投注金额" value={`${fmtMoney(finalStake)} USDT`} mono />}
          <Row label="可能返还" value={`${fmtMoney(potentialReturn)} USDT`} highlight mono />
          <Row label="可能净盈利" value={`${profit >= 0 ? '+' : ''}${fmtMoney(profit)} USDT`} mono />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting} className="flex-1">
            取消
          </Button>
          <Button
            onClick={handlePrimaryAction}
            disabled={submitting}
            className="flex-1"
          >
            {primaryButtonLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={[
          mono ? 'font-mono' : '',
          highlight ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
