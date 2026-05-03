/**
 * v4.5 我的预测大赛单卡。
 *
 * 状态：draft / submitted / locked / settled / refunded
 * 卡片元素：
 * - 顶部：赛事名 + 状态徽标 + 入场费 + 资金锁定时长（submitted/locked 显示）
 * - 中部：本人得分 + 占总分比例 + 投影派奖 / 最终派奖（按状态显示）
 * - 底部：操作按钮（继续填表 / 编辑 / 撤回 / 查看回顾 / 重投）
 * - 已结算可展开 PredictionReviewView
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import PredictionReviewView from './PredictionReviewView'
import {
  type BracketTournament,
  type UserBracketEntry,
  describeAttribution,
  describeEntryStatus,
  describeRefundReason,
} from '../../data/soccer/bracketData'

interface Props {
  entry: UserBracketEntry
  tournament: BracketTournament
  onWithdraw?: (entryId: string) => void
  onReplay?: (entryId: string) => void
}

export default function PredictionEntryCard({ entry, tournament, onWithdraw, onReplay }: Props) {
  const navigate = useNavigate()
  const [reviewOpen, setReviewOpen] = useState(false)

  const filled = Object.keys(entry.picks).length
  const total = tournament.slots.length
  const statusLabel = describeEntryStatus(entry.status)

  const showLockHint = entry.status === 'submitted' || entry.status === 'locked'

  const goToDetail = () => navigate(`/soccer/predictions/${tournament.id}`)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">
            预测大赛
          </p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)] truncate">
            {tournament.shortName}
          </h3>
          <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
            完成度 {filled} / {total}
            {entry.tiebreakerGuess !== undefined && ` · ${tournament.tiebreakerLabel}：${entry.tiebreakerGuess}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${statusBadgeClass(entry.status)}`}>
          {statusLabel}
          {entry.status === 'refunded' && entry.refundReason && (
            <span className="ml-1 opacity-70">· {describeRefundReason(entry.refundReason)}</span>
          )}
        </span>
      </div>

      {/* Fund lock hint */}
      {showLockHint && (
        <div className="mt-3 rounded-lg border border-[#FFB347]/30 bg-[#FFB347]/5 px-3 py-2">
          <p className="text-[10px] text-[#FFB347] uppercase tracking-wider font-semibold">
            资金锁定
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] leading-4">
            {tournament.fundLockHint}
          </p>
        </div>
      )}

      {/* Score / payout block */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="入场费" value={`${tournament.entryFee.toFixed(2)} ${tournament.currency}`} />
        {entry.totalScore !== undefined ? (
          <Stat label="本人得分" value={`${entry.totalScore} 分`} highlight />
        ) : (
          <Stat label="本人得分" value="—" />
        )}
        {entry.status === 'settled' ? (
          <Stat label="实得派奖" value={`${(entry.finalPayout ?? 0).toFixed(2)} USDT`} highlight />
        ) : entry.projectedPayout !== undefined ? (
          <Stat label="投影派奖" value={`≈ ${entry.projectedPayout.toFixed(2)}`} highlight />
        ) : (
          <Stat label="投影派奖" value="—" />
        )}
      </div>

      {entry.scoreShare !== undefined && entry.scoreShare > 0 && (
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
          本人占全员总分 {(entry.scoreShare * 100).toFixed(2)}%
          {entry.rankDisplay !== undefined && ` · 当前榜单第 ${entry.rankDisplay} 位`}
        </p>
      )}

      <p className="mt-2 text-[10px] text-[var(--text-secondary)] leading-4">
        归因：{describeAttribution(entry.attribution)}。返佣按平台规则，不改变预测大赛净池。
      </p>

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {entry.status === 'draft' && (
          <Button variant="primary" onClick={goToDetail} className="!py-1.5 !text-xs">
            继续填表
          </Button>
        )}
        {entry.status === 'submitted' && (
          <>
            <Button variant="secondary" onClick={goToDetail} className="!py-1.5 !text-xs">
              编辑预测
            </Button>
            {onWithdraw && (
              <Button variant="ghost" onClick={() => onWithdraw(entry.id)} className="!py-1.5 !text-xs">
                锁前撤回
              </Button>
            )}
          </>
        )}
        {entry.status === 'locked' && (
          <Button variant="secondary" onClick={goToDetail} className="!py-1.5 !text-xs">
            查看预测
          </Button>
        )}
        {entry.status === 'settled' && (
          <>
            <Button
              variant="secondary"
              onClick={() => setReviewOpen((v) => !v)}
              className="!py-1.5 !text-xs"
            >
              {reviewOpen ? '收起回顾' : '查看回顾'}
            </Button>
            {onReplay && (
              <Button variant="ghost" onClick={() => onReplay(entry.id)} className="!py-1.5 !text-xs">
                查看下届
              </Button>
            )}
          </>
        )}
        {entry.status === 'refunded' && (
          <Button variant="ghost" onClick={goToDetail} className="!py-1.5 !text-xs">
            查看赛事
          </Button>
        )}
      </div>

      {entry.status === 'settled' && entry.review && reviewOpen && (
        <PredictionReviewView
          review={entry.review}
          totalScore={entry.totalScore ?? 0}
          finalPayout={entry.finalPayout}
          scoreShare={entry.scoreShare}
        />
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-[var(--bg-control)] px-2.5 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p
        className={`mt-1 text-xs font-mono ${
          highlight ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function statusBadgeClass(status: UserBracketEntry['status']): string {
  switch (status) {
    case 'draft':
      return 'bg-[var(--bg-control)] text-[var(--text-secondary)]'
    case 'submitted':
      return 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
    case 'locked':
      return 'bg-[#3B82F6]/15 text-[#3B82F6]'
    case 'settled':
      return 'bg-[#FFB347]/15 text-[#FFB347]'
    case 'refunded':
      return 'bg-[var(--bg-control)] text-[var(--text-secondary)]/80'
  }
}
