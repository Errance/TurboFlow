/**
 * 下单二次确认弹窗。
 *
 * 触发阈值（满足任一即弹）：
 * - 串单腿数 ≥ 3
 * - stake ≥ 1000 USDT
 *
 * 列出每腿 + 总赔率 + 可能返还 + 可能净盈利。
 */

import Modal from '../ui/Modal'
import Button from '../ui/Button'
import type { ExtendedBetSlipItem } from '../../stores/soccerBetSlipStore'
import type { SystemType } from '../../data/soccer/contracts'
import type { BetType } from '../../data/soccer/types'
import { getSystemMeta } from '../../utils/systemBets'
import { formatOdds } from '../../utils/oddsFormat'
import { useSettingsStore } from '../../stores/settingsStore'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  items: ExtendedBetSlipItem[]
  betType: BetType
  systemType?: SystemType
  stake: number
  totalStake?: number
  totalOdds: number
  potentialReturn: number
  submitting?: boolean
}

const BET_TYPE_LABEL: Record<BetType, string> = {
  single: '单式',
  accumulator: '串关',
  system: '复式',
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ConfirmBetDialog({
  isOpen,
  onClose,
  onConfirm,
  items,
  betType,
  systemType,
  stake,
  totalStake,
  totalOdds,
  potentialReturn,
  submitting,
}: Props) {
  const oddsFormat = useSettingsStore((s) => s.oddsFormat)
  const finalStake = totalStake ?? stake
  const profit = +(potentialReturn - finalStake).toFixed(2)
  const systemLabel = betType === 'system' && systemType ? getSystemMeta(systemType).label : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="确认投注">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)]">投注方式</span>
          <span className="text-[var(--text-primary)] font-medium">
            {systemLabel ?? BET_TYPE_LABEL[betType]} · {items.length} 项
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-2">
          {items.map((it) => (
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
            </div>
          ))}
        </div>

        <div className="space-y-1.5 text-xs">
          <Row label="总赔率" value={formatOdds(totalOdds, oddsFormat)} mono />
          {systemLabel && <Row label="单注金额" value={`${fmtMoney(stake)} USDT`} mono />}
          <Row label="投注金额" value={`${fmtMoney(finalStake)} USDT`} mono />
          <Row label="可能返还" value={`${fmtMoney(potentialReturn)} USDT`} highlight mono />
          <Row label="可能净盈利" value={`${profit >= 0 ? '+' : ''}${fmtMoney(profit)} USDT`} mono />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting} className="flex-1">
            取消
          </Button>
          <Button onClick={onConfirm} disabled={submitting} className="flex-1">
            {submitting ? '提交中…' : '确认投注'}
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
