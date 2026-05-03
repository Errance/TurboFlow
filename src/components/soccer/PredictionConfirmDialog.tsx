/**
 * v4.5 预测大赛二次确认弹窗。
 *
 * 不复用 v4.3 的 ConfirmBetDialog，因为字段完全不同：
 * - 入场费金额、当前奖金池总额
 * - 派奖规则一句话摘要
 * - 资金锁定时长醒目提示（fundLockHint）
 * - 锁定时间倒计时
 * - "我已了解上述规则" 勾选 + 确认按钮
 *
 * 设计意图：
 * - 资金锁定时长必须以醒目带样式呈现，绝不折叠
 * - 第一次提交时强制勾选，避免无意识下单
 */

import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import type { BracketTournament } from '../../data/soccer/bracketData'
import { formatLockCountdown } from '../../data/soccer/bracketData'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tournament: BracketTournament
  picksCount: number
  totalSlots: number
  tiebreakerGuess?: number
}

export default function PredictionConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  tournament,
  picksCount,
  totalSlots,
  tiebreakerGuess,
}: Props) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setAcknowledged(false)
    onClose()
  }

  const countdown = formatLockCountdown(tournament.lockAt)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="确认提交预测" className="max-w-lg">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">赛事</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{tournament.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="入场费" value={`${tournament.entryFee.toFixed(2)} ${tournament.currency}`} highlight />
          <Stat label="当前奖金池" value={`${tournament.poolSnapshot.netPool.toLocaleString()} USDT`} />
          <Stat label="保底池" value={`${tournament.guaranteedPool.toLocaleString()} USDT`} />
          <Stat label="最低成团" value={`${tournament.minEntrants.toLocaleString()} 人`} />
          <Stat label="抽水比例" value={`${(tournament.rake * 100).toFixed(0)}%`} />
          <Stat
            label="完成度"
            value={`${picksCount} / ${totalSlots} slot${tiebreakerGuess !== undefined ? ' + tiebreaker' : ''}`}
          />
        </div>

        <div className="rounded-xl border border-[#FFB347]/40 bg-[#FFB347]/10 px-4 py-3">
          <p className="text-[10px] text-[#FFB347] uppercase tracking-wider font-semibold">
            资金锁定提示
          </p>
          <p className="mt-1 text-sm text-[var(--text-primary)] leading-5">
            {tournament.fundLockHint}
          </p>
          <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
            锁定倒计时：<span className="font-mono text-[var(--text-primary)]">{countdown}</span>
          </p>
        </div>

        <div className="rounded-xl bg-[var(--bg-control)] px-4 py-3">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            派奖规则
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-5">
            按命中率分奖：派奖 = (本人得分 / 全员总分) × 净池。R16=1pt × 8 / QF=2pt × 4 / SF=4pt × 2 / 决赛=8pt，满分 32 分。
            得 0 分者不派奖。{tournament.tiebreakerLabel} 仅用于榜单展示排序，不影响派奖。
            {tournament.lateStrategyLabel}
          </p>
        </div>

        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-control)] accent-[#2DD4BF]"
          />
          <span className="text-xs text-[var(--text-secondary)] leading-5">
            我已了解上述规则，确认以 {tournament.entryFee.toFixed(2)} {tournament.currency} 入场，资金锁前可全额撤回。
          </span>
        </label>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleClose} fullWidth>
            返回修改
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!acknowledged}
            loading={submitting}
            fullWidth
          >
            确认提交
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p
        className={`mt-1 text-sm font-mono ${
          highlight ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
