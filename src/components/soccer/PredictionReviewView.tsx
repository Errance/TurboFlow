/**
 * v4.5 预测大赛赛后回顾视图。
 *
 * 在已结算的 PredictionEntryCard 内可展开。展示三块：
 * - 各轮汇总：R16 / QF / SF / F 的命中数和得分
 * - 一句 highlight：取自 SettlementReview.highlight
 * - 逐 slot 列表：你的选择 / 实际胜者 / 是否命中 / 该 slot 得分
 */

import type { SettlementReview } from '../../data/soccer/bracketData'

interface Props {
  review: SettlementReview
  totalScore: number
  finalPayout?: number
  scoreShare?: number
}

export default function PredictionReviewView({ review, totalScore, finalPayout, scoreShare }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-control)]/40 p-4 mt-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">赛后回顾</p>
          <p className="mt-1 text-sm text-[var(--text-primary)] leading-5">{review.highlight}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-[var(--text-secondary)]">最终得分 / 派奖</p>
          <p className="mt-1 text-base font-mono font-semibold text-[#2DD4BF]">
            {totalScore} 分
          </p>
          {finalPayout !== undefined && (
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              {finalPayout.toFixed(2)} USDT
              {scoreShare !== undefined && (
                <span className="ml-1">（占 {(scoreShare * 100).toFixed(2)}%）</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {review.perRound.map((r) => (
          <div key={r.round} className="rounded-lg bg-[var(--bg-card)] px-2 py-2 text-center">
            <p className="text-[10px] text-[var(--text-secondary)]">{roundLabel(r.round)}</p>
            <p className="mt-1 text-sm font-mono text-[var(--text-primary)]">
              {r.correct} / {r.total}
            </p>
            <p className="text-[10px] text-[#2DD4BF]">+{r.points} pt</p>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">
          逐 slot 对错
        </p>
        <div className="space-y-1">
          {review.perSlot.map((s) => (
            <div
              key={s.slotId}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                s.correct ? 'bg-[#2DD4BF]/5' : 'bg-[var(--bg-card)]'
              }`}
            >
              <span className="w-12 shrink-0 font-mono text-[10px] text-[var(--text-secondary)]">
                {s.slotId}
              </span>
              <span className={`w-24 shrink-0 truncate ${s.correct ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                {s.pickedTeamLabel || '—'}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] shrink-0">→</span>
              <span className="flex-1 truncate text-[var(--text-secondary)]">
                {s.actualWinnerLabel || '待结算'}
              </span>
              <span
                className={`shrink-0 font-mono text-[10px] ${
                  s.correct ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]/60'
                }`}
              >
                {s.correct ? `+${s.pointsEarned}` : '+0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function roundLabel(round: 'R16' | 'QF' | 'SF' | 'F'): string {
  switch (round) {
    case 'R16':
      return '1/8 决赛'
    case 'QF':
      return '1/4 决赛'
    case 'SF':
      return '半决赛'
    case 'F':
      return '决赛'
  }
}
